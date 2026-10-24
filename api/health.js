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

async function readVerifiedArchive(checkedAt){
 const response=await fetch('https://tradinglab-macro-terminal.vercel.app/assets/economic-archive.json',{cache:'no-store',signal:AbortSignal.timeout(22000)});
 if(!response.ok)throw new Error('archive HTTP '+response.status);
 const archive=await response.json();
 const currencies=G10.map(currency=>{
  const groups=new Map();
  for(const row of archive.currencies?.[currency]||[]){
   if(!['inflation','labor','growth'].includes(row.category)||!row.event)continue;
   if(/weekly|jobless claims/i.test(row.event))continue;
   const key=row.category+'|'+row.event;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(row);
  }
  const series=[...groups].map(([key,rows])=>{
   const [category,...parts]=key.split('|'),name=parts.join('|');
   const quarterly=/q\/q|quarter|GDP/i.test(name)||(currency==='NZD'&&/unemployment rate/i.test(name));
   const verified=rows.filter(row=>row.verificationStatus==='verified-primary'&&row.releaseDate&&row.sourceUrl&&Number.isFinite(Number(row.actual)));
   const periods=[...new Set(verified.map(row=>String(row.reference||row.referenceDate||'').slice(0,7)).filter(Boolean))].sort();
   const required=quarterly?2:6;
   const sourceTimes=verified.flatMap(row=>[row.sourceUpdatedAt,row.releaseDate]).map(s=>Date.parse(s||'')).filter(Number.isFinite);
   const lastUpdate=sourceTimes.length?new Date(Math.max(...sourceTimes)).toISOString():null;
   const ageDays=lastUpdate?Math.floor((Date.parse(checkedAt)-Date.parse(lastUpdate))/86400000):null;
   const freshness=ageDays===null?'NO_PRIMARY_LAST_UPDATE':ageDays<0?'FUTURE_DATE_ERROR':ageDays<=(quarterly?120:45)?'FRESH':'STALE';
   return {category,name,frequency:quarterly?'quarterly':'monthly',primaryVerified:periods.length,secondaryVerified:rows.filter(row=>row.verificationStatus==='verified-secondary').length,required,coverageComplete:periods.length>=required,periods,lastUpdate,ageDays,freshness};
  }).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  return {currency,series,complete:series.filter(s=>s.coverageComplete).length,total:series.length};
 });
 const all=currencies.flatMap(c=>c.series);
 return {mode:'verified-static-archive',checkedAt,archiveCheckedAt:archive.audit?.checkedAt||null,complete:all.filter(s=>s.coverageComplete).length,total:all.length,incomplete:all.filter(s=>!s.coverageComplete).map(s=>({currency:currencies.find(c=>c.series.includes(s))?.currency,category:s.category,name:s.name,primaryVerified:s.primaryVerified,required:s.required,lastUpdate:s.lastUpdate})),currencies,notice:'Primary-only static archive audit, independent of Trading Economics. Source timestamps are publication/revision dates, not proof of a live provider. Freshness is based on 45-day monthly / 120-day quarterly thresholds.'};
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
   if(name==='markets'&&(!d.quoteTimestamp||!Number.isFinite(Date.parse(d.quoteTimestamp))||Date.now()-Date.parse(d.quoteTimestamp)>15*60000)){ready=false;reason='Provider returned last-available prices without a verifiable quote timestamp';}
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
 const archiveHistory=await readVerifiedArchive(checkedAt).catch(error=>({mode:'unavailable',checkedAt,error:String(error?.message||error),complete:null,total:null}));
 return res.status(200).json({ok:true,dataReady:checks.every(x=>x.ready)&&economicHistory.every(x=>x.ready)&&archiveHistory.complete===archiveHistory.total,checkedAt,version:'data-quality-v4',checks,economicHistory,archiveHistory,notice:'Archive primary-source coverage is audited independently of the unavailable live economic provider. Quote retrieval time is not market quote time.'});
}
