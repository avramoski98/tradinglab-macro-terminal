export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');const checkedAt=new Date().toISOString();
 if(req.query?.deep!=='1')return res.status(200).json({ok:true,service:'tradinglab-macro-terminal',checkedAt,version:'data-quality-v2',economicProviderConfigured:!!process.env.TRADING_ECONOMICS_KEY,dataReady:null,notice:'Liveness only. Use deep=1 for provider and overdue-release checks.'});
 const paths=['calendar','rates','economic','markets','news','sectors'];
 const checks=await Promise.all(paths.map(async name=>{try{const r=await fetch('https://tradinglab-macro-terminal.vercel.app/api/'+name,{signal:AbortSignal.timeout(22000)});const d=await r.json();let ready=r.ok&&d.mode==='live',reason=ready?'live':d.mode||'upstream error';if(name==='calendar'){const overdue=(d.events||[]).filter(e=>e.releaseState==='overdue'&&!/speaks|minutes|accounts|speech/i.test(e.event)).length;if(overdue){ready=false;reason=overdue+' overdue numeric releases';}}
 if(name==='rates'&&d.liveCount<d.totalCount){ready=false;reason=(d.liveCount||0)+'/'+d.totalCount+' banks available';}
 return {service:name,ready,httpStatus:r.status,mode:d.mode||null,reason,sourceUpdatedAt:d.sourceUpdatedAt||null};}catch{return {service:name,ready:false,reason:'timeout or invalid response'};}}));
 const dataReady=checks.every(x=>x.ready);return res.status(200).json({ok:true,dataReady,checkedAt,version:'data-quality-v2',checks});
}
