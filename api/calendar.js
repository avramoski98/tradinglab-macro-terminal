
// Source-confirmed releases, added without inventing market consensus.
const VERIFIED_AT='2026-10-09T15:45:00Z';
const VERIFIED=[
 {day:'2026-10-08',time:'08:00',ccy:'EUR',match:/German Trade Balance/i,event:'German Trade Balance · Aug',actual:'19.5B',previous:'21.6B',importance:'MED',source:'Destatis / Reuters',url:'https://www.reuters.com/world/china/german-exports-unexpectedly-fall-august-2026-10-08/',status:'verified-secondary'},
 {day:'2026-10-08',time:'14:30',ccy:'USD',match:/Unemployment Claims|Initial Jobless Claims/i,event:'Initial Jobless Claims · week ending 3 Oct',actual:'197K',previous:'199K',importance:'HIGH',source:'U.S. Department of Labor / AP',url:'https://apnews.com/article/7d52b48a5f41e60630d96c7a1711774c',status:'verified-secondary'},
 {day:'2026-10-09',time:'01:30',ccy:'JPY',match:/Household Spending/i,event:'Household Spending y/y · Aug',actual:'-3.1%',previous:'-3.6%',importance:'MED',source:'Statistics Bureau of Japan',url:'https://www.stat.go.jp/data/kakei/sokuhou/tsuki/index.html',status:'verified-primary'},
 {day:'2026-10-09',time:'08:00',ccy:'NOK',match:/^(?:CPI y\/y|Inflation Rate y\/y)/i,event:'CPI y/y · Sep',actual:'3.4%',previous:'3.3%',importance:'HIGH',source:'Statistics Norway',url:'https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen/artikler/cpi-up-3.4-per-cent-last-12-months-0926',status:'verified-primary'},
 {day:'2026-10-09',time:'08:00',ccy:'NOK',match:/CPI-ATE|Core CPI/i,event:'Core CPI-ATE y/y · Sep',actual:'3.0%',previous:'3.0%',importance:'HIGH',source:'Statistics Norway',url:'https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen/artikler/cpi-up-3.4-per-cent-last-12-months-0926',status:'verified-primary'},
 {day:'2026-10-09',time:'10:00',ccy:'EUR',match:/Italian Industrial Production m\/m/i,event:'Italian Industrial Production m/m · Aug',actual:'-1.3%',importance:'MED',source:'Istat',url:'https://www.istat.it/comunicato-stampa/produzione-industriale-agosto-2026/',status:'verified-primary'},
 {day:'2026-10-09',time:'14:30',ccy:'CAD',match:/^Employment Change$/i,event:'Employment Change · Sep',actual:'-68.3K',previous:'-41.7K',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261009/dq261009a-eng.htm',status:'verified-primary'},
 {day:'2026-10-09',time:'14:30',ccy:'CAD',match:/^Unemployment Rate$/i,event:'Unemployment Rate · Sep',actual:'6.5%',previous:'6.4%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261009/dq261009a-eng.htm',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/Prelim UoM Consumer Sentiment/i,event:'Prelim UoM Consumer Sentiment · Oct',actual:'46.3',previous:'48.1',importance:'HIGH',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/Prelim UoM (?:1-Yr )?Inflation Expectations/i,event:'Prelim UoM 1-Yr Inflation Expectations · Oct',actual:'4.7%',previous:'4.6%',importance:'MED',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/UoM 5-Yr Inflation Expectations/i,event:'Prelim UoM 5-Yr Inflation Expectations · Oct',actual:'3.5%',previous:'3.4%',importance:'MED',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'}
];
const rank={LOW:1,MED:2,HIGH:3,EXTREME:4};
export function applyVerifiedReleaseOverlay(payload){
 if(!Array.isArray(payload?.events))return payload;
 const rows=payload.events.map(e=>({...e}));
 const activeDates=new Set(rows.map(e=>String(e.date||'').slice(0,10)));
 for(const o of VERIFIED){
  let i=rows.findIndex(e=>e.currency===o.ccy&&String(e.date||'').slice(0,10)===o.day&&o.match.test(String(e.event||'')));
  const base=i>=0?rows[i]:null;
  if(!base&&!activeDates.has(o.day))continue;
  const record={
   ...(base||{}),date:base?.date||o.day+'T'+o.time+':00+02:00',
   sourceDate:base?.sourceDate||o.day+'T'+o.time+':00+02:00',
   timeZone:'Europe/Skopje',country:o.ccy,currency:o.ccy,event:o.event,
   actual:o.actual,previous:o.previous||base?.previous||'—',
   forecast:base?.forecast||'—',
   importance:rank[base?.importance]>rank[o.importance]?base.importance:o.importance,
   label:'Verified actual',impact:'Neutral',releaseState:'released',
   source:o.source,sourceUrl:o.url,verificationStatus:o.status,
   actualVerifiedAt:VERIFIED_AT,lastUpdate:VERIFIED_AT,
   forecastVerificationStatus:'provider-unverified'
  };
  if(i>=0)rows[i]=record;else rows.push(record);
 }
 rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return {...payload,events:rows,
  overdue:rows.filter(e=>e.releaseState==='overdue').length,
  checking:rows.filter(e=>e.releaseState==='checking').length,
  provider:(payload.provider||'Calendar')+' + official Oct 8–9 release overlay',
  releaseOverlayVerifiedAt:VERIFIED_AT};
}
export default async function handler(req,res){
 const {default:legacyHandler}=await import('../lib/calendar-legacy.mjs');
 const proxy={
  setHeader:(...args)=>res.setHeader(...args),
  status(code){res.status(code);return this;},
  json(payload){return res.json(applyVerifiedReleaseOverlay(payload));}
 };
 return legacyHandler(req,proxy);
}
