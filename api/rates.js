const BANKS = [
  {id:'FED',ccy:'USD',name:'Federal Reserve',nextMeeting:'28 Oct 2026',current:'3.75–4.00%',holdRate:'3.75–4.00%',hikeRate:'4.00–4.25%',cutRate:'3.50–3.75%',url:'https://centralbank.watch/federal-reserve/',previous:{hike:66.0,hold:34.0,cut:0.0}},
  {id:'ECB',ccy:'EUR',name:'European Central Bank',nextMeeting:'29 Oct 2026',current:'2.50%',holdRate:'2.50%',hikeRate:'2.75%',cutRate:'2.25%',url:'https://centralbank.watch/european-central-bank/',previous:{hike:38.6,hold:61.4,cut:0.0}},
  {id:'BOJ',ccy:'JPY',name:'Bank of Japan',nextMeeting:'28 Oct 2026',current:'1.25%',holdRate:'1.25%',hikeRate:'1.50%',cutRate:'1.00%',url:'https://centralbank.watch/bank-of-japan/',previous:{hike:0.0,hold:98.8,cut:1.2}},
  {id:'BOE',ccy:'GBP',name:'Bank of England',nextMeeting:'5 Nov 2026',current:'3.75%',holdRate:'3.75%',hikeRate:'4.00%',cutRate:'3.50%',url:'https://centralbank.watch/bank-of-england/',previous:{hike:85.7,hold:14.3,cut:0.0}},
  {id:'BOC',ccy:'CAD',name:'Bank of Canada',nextMeeting:'28 Oct 2026',current:'2.25%',holdRate:'2.25%',hikeRate:'2.50%',cutRate:'2.00%',url:'https://centralbank.watch/bank-of-canada/',previous:{hike:NaN,hold:NaN,cut:NaN}},
  {id:'RBA',ccy:'AUD',name:'Reserve Bank of Australia',nextMeeting:'3 Nov 2026',current:'4.60%',holdRate:'4.60%',hikeRate:'4.85%',cutRate:'4.35%',url:'https://centralbank.watch/reserve-bank-of-australia/',previous:{hike:90.0,hold:10.0,cut:0.0}},
  {id:'RBNZ',ccy:'NZD',name:'Reserve Bank of New Zealand',nextMeeting:'28 Oct 2026',current:'2.75%',holdRate:'2.75%',hikeRate:'3.00%',cutRate:'2.50%',url:'https://centralbank.watch/reserve-bank-of-new-zealand/',previous:{hike:NaN,hold:NaN,cut:NaN}},
  {id:'SNB',ccy:'CHF',name:'Swiss National Bank',nextMeeting:'10 Dec 2026',current:'0.00%',holdRate:'0.00%',hikeRate:'0.25%',cutRate:'-0.25%',url:'https://centralbank.watch/swiss-national-bank/',previous:{hike:39.9,hold:60.1,cut:0.0}},
  {id:'RIKSBANK',ccy:'SEK',name:'Riksbank',nextMeeting:'4 Nov 2026',current:'1.75%',holdRate:'1.75%',hikeRate:'2.00%',cutRate:'1.50%',url:'https://centralbank.watch/riksbank/',previous:{hike:NaN,hold:NaN,cut:NaN}},
  {id:'NORGES',ccy:'NOK',name:'Norges Bank',nextMeeting:'5 Nov 2026',current:'4.50%',holdRate:'4.50%',hikeRate:'4.75%',cutRate:'4.25%',url:'https://centralbank.watch/norges-bank/',previous:{hike:NaN,hold:NaN,cut:NaN}}
];

function cleanText(html=''){
  return String(html)
    .replace(/<h[1-3][^>]*>/gi,' ### ')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/\*\*/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function numberAfter(text,pattern){
  const m=text.match(pattern);
  return m?Number(m[1]):NaN;
}

function parseProbabilities(text){
  const hike=numberAfter(text,/Rate Hike\s*([0-9]+(?:\.[0-9]+)?)%/i);
  const hold=numberAfter(text,/(?:No Change|Hold)\s*([0-9]+(?:\.[0-9]+)?)%/i);
  const cut=numberAfter(text,/Rate Cut\s*([0-9]+(?:\.[0-9]+)?)%/i);
  if([hike,hold,cut].every(v=>Number.isFinite(v)&&v>=0&&v<=100)&&Math.abs(hike+hold+cut-100)<=0.3)return {hike,hold,cut};
  return null;
}

function rowsFor(bank,probs,previous){
  const p=probs||{hike:NaN,hold:NaN,cut:NaN};
  const prev=previous||{hike:NaN,hold:NaN,cut:NaN};
  return [
    {rate:bank.cutRate,direction:'cut',latest:p.cut,previous:prev.cut},
    {rate:bank.holdRate,direction:'hold',latest:p.hold,previous:prev.hold,current:true},
    {rate:bank.hikeRate,direction:'hike',latest:p.hike,previous:prev.hike}
  ];
}

async function fetchOnce(url,accept='text/html,application/xhtml+xml'){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),12000);
  try{
    const r=await fetch(url,{
      headers:{'User-Agent':'TradingLabMacroTerminal/6.1','Accept':accept,'Cache-Control':'no-cache'},
      signal:ctrl.signal,
      cache:'no-store'
    });
    if(!r.ok)throw new Error('HTTP '+r.status);
    return await r.text();
  }finally{clearTimeout(timer)}
}

async function fetchText(url){
  const reader='https://r.jina.ai/'+url;
  let readerError=null;
  try{return cleanText(await fetchOnce(reader,'text/plain,text/markdown,*/*'))}
  catch(e){readerError=e}
  try{return cleanText(await fetchOnce(url))}
  catch(e){throw new Error('Reader failed: '+String(readerError?.message||readerError)+'; direct source failed: '+String(e?.message||e))}
}

function bankSection(rootText,bank){
  // Match an exact bank heading and stop before the next bank heading.
  // Subheadings (######) must not terminate or extend the bank's block.
  const name=bank.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const heading=new RegExp('(?:^|\\s)### '+name+'(?=\\s|$)','i');
  const match=heading.exec(rootText);
  if(!match)return '';
  const rest=rootText.slice(match.index+match[0].length);
  const next=rest.search(/(?:^|\s)### (?!#)/);
  return rest.slice(0,next<0?rest.length:next);
}

function parseMeeting(section,fallback){
  const m=section.match(/Next Meeting Date:?\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  return m?m[1]:fallback;
}

function parseCurrent(section,fallback){
  const m=section.match(/Current Rate:?\s*([0-9]+(?:\.[0-9]+)?%)/i);
  return m?m[1]:fallback;
}

async function fetchBankFromRoot(bank,index,rootText,rootError){
  const checkedAt=new Date().toISOString();
  try{
    if(!rootText)throw rootError||new Error('Central dashboard unavailable');
    const section=bankSection(rootText,bank,index);
    const sourceDate=parseSourceDate(rootText);
    if(!sourceDate||Date.now()-Date.parse(sourceDate)>3*86400000)throw new Error('Source timestamp missing or older than three days');
    const probabilities=parseProbabilities(section);
    if(!probabilities)throw new Error('Probability block not published for this bank');
    return {
      ...bank,
      nextMeeting:parseMeeting(section,bank.nextMeeting),
      current:bank.id==='FED'?bank.current:parseCurrent(section,bank.current),
      probabilities,
      live:true,
      stale:false,
      checkedAt,
      sourceUpdatedAt:parseSourceDate(rootText),
      source:'CentralBank.Watch · source-derived probabilities'
    };
  }catch(e){
    return {
      ...bank,
      probabilities:null,
      live:false,
      stale:true,
      checkedAt,
      sourceUpdatedAt:null,
      source:'Live market probability unavailable · no stale probability displayed',
      error:String(e?.message||e)
    };
  }
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const checkedAt=new Date().toISOString();
  let rootText='',rootError=null;
  try{rootText=await fetchText('https://centralbank.watch/')}
  catch(e){rootError=e}
  const banks=await Promise.all(BANKS.map((bank,index)=>fetchBankFromRoot(bank,index,rootText,rootError)));
  const cards=banks.map(bank=>({
    id:bank.id,ccy:bank.ccy,name:bank.name,nextMeeting:bank.nextMeeting,current:bank.current,
    source:bank.source,live:bank.live,stale:bank.stale,checkedAt:bank.checkedAt,
    sourceUpdatedAt:bank.sourceUpdatedAt,error:bank.error||null,
    probabilities:bank.probabilities||{hike:NaN,hold:NaN,cut:NaN},
    previousProbabilities:null,
    rows:rowsFor(bank,bank.probabilities,null)
  }));
  const liveCount=cards.filter(x=>x.live).length;
  const sourceUpdatedAt=parseSourceDate(rootText);
  return res.status(200).json({
    mode:liveCount===cards.length?'live':liveCount?'partial-live':'unavailable',
    snapshot:checkedAt.slice(0,10),
    updatedAt:checkedAt,
    sourceUpdatedAt:parseSourceDate(rootText),
    freshnessSeconds:sourceUpdatedAt?Math.max(0,Math.floor((Date.now()-Date.parse(sourceUpdatedAt))/1000)):null,
    liveCount,
    totalCount:cards.length,
    previousReference:'Previous verified/reference market snapshot',
    cards
  });
}

function parseSourceDate(text){const m=text.match(/Data as of\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);if(!m)return null;const d=new Date(m[1]+" 00:00:00 UTC");return Number.isFinite(+d)?d.toISOString():null;}
