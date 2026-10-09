const G10=['USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD','SEK','NOK'];
const BASE='https://tradinglab-macro-terminal.vercel.app/api/';
async function read(name,query=''){
 const r=await fetch(BASE+name+query,{signal:AbortSignal.timeout(22000),cache:'no-store'});
 return {status:r.status,ok:r.ok,data:await r.json()};
}
function auditSeries(events){
 const groups=new Map();
 for(const e of events||[]){
  if(!e.event||!(e.referenceDate||e.reference)||!e.releaseDate||e.actual==null||!Number.isFinite(Number(e.actual)))continue;
  const k=String(e.event),period=String(e.referenceDate||e.reference);
  if(!groups.has(k))groups.set(k,{frequency:e.frequency||(/gdp|quarter|q\/q/i.test(k)?'quarterly':'monthly'),periods:new Set()});
  groups.get(k).periods.add(period);
 }
 return [...groups].map(([name,g])=>({name,frequency:g.frequency,observations:g.periods.size,required:g.frequency==='quarterly'?2:6,coverageComplete:g.periods.size>=(g.frequency==='quarterly'?2:6)}));
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const checkedAt=new Date().toISOString(),configured=!!process.env.TRADING_ECONOMICS_KEY;
 if(req.query?.deep!=='1')return res.status(200).json({ok:true,service:'tradinglab-macro-terminal',checkedAt,version:'data-quality-v3',economicProviderConfigured:configured,dataReady:null,notice:'Liveness only; use deep=1 for provider and history checks.'});
 const names=['calendar','rates','economic','markets','news','sectors','commodity-calendar'];
 const checks=await Promise.all(names.map(async name=>{
  try{
   const {ok,status,data:d}=await read(name);
   let ready=ok&&d.mode==='live',reason=ready?'live':d.mode||'upstream error',overdue=0;
   if(name==='calendar'){
    overdue=(d.events||[]).filter(e=>e.releaseState==='overdue').length;
    const numeric=(d.events||[]).filter(e=>e.releaseState==='overdue'&&!/speaks|minutes|accounts|speech|meetings|auction/i.test(e.event)).length;
    if(numeric){ready=false;reason=numeric+' overdue releases ('+overdue+' total)';}
   }
   if(name==='commodity-calendar'){
    overdue=(d.events||[]).filter(e=>e.releaseState==='overdue').length;
    if(overdue){ready=false;reason=overdue+' overdue or unverified commodity reports';}
   }
   if(name==='rates'&&d.liveCount<d.totalCount){ready=false;reason=(d.liveCount||0)+'/'+d.totalCount+' banks available';}
   return {service:name,ready,httpStatus:status,mode:d.mode||null,reason,overdue,sourceUpdatedAt:d.sourceUpdatedAt||null};
  }catch(e){return {service:name,ready:false,reason:'timeout or invalid response',error:String(e?.message||e)};}
 }));
 const economicHistory=await Promise.all(G10.map(async currency=>{
  if(!configured)return {currency,ready:false,mode:'not-configured',series:[]};
  try{
   const {ok,status,data}=await read('economic','?currency='+currency+'&months=12');
   const series=auditSeries(data.events);
   return {currency,ready:ok&&data.mode==='live'&&series.length>0&&series.every(x=>x.coverageComplete),mode:data.mode,httpStatus:status,series,sourceUpdatedAt:data.sourceUpdatedAt||null};
  }catch(e){return {currency,ready:false,mode:'unavailable',error:String(e?.message||e),series:[]};}
 }));
 return res.status(200).json({ok:true,dataReady:checks.every(x=>x.ready)&&economicHistory.every(x=>x.ready),checkedAt,version:'data-quality-v3',checks,economicHistory,notice:'Coverage counts are not independent primary-source verification. Confirm release dates and provenance before trusting series.'});
}
