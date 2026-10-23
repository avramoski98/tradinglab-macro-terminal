
// Source-confirmed releases, added without inventing market consensus.
const VERIFIED_AT='2026-10-09T15:45:00Z';
const VERIFIED=[
 {day:'2026-10-14',time:'14:30',ccy:'USD',match:/Consumer Price Index|^CPI/i,event:'Consumer Price Index · Sep (headline m/m)',actual:'+0.6%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/cpi_10142026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-14',time:'14:30',ccy:'USD',match:/^Headline CPI y\/y/i,event:'Headline CPI y/y · Sep',actual:'3.7%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/cpi_10142026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-15',time:'14:30',ccy:'USD',match:/Producer Price Index|^PPI/i,event:'Producer Price Index · Sep (final demand m/m)',actual:'+1.3%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ppi_10152026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-16',time:'14:30',ccy:'USD',match:/Import and Export Price Indexes|^Import Price/i,event:'Import Price Index m/m · Sep',actual:'+1.1%',importance:'MED',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ximpim_10162026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-16',time:'14:30',ccy:'USD',match:/^Export Price Index/i,event:'Export Price Index m/m · Sep',actual:'+2.2%',importance:'MED',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ximpim_10162026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-15',time:'02:30',ccy:'AUD',match:/Labour Force|Unemployment Rate/i,event:'Labour Force · Sep (unemployment rate)',actual:'4.7%',importance:'HIGH',source:'Australian Bureau of Statistics',url:'https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/sep-2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'08:00',ccy:'GBP',match:/^CPI y\/y|Consumer Price Index/i,event:'CPI y/y · Sep',actual:'3.5%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'08:00',ccy:'GBP',match:/^Core CPI y\/y/i,event:'Core CPI y/y · Sep',actual:'2.8%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'23:45',ccy:'NZD',match:/^CPI q\/q|^Quarterly CPI q\/q/i,event:'Quarterly CPI q/q · Q3',actual:'0.7%',importance:'HIGH',source:'Stats NZ',url:'https://www.stats.govt.nz/information-releases/consumers-price-index-september-2026-quarter/',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'23:45',ccy:'NZD',match:/^CPI y\/y|^Quarterly CPI y\/y/i,event:'Quarterly CPI y/y · Q3',actual:'3.7%',importance:'HIGH',source:'Stats NZ',url:'https://www.stats.govt.nz/information-releases/consumers-price-index-september-2026-quarter/',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-20',time:'08:00',ccy:'EUR',match:/German PPI m\/m/i,event:'German PPI m/m · Sep',actual:'+1.9%',importance:'HIGH',source:'Destatis',url:'https://www.destatis.de/EN/Press/2026/10/PE26_373_61241.html',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/Average Earnings Index 3m\/y/i,event:'Average Earnings Index 3m/y · Jun–Aug',actual:'3.7%',importance:'HIGH',source:'ONS · total earnings incl. bonuses',url:'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/october2026',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/^Unemployment Rate$/i,event:'Unemployment Rate · Jun–Aug',actual:'4.7%',importance:'HIGH',source:'ONS',url:'https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'11:00',ccy:'EUR',match:/German ZEW Economic Sentiment/i,event:'German ZEW Economic Sentiment · Oct',actual:'28.1',previous:'34.7',importance:'HIGH',source:'ZEW',url:'https://www.zew.de/en/press/latest-press-releases/declining-economic-expectations',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'11:00',ccy:'EUR',match:/^ZEW Economic Sentiment$/i,event:'Euro Area ZEW Economic Sentiment · Oct',actual:'18.5',previous:'25.8',importance:'MED',source:'ZEW',url:'https://www.zew.de/en/press/latest-press-releases/declining-economic-expectations',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-05',time:'10:00',ccy:'EUR',match:/PPI m\/m|Industrial Producer Prices m\/m/i,event:'Euro Area PPI m/m · Aug',actual:'1.9%',previous:'1.6%',importance:'HIGH',source:'Eurostat',url:'https://ec.europa.eu/eurostat/en/web/products-euro-indicators/w/4-05102026-ap',status:'verified-primary',force:true},
 {day:'2026-10-06',time:'08:00',ccy:'EUR',match:/German Factory Orders|New Orders in Manufacturing/i,event:'German Factory Orders m/m · Aug',actual:'-10.6%',previous:'3.2%',importance:'HIGH',source:'Destatis',url:'https://www.destatis.de/EN/Press/2026/10/PE26_354_421.html',status:'verified-primary',force:true},
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
const OFFICIAL_UPCOMING=[
 {date:'2026-10-28T02:00:00+01:00',ccy:'NZD',event:'RBNZ Official Cash Rate Decision',match:/RBNZ|Official Cash Rate|OCR Decision/i,importance:'EXTREME',source:'Reserve Bank of New Zealand',url:'https://www.rbnz.govt.nz/monetary-policy/about-monetary-policy/the-official-cash-rate'},
 {date:'2026-10-28T14:45:00+01:00',ccy:'CAD',event:'Bank of Canada Rate Decision & Monetary Policy Report',match:/BoC|Bank of Canada.*Rate|Overnight Rate/i,importance:'EXTREME',source:'Bank of Canada',url:'https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/'},
 {date:'2026-10-28T19:00:00+01:00',ccy:'USD',event:'FOMC Rate Decision',match:/FOMC.*Rate|Federal Funds Rate|Fed Rate Decision/i,importance:'EXTREME',source:'Federal Reserve',url:'https://www.federalreserve.gov/newsevents/2026-october.htm'},
 {date:'2026-10-28T19:30:00+01:00',ccy:'USD',event:'FOMC Chair Press Conference',match:/Fed.*Press Conference|FOMC.*Press Conference/i,importance:'HIGH',source:'Federal Reserve',url:'https://www.federalreserve.gov/newsevents/2026-october.htm'},
 {date:'2026-10-29T14:15:00+01:00',ccy:'EUR',event:'ECB Rate Decision',match:/ECB.*Rate|Main Refinancing Rate|Deposit Facility Rate/i,importance:'EXTREME',source:'European Central Bank',url:'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
 {date:'2026-10-29T14:45:00+01:00',ccy:'EUR',event:'ECB Press Conference',match:/ECB.*Press Conference|Lagarde.*Press Conference/i,importance:'HIGH',source:'European Central Bank',url:'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
 {date:'2026-10-30T13:30:00+01:00',ccy:'USD',event:'Employment Cost Index · Q3',match:/Employment Cost Index/i,importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/schedule/2026/home.htm'}
];
const rank={LOW:1,MED:2,HIGH:3,EXTREME:4};
export function applyVerifiedReleaseOverlay(payload){
 if(!Array.isArray(payload?.events))return payload;
 const rows=payload.events.map(e=>({...e}));
 const activeDates=new Set(rows.map(e=>String(e.date||'').slice(0,10)));
 for(const o of VERIFIED){
  let i=rows.findIndex(e=>e.currency===o.ccy&&String(e.date||'').slice(0,10)===o.day&&o.match.test(String(e.event||'')));
  const base=i>=0?rows[i]:null;
  if(!base&&!activeDates.has(o.day)&&!o.force)continue;
  const record={
   ...(base||{}),date:base?.date||o.day+'T'+o.time+':00+02:00',
   sourceDate:base?.sourceDate||o.day+'T'+o.time+':00+02:00',
   timeZone:'Europe/Skopje',country:o.ccy,currency:o.ccy,event:o.event,
   actual:o.actual,previous:o.previous||base?.previous||'—',
   forecast:base?.forecast||'—',
   importance:rank[base?.importance]>rank[o.importance]?base.importance:o.importance,
   label:'Verified actual',impact:'Neutral',releaseState:'released',
   source:o.source,sourceUrl:o.url,verificationStatus:o.status,
   actualVerifiedAt:o.verifiedAt||VERIFIED_AT,lastUpdate:o.verifiedAt||VERIFIED_AT,
   forecastVerificationStatus:'provider-unverified'
  };
  if(i>=0)rows[i]=record;else rows.push(record);
 }
 for(const o of OFFICIAL_UPCOMING){
  if(rows.some(e=>e.currency===o.ccy&&String(e.date||'').slice(0,10)===o.date.slice(0,10)&&o.match.test(String(e.event||''))))continue;
  const upcoming=Date.parse(o.date)>Date.now();
  rows.push({date:o.date,sourceDate:o.date,timeZone:'Europe/Skopje',country:o.ccy,currency:o.ccy,event:o.event,
   importance:o.importance,previous:'—',forecast:'—',actual:'—',label:upcoming?'Scheduled · official':'OVERDUE · unverified',
   impact:'Neutral',releaseState:upcoming?'scheduled':'overdue',source:o.source,sourceUrl:o.url,
   verificationStatus:'official-schedule',lastUpdate:null,forecastVerificationStatus:'provider-unverified'});
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
