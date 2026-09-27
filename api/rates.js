const SOURCE_UPDATED_AT = '2026-09-27T15:40:00Z';

const BANKS = [
  {
    id:'FED', ccy:'USD', name:'Federal Reserve', nextMeeting:'28 Oct 2026',
    current:'3.75–4.00%', holdRate:'3.75–4.00%', hikeRate:'4.00–4.25%', cutRate:'3.50–3.75%',
    source:'CME FedWatch / Reuters · 25 Sep close', liveUrl:'https://centralbank.watch/federal-reserve/',
    latest:{hike:66.0,hold:34.0,cut:0.0}, previous:{hike:53.0,hold:47.0,cut:0.0}
  },
  {
    id:'ECB', ccy:'EUR', name:'European Central Bank', nextMeeting:'29 Oct 2026',
    current:'2.50%', holdRate:'2.50%', hikeRate:'2.75%', cutRate:'2.25%',
    source:'CentralBank.Watch / €STR · 27 Sep', liveUrl:'https://centralbank.watch/european-central-bank/',
    latest:{hike:38.6,hold:61.4,cut:0.0}, previous:{hike:60.0,hold:40.0,cut:0.0}
  },
  {
    id:'BOJ', ccy:'JPY', name:'Bank of Japan', nextMeeting:'28 Oct 2026',
    current:'1.25%', holdRate:'1.25%', hikeRate:'1.50%', cutRate:'1.00%',
    source:'Post-hike pricing feed conflict · probability withheld',
    latest:{hike:NaN,hold:NaN,cut:NaN}, previous:{hike:NaN,hold:NaN,cut:NaN}, allowLive:false
  },
  {
    id:'BOE', ccy:'GBP', name:'Bank of England', nextMeeting:'5 Nov 2026',
    current:'3.75%', holdRate:'3.75%', hikeRate:'4.00%', cutRate:'3.50%',
    source:'CentralBank.Watch / SONIA · 27 Sep', liveUrl:'https://centralbank.watch/bank-of-england/',
    latest:{hike:85.7,hold:14.3,cut:0.0}, previous:{hike:65.0,hold:35.0,cut:0.0}
  },
  {
    id:'BOC', ccy:'CAD', name:'Bank of Canada', nextMeeting:'28 Oct 2026',
    current:'2.25%', holdRate:'2.25%', hikeRate:'2.50%', cutRate:'2.00%',
    source:'BoC next-meeting market odds pending · stale Sep-14 quote withheld',
    latest:{hike:NaN,hold:NaN,cut:NaN}, previous:{hike:NaN,hold:NaN,cut:NaN}, allowLive:false
  },
  {
    id:'RBA', ccy:'AUD', name:'Reserve Bank of Australia', nextMeeting:'29 Sep 2026',
    current:'4.35%', holdRate:'4.35%', hikeRate:'4.60%', cutRate:'4.10%',
    source:'CentralBank.Watch / OIS · 27 Sep', liveUrl:'https://centralbank.watch/reserve-bank-of-australia/',
    latest:{hike:90.0,hold:10.0,cut:0.0}, previous:{hike:76.0,hold:24.0,cut:0.0}
  },
  {
    id:'RBNZ', ccy:'NZD', name:'Reserve Bank of New Zealand', nextMeeting:'28 Oct 2026',
    current:'2.75%', holdRate:'2.75%', hikeRate:'3.00%', cutRate:'2.50%',
    source:'Reuters market pricing · 22 Sep', latest:{hike:75.0,hold:25.0,cut:0.0},
    previous:{hike:11.0,hold:89.0,cut:0.0}, allowLive:false
  },
  {
    id:'SNB', ccy:'CHF', name:'Swiss National Bank', nextMeeting:'10 Dec 2026',
    current:'0.00%', holdRate:'0.00%', hikeRate:'0.25%', cutRate:'-0.25%',
    source:'CentralBank.Watch / SARON · 27 Sep', liveUrl:'https://centralbank.watch/swiss-national-bank/',
    latest:{hike:39.9,hold:60.1,cut:0.0}, previous:{hike:5.7,hold:94.3,cut:0.0}
  },
  {
    id:'RIKSBANK', ccy:'SEK', name:'Riksbank', nextMeeting:'4 Nov 2026',
    current:'1.75%', holdRate:'1.75%', hikeRate:'2.00%', cutRate:'1.50%',
    source:'Riksbank / Reuters · likely tightening before year-end; exact next-meeting odds unavailable',
    latest:{hike:NaN,hold:NaN,cut:NaN}, previous:{hike:NaN,hold:NaN,cut:NaN}, allowLive:false
  },
  {
    id:'NORGES', ccy:'NOK', name:'Norges Bank', nextMeeting:'5 Nov 2026',
    current:'4.50%', holdRate:'4.50%', hikeRate:'4.75%', cutRate:'4.25%',
    source:'Norges Bank / Reuters · Sep-24 hike; path implies ~40% another hike within 6m',
    latest:{hike:NaN,hold:NaN,cut:NaN}, previous:{hike:NaN,hold:NaN,cut:NaN}, allowLive:false
  }
];

function cleanText(html=''){
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/\s+/g,' ')
    .trim();
}

function numberAfter(text,pattern){
  const m=text.match(pattern);
  return m?Number(m[1]):NaN;
}

function parseProbabilities(text,fallback){
  const hike=numberAfter(text,/Rate Hike\s*([0-9]+(?:\.[0-9]+)?)%/i);
  const hold=numberAfter(text,/(?:No Change|Hold)\s*([0-9]+(?:\.[0-9]+)?)%/i);
  const cut=numberAfter(text,/Rate Cut\s*([0-9]+(?:\.[0-9]+)?)%/i);
  if([hike,hold,cut].every(Number.isFinite)) return {hike,hold,cut};
  return fallback;
}

function rowsFor(bank,probs,previous){
  return [
    {rate:bank.cutRate,direction:'cut',latest:probs.cut,previous:previous.cut},
    {rate:bank.holdRate,direction:'hold',latest:probs.hold,previous:previous.hold,current:true},
    {rate:bank.hikeRate,direction:'hike',latest:probs.hike,previous:previous.hike}
  ];
}

async function fetchBank(bank){
  if(bank.allowLive===false||!bank.liveUrl) return {...bank,live:false};
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),4500);
  try{
    const r=await fetch(bank.liveUrl,{
      headers:{'User-Agent':'TradingLabMacroTerminal/3.0','Accept':'text/html,application/xhtml+xml'},
      signal:ctrl.signal,
      cache:'no-store'
    });
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const parsed=parseProbabilities(cleanText(await r.text()),bank.latest);
    return {...bank,latest:parsed,live:true};
  }catch(_){
    return {...bank,live:false};
  }finally{
    clearTimeout(timer);
  }
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
  const banks=await Promise.all(BANKS.map(fetchBank));
  const cards=banks.map(bank=>({
    id:bank.id,ccy:bank.ccy,name:bank.name,nextMeeting:bank.nextMeeting,current:bank.current,
    source:bank.source,live:bank.live,sourceUpdatedAt:SOURCE_UPDATED_AT,
    probabilities:bank.latest,previousProbabilities:bank.previous,
    rows:rowsFor(bank,bank.latest,bank.previous)
  }));
  return res.status(200).json({
    mode:'live',
    snapshot:'2026-09-27',
    updatedAt:SOURCE_UPDATED_AT,
    sourceUpdatedAt:SOURCE_UPDATED_AT,
    previousReference:'Previous verified/reference market snapshot',
    cards
  });
}
