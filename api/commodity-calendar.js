const TARGET_TZ='Europe/Skopje';
const FF_THIS_WEEK='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_NEXT_WEEK='https://nfs.faireconomy.media/ff_calendar_nextweek.json';

const USDA_EVENTS=[
  ['2026-09-11','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-09-11','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-09-11','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-09-14','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-09-21','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-09-28','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-09-18','21:00','Hop Stocks','SOFTS','LOW','USDA NASS','Hops','Stocks report'],
  ['2026-09-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-09-24','21:00','Hogs and Pigs','LIVESTOCK','HIGH','USDA NASS','Lean Hogs','Inventory report'],
  ['2026-09-30','18:00','Grain Stocks','GRAINS','HIGH','USDA NASS','Corn · Wheat · Soybeans','Stocks by crop'],
  ['2026-09-30','18:00','Small Grains Summary','GRAINS','HIGH','USDA NASS','Wheat · Oats · Barley','Production report'],
  ['2026-10-05','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-10-09','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-10-09','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-10-09','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-10-13','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-10-19','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-10-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-10-26','21:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-11-02','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-11-09','22:00','Crop Progress','AGRI','MED','USDA NASS','Corn · Soybeans · Cotton · Wheat','Weekly progress/condition'],
  ['2026-11-10','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-11-10','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-11-10','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-11-23','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-12-10','18:00','WASDE','AGRI','HIGH','USDA','Wheat · Corn · Soybeans · Cotton','Multi-metric report'],
  ['2026-12-10','18:00','Crop Production','AGRI','HIGH','USDA NASS','Corn · Soybeans · Cotton · Wheat','Multi-metric report'],
  ['2026-12-10','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report'],
  ['2026-12-22','18:00','Cotton Ginnings','COTTON','MED','USDA NASS','Cotton','Multi-metric report']
];


/* Official USDA publication links. A report being published does not mean
 * there is one numeric Actual for its multi-metric statistics. */
const OFFICIAL_REPORTS={
 '2026-09-11|WASDE':'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report',
 '2026-09-11|Crop Production':'https://www.nass.usda.gov/Newsroom/Executive_Briefings/index.php',
 '2026-09-11|Cotton Ginnings':'https://esmis.nal.usda.gov/publication/cotton-ginnings',
 '2026-09-14|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress',
 '2026-09-18|Hop Stocks':'https://esmis.nal.usda.gov/publication/hop-stocks/2026-09-18',
 '2026-09-21|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress',
 '2026-09-22|Cotton Ginnings':'https://esmis.nal.usda.gov/publication/cotton-ginnings',
 '2026-09-24|Hogs and Pigs':'https://www.nass.usda.gov/Newsroom/Executive_Briefings/index.php',
 '2026-09-28|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress',
 '2026-09-30|Grain Stocks':'https://esmis.nal.usda.gov/publication/grain-stocks/2026-09-30',
 '2026-09-30|Small Grains Summary':'https://www.nass.usda.gov/Newsroom/Executive_Briefings/index.php',
 '2026-10-05|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress/2026-10-05',
 '2026-10-09|WASDE':'https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report',
 '2026-10-09|Crop Production':'https://esmis.nal.usda.gov/publication/crop-production/2026-10-09',
 '2026-10-09|Cotton Ginnings':'https://esmis.nal.usda.gov/publication/cotton-ginnings/2026-10-09',
 '2026-10-13|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress/2026-10-13',
 '2026-10-19|Crop Progress':'https://esmis.nal.usda.gov/publication/crop-progress/2026-10-19',
 '2026-10-22|Cotton Ginnings':'https://esmis.nal.usda.gov/publication/cotton-ginnings',
 '2026-10-26|Crop Progress':'https://esmis.nal.usda.gov/sites/default/release-files/796124/prog4326.txt'
};

function num(v){if(v==null)return NaN;return Number(String(v).replace(/,/g,'').replace(/[^0-9+-.]/g,''));}
function surprise(event,actual,forecast){const a=num(actual),f=num(forecast);if(!Number.isFinite(a)||!Number.isFinite(f))return'—';if(a===f)return'IN LINE';const lower=/crude oil inventories|natural gas storage|gasoline inventories/i.test(event);return lower?(a<f?'BULLISH':'BEARISH'):(a>f?'BEAT':'MISS');}
function iso(date,time){const [y,m,day]=date.split('-').map(Number);const lastSunday=mo=>{const d=new Date(Date.UTC(y,mo+1,0));return d.getUTCDate()-d.getUTCDay()};const dst=(m>3&&m<10)||(m===3&&day>=lastSunday(2))||(m===10&&day<lastSunday(9));return `${date}T${time}:00${dst?'+02:00':'+01:00'}`;}
function usdaRows(){
 const now=Date.now();
 return USDA_EVENTS.map(([date,time,event,category,importance,source,markets,format])=>{
  const releaseDate=iso(date,time),past=now>=new Date(releaseDate).getTime();
  const sourceUrl=past?OFFICIAL_REPORTS[date+'|'+event]:null,published=Boolean(sourceUrl);
  return {date:releaseDate,timeZone:TARGET_TZ,country:'COM',currency:'COM',event,category,markets,importance,source,
   sourceUrl:sourceUrl||null,verificationStatus:published?'verified-primary':past?'unverified':'official-schedule',
   lastUpdate:published?releaseDate:null,previous:'—',forecast:format,actual:'—',
   label:published?'PUBLISHED':past?'UNVERIFIED':'PENDING',
   releaseState:published?'released':past?'overdue':'scheduled',impact:'Report-driven',
   note:published?'Official USDA publication verified. Multi-metric report; no single numeric Actual.':'USDA multi-metric report; a past scheduled time alone does not verify publication.'};
 });
}
async function ff(url){try{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TradingLabMacroTerminal/5.1'},cache:'no-store'});if(!r.ok)return[];const j=await r.json();return Array.isArray(j)?j:[]}catch(e){return[]}}
function energyRows(raw){return raw.filter(x=>/crude oil inventories|natural gas storage|gasoline inventories|distillate inventories/i.test(String(x.title||x.event||''))).map(x=>{const event=x.title||x.event||'';const actual=x.actual??'—',forecast=x.forecast??'—';return {date:x.date,country:'COM',currency:'COM',event:`EIA · ${event}`,category:/natural gas/i.test(event)?'ENERGY · GAS':'ENERGY · OIL',markets:/natural gas/i.test(event)?'Natural Gas':'WTI · Brent · Products',importance:/crude oil inventories|natural gas storage/i.test(event)?'HIGH':'MED',source:'ForexFactory / EIA',previous:x.previous??'—',forecast,actual,label:actual&&actual!=='—'?surprise(event,actual,forecast):(Date.parse(x.date)<Date.now()?'OVERDUE':'PENDING'),releaseState:actual&&actual!=='—'?'released':(Date.parse(x.date)<Date.now()?'overdue':'scheduled'),impact:'Inventory surprise',note:'Energy inventories support classic Previous / Forecast / Actual because the release has a single headline change.'};});}

const VERIFIED_EIA=[
 {date:'2026-10-29T15:30:00+01:00',event:'Natural Gas Storage',actual:'+80B',forecast:'—',previous:'+77B',category:'ENERGY · GAS',markets:'Natural Gas',sourceUrl:'https://ir.eia.gov/ngs/ngs.html',source:'U.S. Energy Information Administration · Weekly Natural Gas Storage Report',verificationStatus:'verified-primary',sourceUpdatedAt:'2026-10-29T14:30:00Z',note:'Official EIA release 29 Oct 2026 10:30 EDT for week ending 23 Oct: +80 Bcf injection; Lower 48 working gas 3,724 Bcf vs 3,644 Bcf prior week, 38 Bcf above five-year average, 147 Bcf below year-ago. Market consensus not independently verified.'},
 {date:'2026-10-28T15:30:00+01:00',event:'Crude Oil Inventories',actual:'-1.892M',forecast:'—',previous:'-3.060M',category:'ENERGY · OIL',markets:'WTI · Brent · Products',sourceUrl:'https://ir.eia.gov/wpsr/psw00.json',source:'U.S. Energy Information Administration · Weekly Petroleum Status Report',verificationStatus:'verified-primary',sourceUpdatedAt:'2026-10-28T14:30:00Z',note:'Official EIA WPSR JSON: commercial crude stocks 410.625M barrels for week ended 23 Oct versus 412.517M for 16 Oct = -1.892M. Prior week -3.060M. Forecast omitted because primary market consensus was not independently verified.'},
 {date:'2026-10-21T16:30:00+02:00',event:'Crude Oil Inventories',actual:'-3.060M',forecast:'-0.100M',previous:'-8.557M',category:'ENERGY · OIL',markets:'WTI · Brent · Products',sourceUrl:'https://www.eia.gov/petroleum/supply/weekly/',note:'Actual corroborated by official EIA weekly report; consensus from secondary economic calendar.'},
 {date:'2026-10-22T16:30:00+02:00',event:'Natural Gas Storage',actual:'+77B',forecast:'—',previous:'+67B',category:'ENERGY · GAS',markets:'Natural Gas',sourceUrl:'https://www.eia.gov/naturalgas/storage/',note:'Official EIA report: +77 Bcf net injection for week ending 16 Oct. No verified single-source market consensus.'},
 {date:'2026-10-07T16:30:00+02:00',event:'Crude Oil Inventories',actual:'-3.186M',forecast:'1.900M',previous:'0.922M',category:'ENERGY · OIL',markets:'WTI · Brent · Products',sourceUrl:'https://www.investing.com/economic-calendar/eia-crude-oil-inventories-75'},
 {date:'2026-10-08T16:30:00+02:00',event:'Natural Gas Storage',actual:'85B',forecast:'79B',previous:'64B',category:'ENERGY · GAS',markets:'Natural Gas',sourceUrl:'https://www.forexfactory.com/calendar/26-us-natural-gas-storage'}
];
function knownEiaRows(){return VERIFIED_EIA.map(x=>({...x,country:'COM',currency:'COM',event:'EIA · '+x.event,importance:'HIGH',source:x.source||'EIA figures via published secondary calendar',verificationStatus:x.verificationStatus||'verified-secondary',sourceUpdatedAt:x.sourceUpdatedAt||null,forecastVerificationStatus:'provider-unverified',label:surprise(x.event,x.actual,x.forecast),releaseState:'released',impact:'Inventory surprise',note:x.note||'Reported EIA Actual and secondary-source forecast; official EIA report should be cross-checked.'}));}
function reconcileEia(providerRows){
 const out=[...providerRows];
 for(const known of knownEiaRows()){
  const match=out.find(x=>String(x.date||'').slice(0,10)===known.date.slice(0,10)&&String(x.event||'').toLowerCase().includes(known.event.slice(6).toLowerCase()));
  if(!match)out.push(known);
  else if(match.releaseState!=='released'||known.verificationStatus==='verified-primary')Object.assign(match,known);
 }
 return out;
}

export default async function handler(req,res){res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');const [a,b]=await Promise.all([ff(FF_THIS_WEEK),ff(FF_NEXT_WEEK)]);const events=[...usdaRows(),...reconcileEia(energyRows([...a,...b]))].sort((x,y)=>new Date(x.date)-new Date(y.date));return res.status(200).json({mode:(a.length||b.length)?'live':'schedule-fallback',provider:'USDA NASS + USDA WASDE schedule + EIA/ForexFactory',timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'EIA inventory releases use Previous / Forecast / Actual where available. USDA WASDE/Crop Production are multi-metric reports, so Forecast and Actual are report-level labels rather than one headline number.'});}
