const FF_THIS_WEEK=[
  'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json'
];
const FF_NEXT_WEEK=[
  'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
  'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json'
];
const G10=new Set(['USD','EUR','GBP','JPY','CHF','AUD','NZD','CAD','SEK','NOK']);
const TARGET_TZ='Europe/Skopje';
const RETRY_DELAYS=[0,250,750];

const TODAY_FALLBACK_EVENTS=[
  ['05:10','AUD','RBA Gov Bullock Speaks','—','—','HIGH'],
  ['08:00','GBP','Public Sector Net Borrowing','1.8B','15.2B','LOW'],
  ['10:30','EUR','German Buba President Nagel Speaks','—','—','LOW'],
  ['12:00','GBP','CBI Industrial Order Expectations','-25','-33','LOW'],
  ['13:00','EUR','ECB President Lagarde Speaks','—','—','MED'],
  ['14:15','USD','ADP Weekly Employment Change','16.3K','—','LOW'],
  ['15:55','USD','President Trump Speaks','—','—','MED'],
  ['16:00','EUR','Consumer Confidence','-16','-16','LOW'],
  ['16:00','USD','Richmond Manufacturing Index','4','2','LOW'],
  ['16:05','USD','FOMC Member Williams Speaks','—','—','LOW'],
  ['16:20','USD','FOMC Member Jefferson Speaks','—','—','LOW'],
  ['19:00','USD','FOMC Member Barkin Speaks','—','—','LOW'],
  ['21:30','EUR','German Buba President Nagel Speaks','—','—','LOW'],
  ['22:30','USD','API Weekly Statistical Bulletin','—','—','LOW']
].map(([time,currency,event,previous,forecast,importance])=>({
  date:`2026-09-22T${time}:00+02:00`,
  sourceDate:`2026-09-22T${time}:00+02:00`,
  timeZone:TARGET_TZ,country:currency,currency,event,previous,forecast,actual:'—',
  importance,label:'Update',impact:'Neutral',lastUpdate:null,source:'TradingLab verified schedule fallback'
}));


const VERIFIED_OVERRIDES=[
  {date:'2026-09-14',time:'08:30',currency:'CHF',match:/PPI|Producer|Import Prices/i,actual:'0.7%',previous:'-0.1%',forecast:'—',importance:'MED',source:'FinancialJuice',event:'Swiss PPI m/m · Aug'},
  {date:'2026-09-14',time:'08:30',currency:'CHF',match:/PPI.*y\/y|Producer.*y\/y/i,actual:'-0.7%',previous:'-2.1%',forecast:'—',importance:'MED',source:'FinancialJuice',event:'Swiss PPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/^CPI m\/m/i,actual:'-0.1%',previous:'0.5%',forecast:'-0.1%',importance:'HIGH',source:'Statistics Canada',event:'CPI m/m · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Median CPI/i,actual:'2.0%',previous:'2.0%',forecast:'2.0%',importance:'EXTREME',source:'Statistics Canada',event:'Median CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Trimmed CPI/i,actual:'1.9%',previous:'1.9%',forecast:'1.9%',importance:'HIGH',source:'Statistics Canada',event:'Trimmed CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Common CPI/i,actual:'2.7%',previous:'2.7%',forecast:'2.7%',importance:'MED',source:'Bank of Canada',event:'Common CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Core CPI m\/m/i,actual:'0.2%',previous:'0.2%',forecast:'0.2%',importance:'EXTREME',source:'Statistics Canada',event:'Core CPI m/m · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Manufacturing Sales/i,actual:'-0.4%',previous:'0.1%',forecast:'-0.2%',importance:'HIGH',source:'Statistics Canada',event:'Manufacturing Sales m/m · Jul'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Claimant Count Change/i,actual:'27.8K',previous:'-11.8K',forecast:'8.3K',importance:'HIGH',source:'ONS',event:'Claimant Count Change · Aug'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Average Earnings.*3m\/y|Average Earnings.*Bonus/i,actual:'3.9%',previous:'4.2%',forecast:'3.9%',importance:'HIGH',source:'ONS',event:'Average Earnings Index 3m/y · Jul'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Unemployment Rate/i,actual:'4.9%',previous:'4.9%',forecast:'5.0%',importance:'HIGH',source:'ONS',event:'Unemployment Rate · Jul'},
  {date:'2026-09-15',time:'11:00',currency:'EUR',match:/German.*ZEW|ZEW.*Sentiment/i,actual:'Germany 34.7 · EA 25.8',previous:'Germany 34.2 · EA 31.4',forecast:'Germany 39.8 · EA 39.2',importance:'HIGH',source:'ZEW',event:'German + Euro Area ZEW Sentiment · Sep'},
  {date:'2026-09-15',time:'14:15',currency:'USD',match:/ADP Weekly Employment Change/i,actual:'16.3K',previous:'12.3K',forecast:'—',importance:'MED',source:'ADP',event:'ADP Weekly Employment Change'},
  {date:'2026-09-15',time:'14:30',currency:'CAD',match:/Wholesale Sales/i,actual:'0.3%',previous:'2.8%',forecast:'-0.5%',importance:'MED',source:'Statistics Canada',event:'Wholesale Sales m/m · Jul'},
  {date:'2026-09-15',time:'14:30',currency:'USD',match:/Empire State Manufacturing/i,actual:'7.6',previous:'20.6',forecast:'14.8',importance:'MED',source:'Federal Reserve Bank of New York',event:'Empire State Manufacturing Index · Sep'},

  // 16 Sep: verified releases available by 14:44 Europe/Skopje.
  {date:'2026-09-16',time:'01:50',currency:'JPY',match:/Core Machinery Orders.*m\/m/i,actual:'-3.7%',previous:'9.7%',forecast:'-1.2%',importance:'HIGH',source:'Cabinet Office / Investing',event:'Core Machinery Orders m/m · Jul'},
  {date:'2026-09-16',time:'01:50',currency:'JPY',match:/Trade Balance/i,actual:'-1.106T',previous:'-0.69T',forecast:'—',importance:'HIGH',source:'Japan MOF / Reuters',event:'Trade Balance · Aug'},
  {date:'2026-09-16',time:'08:00',currency:'GBP',match:/^CPI y\/y|Inflation Rate y\/y/i,actual:'3.1%',previous:'2.9%',forecast:'3.1%',importance:'HIGH',source:'ONS',event:'CPI y/y · Aug'},
  {date:'2026-09-16',time:'08:00',currency:'GBP',match:/^CPI m\/m|Inflation Rate m\/m/i,actual:'0.5%',previous:'0.3%',forecast:'0.5%',importance:'MED',source:'ONS',event:'CPI m/m · Aug'},
  {date:'2026-09-16',time:'08:00',currency:'GBP',match:/Core CPI.*y\/y|Core Inflation Rate.*y\/y/i,actual:'2.6%',previous:'2.6%',forecast:'2.6%',importance:'HIGH',source:'ONS',event:'Core CPI y/y · Aug'},
  {date:'2026-09-16',time:'14:30',currency:'USD',match:/^Retail Sales m\/m|Retail Sales.*Aug/i,actual:'1.2%',previous:'-0.5% rev.',forecast:'0.8%',importance:'HIGH',source:'U.S. Census Bureau / Barron’s',event:'Retail Sales m/m · Aug'},
  {date:'2026-09-16',time:'14:30',currency:'USD',match:/Control Group/i,actual:'1.4%',previous:'—',forecast:'0.5%',importance:'HIGH',source:'U.S. Census Bureau / Reuters',event:'Retail Sales Control Group m/m · Aug'},
  {date:'2026-09-16',time:'20:00',currency:'USD',match:/FOMC|Federal Funds|Rate Decision/i,actual:'3.75–4.00% · +25bp',previous:'3.50–3.75%',forecast:'3.75–4.00%',importance:'HIGH',source:'Federal Reserve',event:'FOMC Rate Decision + Economic Projections'},
  {date:'2026-09-16',time:'20:30',currency:'USD',match:/Fed Chair|Warsh|Press Conference/i,actual:'Hawkish · price stability focus',previous:'—',forecast:'Hawkish / data-dependent',importance:'HIGH',source:'Federal Reserve',event:'Fed Chair Warsh Press Conference'},
  {date:'2026-09-16',time:'19:30',currency:'CAD',match:/Summary of Deliberations|BoC/i,actual:'Inflation risks increased',previous:'Hold 2.25%',forecast:'Neutral-hawkish',importance:'HIGH',source:'Bank of Canada',event:'BoC Summary of Deliberations'}
  ,{date:'2026-09-21',time:'01:01',currency:'GBP',match:/Rightmove HPI m\/m/i,actual:'0.7%',previous:'-2.0%',forecast:'—',importance:'LOW',source:'ForexFactory',event:'Rightmove HPI m/m'}
  ,{date:'2026-09-21',time:'05:00',currency:'NZD',match:/Credit Card Spending y\/y/i,actual:'3.5%',previous:'5.3%',forecast:'—',importance:'LOW',source:'ForexFactory',event:'Credit Card Spending y/y'}
  ,{date:'2026-09-22',time:'08:00',currency:'GBP',match:/Public Sector Net Borrowing/i,actual:'18.3B',previous:'1.8B',forecast:'15.2B',importance:'LOW',source:'ONS / Reuters',event:'Public Sector Net Borrowing · Aug'}
  ,{date:'2026-09-22',time:'12:00',currency:'GBP',match:/CBI Industrial Order Expectations/i,actual:'-9',previous:'-25',forecast:'-33',importance:'LOW',source:'CBI / Reuters',event:'CBI Industrial Order Expectations · Sep'}
  ,{date:'2026-09-22',time:'16:00',currency:'EUR',match:/^Consumer Confidence$/i,actual:'-16.5',previous:'-15.5',forecast:'-16',importance:'LOW',source:'European Commission DG ECFIN',event:'Euro Area Consumer Confidence · Sep'}
];

function importance(v){
  const s=String(v||'').trim().toUpperCase();
  if(s==='HIGH'||s==='3')return'HIGH';
  if(s==='MEDIUM'||s==='MED'||s==='2')return'MED';
  if(s==='LOW'||s==='1')return'LOW';
  return'';
}

function num(v){
  if(v==null)return NaN;
  const raw=String(v).trim();
  if(!raw||raw==='—'||raw==='-'||/^n\/?a$/i.test(raw))return NaN;
  const cleaned=raw.replace(/,/g,'').replace(/[^0-9+-.]/g,'');
  if(!cleaned||cleaned==='-'||cleaned==='+'||cleaned==='.')return NaN;
  return Number(cleaned);
}

function infer(ev,a0,f0){
  const a=num(a0),f=num(f0);
  if(!Number.isFinite(a)||!Number.isFinite(f))return{label:'Update',impact:'Neutral'};
  if(Math.abs(a-f)<1e-12)return{label:'Neutral',impact:'Neutral'};
  const lower=/unemployment|jobless|claims|deficit|borrowing/i.test(ev||'');
  const positive=lower?a<f:a>f;
  return{label:positive?'Beat':'Miss',impact:positive?'Strengthens':'Weakens'};
}

function toPrilepIso(value){
  const d=new Date(value);
  if(!Number.isFinite(d.getTime()))return String(value||'');
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:TARGET_TZ,
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',
    hourCycle:'h23',timeZoneName:'longOffset'
  }).formatToParts(d);
  const p={};
  for(const part of parts)if(part.type!=='literal')p[part.type]=part.value;
  let offset=String(p.timeZoneName||'GMT+00:00').replace(/^GMT/,'');
  if(!offset)offset='+00:00';
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offset}`;
}

function localDate(iso){
  const d=new Date(iso);
  if(!Number.isFinite(d.getTime()))return'';
  return new Intl.DateTimeFormat('en-CA',{timeZone:TARGET_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}

function applyVerifiedOverrides(events){
  const out=[...events];
  const activeDates=new Set(out.map(e=>localDate(e.date)).filter(Boolean));
  for(const o of VERIFIED_OVERRIDES){
    let matched=false;
    for(let i=0;i<out.length;i++){
      const e=out[i];
      if(e.currency!==o.currency||localDate(e.date)!==o.date)continue;
      if(!o.match.test(String(e.event||'')))continue;
      if(/y\/y/i.test(o.event)&&!/y\/y|YoY|year/i.test(String(e.event||'')))continue;
      const resolvedForecast=e.forecast&&e.forecast!=='—'?e.forecast:o.forecast;
      const z=infer(o.event,o.actual,resolvedForecast);
      out[i]={...e,actual:o.actual,previous:o.previous,forecast:resolvedForecast,importance:e.importance||o.importance,label:z.label,impact:z.impact,lastUpdate:new Date().toISOString(),source:o.source};
      matched=true;
      break;
    }
    // Monthly verified releases are also inserted if the upstream provider omits them.
    if(!matched&&activeDates.has(o.date)&&/m\/m/i.test(o.event)){
      out.push({
        date:`${o.date}T${o.time}:00+02:00`,sourceDate:`${o.date}T${o.time}:00+02:00`,timeZone:TARGET_TZ,
        country:o.currency,currency:o.currency,event:o.event,previous:o.previous,forecast:o.forecast,actual:o.actual,
        importance:o.importance,label:'Update',impact:'Strengthens',lastUpdate:new Date().toISOString(),source:o.source
      });
    }
  }
  return out;
}

function skopjeWeekday(){
  return new Intl.DateTimeFormat('en-US',{timeZone:TARGET_TZ,weekday:'short'}).format(new Date());
}

async function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function fetchJsonWithRetry(url){
  let lastError=new Error('Calendar provider unavailable');
  for(let i=0;i<RETRY_DELAYS.length;i++){
    if(RETRY_DELAYS[i])await sleep(RETRY_DELAYS[i]);
    try{
      const r=await fetch(url,{
        headers:{Accept:'application/json','Cache-Control':'no-cache','User-Agent':'TradingLabMacroTerminal/5.2'},
        cache:'no-store'
      });
      if(!r.ok)throw new Error(`ForexFactory ${r.status}`);
      const raw=await r.json();
      if(!Array.isArray(raw)||!raw.length)throw new Error('ForexFactory empty response');
      return raw;
    }catch(e){lastError=e;}
  }
  throw lastError;
}

async function fetchCalendarAny(urls){
  let lastError=new Error('Calendar provider unavailable');
  for(const url of urls){
    try{return await fetchCalendar(url);}
    catch(e){lastError=e;}
  }
  throw lastError;
}

async function fetchCalendar(url){
  const raw=await fetchJsonWithRetry(url);
  const events=(Array.isArray(raw)?raw:[]).map(x=>{
    const currency=String(x.country||x.currency||'').toUpperCase();
    const imp=importance(x.impact||x.importance);
    if(!G10.has(currency)||!imp)return null;
    const actual=x.actual??'—';
    const forecast=x.forecast??'—';
    const z=infer(x.title||x.event,actual,forecast);
    return{
      date:toPrilepIso(x.date||''),sourceDate:x.date||'',timeZone:TARGET_TZ,
      country:currency,currency,event:x.title||x.event||'',previous:x.previous||'—',
      forecast:forecast||'—',actual:actual||'—',importance:imp,label:z.label,impact:z.impact,
      lastUpdate:null,source:'ForexFactory'
    };
  }).filter(Boolean);
  return applyVerifiedOverrides(events);
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=20, stale-while-revalidate=60');
  const sunday=skopjeWeekday()==='Sun';
  const primary=sunday?FF_NEXT_WEEK:FF_THIS_WEEK;
  const secondary=sunday?FF_THIS_WEEK:FF_NEXT_WEEK;
  try{
    let events=[];let provider='ForexFactory weekly export + verified source overrides';
    try{events=await fetchCalendarAny(primary);provider+=sunday?' · next week':' · this week';}
    catch(e){events=await fetchCalendarAny(secondary);provider+=' · fallback';}
    return res.status(200).json({mode:'live',provider,timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'All G10 provider events are retained. Verified actuals override stale/pending provider values when available. Times are Europe/Skopje.'});
  }catch(e){
    const events=applyVerifiedOverrides(TODAY_FALLBACK_EVENTS);
    return res.status(200).json({mode:'schedule-fallback',provider:'TradingLab schedule fallback + verified overrides',timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:`Live provider unavailable: ${String(e?.message||e)}`});
  }
}
