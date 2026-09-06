const FF_THIS_WEEK='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_NEXT_WEEK='https://nfs.faireconomy.media/ff_calendar_nextweek.json';
const G10=new Set(['USD','EUR','GBP','JPY','CHF','AUD','NZD','CAD','SEK','NOK']);
const TARGET_TZ='Europe/Skopje';

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

function skopjeWeekday(){
  const day=new Intl.DateTimeFormat('en-US',{timeZone:TARGET_TZ,weekday:'short'}).format(new Date());
  return day;
}

async function fetchCalendar(url){
  const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TradingLabMacroTerminal/4.0'}});
  if(!r.ok)throw new Error(`ForexFactory ${r.status}`);
  const raw=await r.json();
  return (Array.isArray(raw)?raw:[]).map(x=>{
    const currency=String(x.country||x.currency||'').toUpperCase();
    const imp=importance(x.impact||x.importance);
    if(!G10.has(currency)||!imp||imp==='LOW')return null;
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
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=180');
  const sunday=skopjeWeekday()==='Sun';
  const primary=sunday?FF_NEXT_WEEK:FF_THIS_WEEK;
  const secondary=sunday?FF_THIS_WEEK:FF_NEXT_WEEK;
  try{
    let events=[];let provider='ForexFactory weekly export';
    try{events=await fetchCalendar(primary);provider+=sunday?' · next week':' · this week';}
    catch(e){events=await fetchCalendar(secondary);provider+=' · fallback';}
    return res.status(200).json({mode:'live',provider,timeZone:TARGET_TZ,events,updatedAt:new Date().toISOString(),notice:'Medium and High-impact G10 calendar only. On Sundays the terminal requests the coming week; Monday-Friday it requests the active week. Times are converted to Europe/Skopje.'});
  }catch(e){
    return res.status(200).json({mode:'seed',provider:'error',timeZone:TARGET_TZ,events:[],updatedAt:new Date().toISOString(),notice:String(e?.message||e)});
  }
}
