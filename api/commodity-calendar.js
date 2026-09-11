const TARGET_TZ='Europe/Skopje';
const FF_THIS_WEEK='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_NEXT_WEEK='https://nfs.faireconomy.media/ff_calendar_nextweek.json';

const USDA_EVENTS=[
  ['2026-09-11','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-09-11','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-09-11','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-09-14','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-09-17','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-09-18','21:00','Hop Stocks','SOFTS','LOW','USDA NASS','Hops','Stocks report'],
  ['2026-09-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-09-24','21:00','Hogs and Pigs','LIVESTOCK','HIGH','USDA NASS','Lean Hogs','Inventory report'],
  ['2026-09-30','18:00','Grain Stocks','GRAINS','HIGH','USDA NASS','Corn · Wheat · Soybeans','Stocks by crop'],
  ['2026-09-30','18:00','Small Grains Summary','GRAINS','HIGH','USDA NASS','Wheat · Oats · Barley','Production report'],
  ['2026-10-09','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-10-09','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-10-09','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-10-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-11-10','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-11-10','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-11-10','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-11-23','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-12-10','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-12-10','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-12-10','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-12-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report']
];

function num(v){if(v==null)return NaN;return Number(String(v).replace(/,/g,'').replace(/[^0-9+-.]/g,''));}
function surprise(event,actual,forecast){const a=num(actual),f=num(forecast);if(!Number.isFinite(a)||!Number.isFinite(f))return'—';if(a===f)return'IN LINE';const lower=/crude oil inventories|natural gas storage|gasoline inventories/i.test(event);return lower?(a<f?'BULLISH':'BEARISH'):(a>f?'BEAT':'MISS');}
function iso(date,time){return `${date}T${time}:00+02:00`;}
function usdaRows(){const now=Date.now();return USDA_EVENTS.map(([date,time,event,category,importance,source,markets,format])=>{const released=now>=new Date(iso(date,time)).getTime();return {date:iso(date,time),timeZone:TARGET_TZ,country:'COM',currency:'COM',event,category,markets,importance,source,previous:'—',forecast:format,actual:released?'REPORT RELEASED':'—',label:released?'RELEASED':'PENDING',impact:'Report-driven',note:'USDA releases are multi-metric: production, yield, stocks, exports/imports and other crop-specific fields. There is no single CPI-style headline Actual.'};});}
async function ff(url){try{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TradingLabMacroTerminal/5.1'},cache:'no-store'});if(!r.ok)return[];const j=await r.json();return Array.isArray(j)?j:[]}catch(e){return[]}}
function energyRows(raw){return raw.filter(x=>/crude oil inventories|natural gas storage|gasoline inventories|distillate inventories/i.test(String(x.title||x.event||''))).map(x=>{const event=x.title||x.event||'';const actual=x.actual??'—',forecast=x.forecast??'—';return {date:x.date,country:'COM',currency:'COM',event:`EIA · ${event}`,category:/natural gas/i.test(event)?'ENERGY · GAS':'ENERGY · OIL',markets:/natural gas/i.test(event)?'Natural Gas':'WTI · Brent · Products',importance:/crude oil inventories|natural gas storage/i.test(event)?'HIGH':'MED',source:'ForexFactory / EIA',previous:x.previous??'—',forecast,actual,label:actual&&actual!=='—'?surprise(event,actual,forecast):'PENDING',impact:'Inventory surprise',note:'Energy inventories support classic Previous / Forecast / Actual because the release has a single headline change.'};});}
export default async function handler(req,res){res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');const [a,b]=await Promise.all([ff(FF_THIS_WEEK),ff(FF_NEXT_WEEK)]);const events=[...usdaRows(),...energyRows([...a,...b])].sort((x,y)=>new Date(x.date)-new Date(y.date));return res.status(200).json({mode:'live',provider:'USDA NASS + USDA WASDE schedule + EIA/ForexFactory',timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'EIA inventory releases use Previous / Forecast / Actual where available. USDA WASDE/Crop Production are multi-metric reports, so Forecast and Actual are report-level labels rather than one headline number.'});}
