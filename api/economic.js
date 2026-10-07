import {COUNTRIES,fetchEconomicCalendar} from '../lib/economic-provider.mjs';
const memory=new Map();
export default async function handler(req,res){
 const ccy=String(req.query?.currency||'USD').toUpperCase(),months=Number(req.query?.months||6);
 res.setHeader('Cache-Control','no-store');
 if(!COUNTRIES[ccy]||![3,6,12].includes(months))return res.status(400).json({mode:'invalid-query',events:[],error:'Supported currency and 3, 6 or 12 months required.'});
 const checkedAt=new Date().toISOString(),key=process.env.TRADING_ECONOMICS_KEY;
 if(!key)return res.status(503).json({mode:'not-configured',currency:ccy,events:[],checkedAt,sourceUpdatedAt:null,notice:'Historical releases and consensus provider is not connected.'});
 const cacheKey=ccy+'|'+months,cached=memory.get(cacheKey);
 if(cached&&Date.now()-cached.at<60000){res.setHeader('Cache-Control','s-maxage=30');return res.status(200).json({...cached.data,checkedAt,cache:'hit'});}
 try{
  const end=new Date(),start=new Date(end);start.setUTCMonth(start.getUTCMonth()-months);start.setUTCDate(1);
  const events=await fetchEconomicCalendar([COUNTRIES[ccy]],start.toISOString().slice(0,10),end.toISOString().slice(0,10),key);
  const timestamps=events.map(x=>x.sourceUpdatedAt).filter(Boolean).sort();
  const data={mode:events.length?'live':'empty',provider:'Trading Economics',currency:ccy,months,events,checkedAt,sourceUpdatedAt:timestamps.at(-1)||null};
  memory.set(cacheKey,{at:Date.now(),data});res.setHeader('Cache-Control','s-maxage=30');return res.status(200).json(data);
 }catch{return res.status(503).json({mode:'unavailable',currency:ccy,events:[],checkedAt,sourceUpdatedAt:null,notice:'Economic provider unavailable. No replacement values were generated.'});}
}
