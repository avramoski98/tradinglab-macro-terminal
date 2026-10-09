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
function iso(date,time){const [y,m,day]=date.split('-').map(Number);const lastSunday=mo=>{const d=new Date(Date.UTC(y,mo+1,0));return d.getUTCDate()-d.getUTCDay()};const dst=(m>3&&m<10)||(m===3&&day>=lastSunday(2))||(m===10&&day<lastSunday(9));return `${date}T${time}:00${dst?'+02:00':'+01:00'}`;}
function usdaRows(){const now=Date.now();return USDA_EVENTS.map(([date,time,event,category,importance,source,markets,format])=>{const released=now>=new Date(iso(date,time)).getTime();return {date:iso(date,time),timeZone:TARGET_TZ,country:'COM',currency:'COM',event,category,markets,importance,source,previous:'—',forecast:format,actual:'—',label:released?'UNVERIFIED':'PENDING',releaseState:released?'overdue':'scheduled',impact:'Report-driven',note:'USDA releases are multi-metric: production, yield, stocks, exports/imports and other crop-specific fields. There is no single CPI-style headline Actual.'};});}
async function ff(url){try{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TradingLabMacroTerminal/5.1'},cache:'no-store'});if(!r.ok)return[];const j=await r.json();return Array.isArray(j)?j:[]}catch(e){return[]}}
function energyRows(raw){return raw.filter(x=>/crude oil inventories|natural gas storage|gasoline inventories|distillate inventories/i.test(String(x.title||x.event||''))).map(x=>{const event=x.title||x.event||'';const actual=x.actual??'—',forecast=x.forecast??'—';return {date:x.date,country:'COM',currency:'COM',event:`EIA · ${event}`,category:/natural gas/i.test(event)?'ENERGY · GAS':'ENERGY · OIL',markets:/natural gas/i.test(event)?'Natural Gas':'WTI · Brent · Products',importance:/crude oil inventories|natural gas storage/i.test(event)?'HIGH':'MED',source:'ForexFactory / EIA',previous:x.previous??'—',forecast,actual,label:actual&&actual!=='—'?surprise(event,actual,forecast):(Date.parse(x.date)<Date.now()?'OVERDUE':'PENDING'),releaseState:actual&&actual!=='—'?'released':(Date.parse(x.date)<Date.now()?'overdue':'scheduled'),impact:'Inventory surprise',note:'Energy inventories support classic Previous / Forecast / Actual because the release has a single headline change.'};});}

const VERIFIED_EIA=[
 {date:'2026-10-07T16:30:00+02:00',event:'Crude Oil Inventories',actual:'-3.186M',forecast:'1.900M',previous:'0.922M',category:'ENERGY · OIL',markets:'WTI · Brent · Products',sourceUrl:'https://www.investing.com/economic-calendar/eia-crude-oil-inventories-75'},
 {date:'2026-10-08T16:30:00+02:00',event:'Natural Gas Storage',actual:'85B',forecast:'79B',previous:'64B',category:'ENERGY · GAS',markets:'Natural Gas',sourceUrl:'https://www.forexfactory.com/calendar/26-us-natural-gas-storage'}
];
function knownEiaRows(){return VERIFIED_EIA.map(x=>({...x,country:'COM',currency:'COM',event:'EIA · '+x.event,importance:'HIGH',source:'EIA figures via published secondary calendar',verificationStatus:'verified-secondary',label:surprise(x.event,x.actual,x.forecast),releaseState:'released',impact:'Inventory surprise',note:'Reported EIA Actual and secondary-source forecast; official EIA report should be cross-checked.'}));}
function reconcileEia(providerRows){
 const out=[...providerRows];
 for(const known of knownEiaRows()){
  const match=out.find(x=>String(x.date||'').slice(0,10)===known.date.slice(0,10)&&String(x.event||'').toLowerCase().includes(known.event.slice(6).toLowerCase()));
  if(!match)out.push(known);
  else if(match.releaseState!=='released')Object.assign(match,known);
 }
 return out;
}

export default async function handler(req,res){res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');const [a,b]=await Promise.all([ff(FF_THIS_WEEK),ff(FF_NEXT_WEEK)]);const events=[...usdaRows(),...reconcileEia(energyRows([...a,...b]))].sort((x,y)=>new Date(x.date)-new Date(y.date));return res.status(200).json({mode:(a.length||b.length)?'live':'schedule-fallback',provider:'USDA NASS + USDA WASDE schedule + EIA/ForexFactory',timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'EIA inventory releases use Previous / Forecast / Actual where available. USDA WASDE/Crop Production are multi-metric reports, so Forecast and Actual are report-level labels rather than one headline number.'});}
