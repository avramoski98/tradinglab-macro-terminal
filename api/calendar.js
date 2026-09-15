const FF_THIS_WEEK='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_NEXT_WEEK='https://nfs.faireconomy.media/ff_calendar_nextweek.json';
const G10=new Set(['USD','EUR','GBP','JPY','CHF','AUD','NZD','CAD','SEK','NOK']);
const TARGET_TZ='Europe/Skopje';
const RETRY_DELAYS=[0,250,750];

const VERIFIED_OVERRIDES=[
  {date:'2026-09-14',time:'08:30',currency:'CHF',match:/PPI|Producer|Import Prices/i,actual:'0.7%',previous:'-0.1%',forecast:'—',importance:'MED',source:'FinancialJuice',event:'Swiss PPI m/m · Aug'},
  {date:'2026-09-14',time:'08:30',currency:'CHF',match:/PPI.*y\\/y|Producer.*y\\/y/i,actual:'-0.7%',previous:'-2.1%',forecast:'—',importance:'MED',source:'FinancialJuice',event:'Swiss PPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/^CPI m\\/m/i,actual:'-0.1%',previous:'0.5%',forecast:'-0.1%',importance:'HIGH',source:'Statistics Canada',event:'CPI m/m · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Median CPI/i,actual:'2.0%',previous:'2.0%',forecast:'2.0%',importance:'EXTREME',source:'Statistics Canada',event:'Median CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Trimmed CPI/i,actual:'1.9%',previous:'1.9%',forecast:'1.9%',importance:'HIGH',source:'Statistics Canada',event:'Trimmed CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Common CPI/i,actual:'2.7%',previous:'2.7%',forecast:'2.7%',importance:'MED',source:'Bank of Canada',event:'Common CPI y/y · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Core CPI m\\/m/i,actual:'0.2%',previous:'0.2%',forecast:'0.2%',importance:'EXTREME',source:'Statistics Canada',event:'Core CPI m/m · Aug'},
  {date:'2026-09-14',time:'14:30',currency:'CAD',match:/Manufacturing Sales/i,actual:'-0.4%',previous:'0.1%',forecast:'-0.2%',importance:'HIGH',source:'Statistics Canada',event:'Manufacturing Sales m/m · Jul'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Claimant Count Change/i,actual:'27.8K',previous:'-11.8K',forecast:'8.3K',importance:'HIGH',source:'ONS',event:'Claimant Count Change · Aug'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Average Earnings.*3m\\/y|Average Earnings.*Bonus/i,actual:'3.9%',previous:'4.2%',forecast:'3.9%',importance:'HIGH',source:'ONS',event:'Average Earnings Index 3m/y · Jul'},
  {date:'2026-09-15',time:'08:00',currency:'GBP',match:/Unemployment Rate/i,actual:'4.9%',previous:'4.9%',forecast:'5.0%',importance:'HIGH',source:'ONS',event:'Unemployment Rate · Jul'},
  {date:'2026-09-15',time:'11:00',currency:'EUR',match:/German.*ZEW|ZEW.*Sentiment/i,actual:'Germany 34.7 · EA 25.8',previous:'Germany 34.2 · EA 31.4',forecast:'Germany 39.8 · EA 39.2',importance:'HIGH',source:'ZEW',event:'German + Euro Area ZEW Sentiment · Sep'},
  {date:'2026-09-15',time:'14:15',currency:'USD',match:/ADP Weekly Employment Change/i,actual:'16.3K',previous:'12.3K',forecast:'—',importance:'MED',source:'ADP',event:'ADP Weekly Employment Change'},
  {date:'2026-09-15',time:'14:30',currency:'CAD',match:/Wholesale Sales/i,actual:'0.3%',previous:'2.8%',forecast:'-0.5%',importance:'MED',source:'Statistics Canada',event:'Wholesale Sales m/m · Jul'},
  {date:'2026-09-15',time:'14:30',currency:'USD',match:/Empire State Manufacturing/i,actual:'7.6',previous:'20.6',forecast:'14.8',importance:'MED',source:'Federal Reserve Bank of New York',event:'Empire State Manufacturing Index · Sep'}
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
  return Number(String(v).replace(/,/g,'').replace(/[^0-9+-.]/g,''));
}

function infer(ev,a0,f0){
  const a=num(a0),f=num(f0);
  if(!Number.isFinite(a)||!Number.isFinite(f))return{label:'Update',impact:'Neutral'};
  if(Math.abs(a-f)<1e-12)return{label:'Neutral',impact:'Neutral'};
  const lower=/unemployment|jobless|claims|deficit/i.test(ev||'');
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
  for(const o of VERIFIED_OVERRIDES){
    let matched=false;
    for(let i=0;i<out.length;i++){
      const e=out[i];
      if(e.currency!==o.currency||localDate(e.date)!==o.date)continue;
      if(!o.match.test(String(e.event||'')))continue;
      // Avoid applying the YoY override to a generic MoM row.
      if(/y\/y/i.test(o.event)&&!/y\/y|YoY|year/i.test(String(e.event||'')))continue;
      out[i]={...e,actual:o.actual,previous:o.previous,forecast:e.forecast&&e.forecast!=='—'?e.forecast:o.forecast,importance:e.importance||o.importance,lastUpdate:new Date().toISOString(),source:o.source};
      matched=true;
      break;
    }
    if(!matched&&/m\/m/i.test(o.event)){
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
        headers:{Accept:'application/json','Cache-Control':'no-cache','User-Agent':'TradingLabMacroTerminal/5.1'},
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
    let events=[];let provider='ForexFactory weekly export + verified FinancialJuice overrides';
    try{events=await fetchCalendar(primary);provider+=sunday?' · next week':' · this week';}
    catch(e){events=await fetchCalendar(secondary);provider+=' · fallback';}
    return res.status(200).json({mode:'live',provider,timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'All G10 provider events are retained. Verified FinancialJuice actuals override stale/pending provider values when available. Times are Europe/Skopje.'});
  }catch(e){
    const events=applyVerifiedOverrides([]);
    return res.status(200).json({mode:'verified-fallback',provider:'FinancialJuice overrides',timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:String(e?.message||e)});
  }
}
