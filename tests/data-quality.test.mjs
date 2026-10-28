import {regimeHighImpact,categories} from '../api/news.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {numeric,normalizeRelease} from '../lib/economic-provider.mjs';
import economic from '../api/economic.js';
import {applyVerifiedReleaseOverlay} from '../api/calendar.js';

test('BoC 28 Oct +25bp release clears all three CAD overdue rows without primary provenance inflation',()=>{
 for(const payload of [
  {mode:'live',events:[
   {date:'2026-10-28T14:45:00+01:00',currency:'CAD',event:'BOC Monetary Policy Report',actual:'—',releaseState:'overdue'},
   {date:'2026-10-28T14:45:00+01:00',currency:'CAD',event:'BOC Rate Statement',actual:'—',releaseState:'overdue'},
   {date:'2026-10-28T14:45:00+01:00',currency:'CAD',event:'Overnight Rate',actual:'—',forecast:'2.50%',previous:'2.25%',releaseState:'overdue'}
  ]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const rows=out.events.filter(e=>e.currency==='CAD'&&/Bank of Canada Overnight Rate|BOC Rate Statement|BOC Monetary Policy Report/i.test(e.event));
  assert.equal(rows.length,3,'three distinct published BoC rows in '+payload.mode);
  assert.ok(rows.every(e=>e.releaseState==='released'),'no BoC overdue after verified publication');
  assert.ok(rows.every(e=>/verified-secondary/.test(e.verificationStatus)),'original BoC primary statement not independently retrieved');
  const rate=rows.find(e=>/Overnight Rate/.test(e.event));
  assert.equal(rate.actual,'2.50%');
  assert.equal(rate.previous,'2.25%');
  assert.equal(rate.forecast,'—','unverified provider forecast must not be elevated to consensus');
  assert.equal(rate.actualVerifiedAt,'2026-10-28T13:50:00Z');
  for(const e of rows.filter(e=>!/Overnight Rate/.test(e.event))){
   assert.equal(e.actual,'Published');
   assert.equal(e.numericActualVerified,false);
   assert.equal(e.actualVerifiedAt,null);
  }
  assert.equal(out.events.filter(e=>e.currency==='CAD'&&e.releaseState==='overdue').length,0);
 }
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(html.includes('BANK OF CANADA +25bp'));
 assert.ok(html.includes('BoC HIKE +25bp'));
 const rates=fs.readFileSync('api/rates.js','utf8');
 assert.ok(rates.includes("nextMeeting:'9 Dec 2026',current:'2.50%',holdRate:'2.50%',hikeRate:'2.75%',cutRate:'2.25%'"));
});

test('Census CB26-177 clears Sep advance goods trade overdue in LIVE and FALLBACK and updates both narratives',()=>{
 for(const payload of [
  {mode:'live',events:[{date:'2026-10-28T13:30:00+01:00',currency:'USD',event:'Goods Trade Balance',actual:'—',previous:'-132.6B',forecast:'-130.4B',releaseState:'checking'}]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const matches=out.events.filter(e=>e.currency==='USD'&&e.event==='Advance Goods Trade Balance · Sep');
  assert.equal(matches.length,1,'one Census trade release in '+payload.mode);
  const row=matches[0];
  assert.equal(row.actual,'-134.9B');
  assert.equal(row.previous,'-132.1B revised','official revision supersedes provider previous');
  assert.equal(row.forecast,'—','unverified market forecast must not be imported');
  assert.equal(row.releaseState,'released');
  assert.equal(row.verificationStatus,'verified-primary');
  assert.equal(row.actualVerifiedAt,'2026-10-28T12:30:00Z');
  assert.equal(row.releaseTimeVerified,true);
  assert.equal(row.sourceUrl,'https://www.census.gov/econ/indicators/current/index.html');
  assert.equal(out.events.filter(e=>e.currency==='USD'&&/Goods Trade Balance/.test(e.event)&&e.releaseState!=='released').length,0);
 }
 const html=fs.readFileSync('index.html','utf8');
 assert.equal(html.split('https://www.census.gov/econ/indicators/current/index.html').length-1,2,'Census source linked in Macro Watch and Weekly Focus');
 assert.ok(html.includes('US ADVANCE GOODS TRADE (USD · CENSUS PRIMARY)'));
 assert.ok(html.includes('US ADVANCE GOODS TRADE · USD (CENSUS PRIMARY)'));
});


test('Census CB26-177 releases September advance wholesale inventories with revised official prior',()=>{
 for(const payload of [
  {mode:'live',events:[{date:'2026-10-28T13:30:00+01:00',currency:'USD',event:'Prelim Wholesale Inventories m/m',actual:'—',previous:'0.7%',forecast:'0.5%',releaseState:'overdue'}]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const matches=out.events.filter(e=>e.currency==='USD'&&e.event==='Prelim Wholesale Inventories m/m · Sep (Census)');
  assert.equal(matches.length,1);
  const row=matches[0];
  assert.equal(row.actual,'+0.6%');
  assert.equal(row.previous,'+0.5% (unrevised)');
  assert.equal(row.forecast,'—');
  assert.equal(row.releaseState,'released');
  assert.equal(row.verificationStatus,'verified-primary');
  assert.equal(row.sourceUrl,'https://www.census.gov/econ/indicators/current/index.html');
 }
});

const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(d){this.data=d;return this;}});
// Regression fixtures may include real official-schedule events whose release
// time has passed while their actual is still unverified. Those must remain
// OVERDUE in production; tests of *other* verified releases should not force
// the global calendar overdue counter to zero.
const unresolvedNonScheduleOverdue=(data)=>data.events.filter(
 e=>e.releaseState==='overdue'&&!['official-schedule','verified-secondary-schedule'].includes(e.verificationStatus)
).length;

test('German GfK consumer climate clears live overdue and is added once in fallback with secondary provenance',()=>{
 for(const payload of [
  {mode:'live',events:[{date:'2026-10-28T08:00:00+01:00',currency:'EUR',event:'German GfK Consumer Climate',releaseState:'overdue',actual:'—',previous:'-30.6',forecast:'-30.3',importance:'MED'}]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const matches=out.events.filter(e=>e.currency==='EUR'&&/^German GfK Consumer Climate/.test(e.event));
  assert.equal(matches.length,1,'one GfK release in '+payload.mode);
  const row=matches[0];
  assert.equal(row.releaseState,'released');
  assert.equal(row.actual,'-30.8');
  assert.equal(row.previous,'-30.6');
  assert.equal(row.forecast,'—','unverified wire consensus not imported');
  assert.equal(row.verificationStatus,'verified-secondary');
  assert.equal(row.releaseTimeVerified,true);
  assert.match(row.source,/NIM numeric bulletin not independently verified/);
  assert.ok(row.sourceUrl.includes('financialjuice.com'));
  assert.equal(out.events.filter(e=>e.releaseState==='overdue'&&/GfK/.test(e.event)).length,0);
 }
});

test('API WSB publication clears overdue in live and fallback without inventing full-report actual',()=>{
 for(const payload of [
  {mode:'live',events:[{date:'2026-10-27T21:30:00+01:00',currency:'USD',event:'API Weekly Statistical Bulletin',actual:'—',releaseState:'overdue',importance:'LOW'}]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const rows=out.events.filter(e=>e.currency==='USD'&&/^API Weekly Statistical Bulletin/.test(e.event));
  assert.equal(rows.length,1,'one API WSB row in '+payload.mode);
  const e=rows[0];
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'Published','WSB is multi-metric; crude highlight is not whole report');
  assert.equal(e.numericActualVerified,false);
  assert.equal(e.actualVerifiedAt,null);
  assert.equal(e.verificationStatus,'verified-secondary-publication');
  assert.match(e.label,/crude stocks -2\.031M/);
  assert.match(e.source,/subscription-only/);
  assert.equal(e.forecast,'—');
  assert.equal(out.events.filter(x=>x.releaseState==='overdue'&&/API Weekly Statistical Bulletin/.test(x.event)).length,0);
 }
});

test('ECB 27 Oct M3 and household private loans are primary-verified and no longer overdue in live/fallback',()=>{
 const cases=[
  {mode:'schedule-fallback',events:[]},
  {mode:'live',events:[
   {date:'2026-10-27T10:00:00+01:00',currency:'EUR',event:'M3 Money Supply y/y',actual:'—',releaseState:'overdue',importance:'MED'},
   {date:'2026-10-27T10:00:00+01:00',currency:'EUR',event:'Private Loans y/y',actual:'—',releaseState:'overdue',importance:'MED'}
  ]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const checks=[[/^M3 Money Supply/i,'3.5%','3.5%'],[/^Private Loans/i,'3.1%','3.1%']];
  for(const [re,actual,previous] of checks){
   const matches=out.events.filter(e=>e.currency==='EUR'&&re.test(e.event));
   assert.equal(matches.length,1,'one ECB monetary event in '+payload.mode);
   const e=matches[0];
   assert.equal(e.date,'2026-10-27T10:00:00+01:00');
   assert.equal(e.actual,actual,'official ECB result');
   assert.equal(e.previous,previous,'official prior month');
   assert.equal(e.forecast,'—','no fabricated consensus');
   assert.equal(e.releaseState,'released','official publication clears overdue');
   assert.equal(e.verificationStatus,'verified-primary');
   assert.ok(e.sourceUrl.includes('ecb.europa.eu'));
  }
  assert.equal(unresolvedNonScheduleOverdue(out),0,'no ECB overdue events in '+payload.mode);
 }
 const fallback=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]},{includeFullSchedule:true});
 const household=fallback.events.find(e=>/^Private Loans/.test(e.event));
 assert.match(household.event,/household loans/i,'distinguish household series');
 assert.match(household.source,/4.3%/,'do not conflate total private-sector lending');
});
test('Oct 27 Spain EPA and France confidence clear live overdue and appear once in fallback with honest provenance',()=>{
 const cases=[
  {mode:'live',events:[
   {date:'2026-10-27T09:00:00+01:00',currency:'EUR',event:'Spanish Unemployment Rate',actual:'—',previous:'9.9%',forecast:'9.9%',releaseState:'overdue',importance:'MED'},
   {date:'2026-10-27T08:45:00+01:00',currency:'EUR',event:'French Consumer Confidence',actual:'—',previous:'86',forecast:'85',releaseState:'overdue',importance:'MED'}
  ]},
  {mode:'schedule-fallback',events:[]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload);
  const es=out.events.filter(e=>e.currency==='EUR'&&/Spanish Unemployment Rate/.test(e.event));
  const fr=out.events.filter(e=>e.currency==='EUR'&&/French Consumer Confidence/.test(e.event));
  assert.equal(es.length,1,payload.mode+' Spanish unique');
  assert.equal(fr.length,1,payload.mode+' French unique');
  assert.equal(es[0].actual,'10.18%');
  assert.equal(es[0].previous,'9.87%');
  assert.equal(fr[0].actual,'80');
  assert.equal(fr[0].previous,'—','unresolved INSEE revised previous not invented');
  for(const e of [...es,...fr]){
   assert.equal(e.releaseState,'released');
   assert.equal(e.verificationStatus,'verified-secondary');
   assert.equal(e.forecast,'—');
   assert.equal(e.releaseTimeVerified,false);
   assert.ok(e.sourceUrl.startsWith('https://'));
  }
  assert.equal(unresolvedNonScheduleOverdue(out),0);
 }
});
test('Oct 27 SPPI and BRC releases clear live overdue and fallback without fabricated forecasts',()=>{
 const cases=[
  {mode:'live',events:[
   {date:'2026-10-27T00:50:00+01:00',currency:'JPY',event:'SPPI y/y',releaseState:'overdue',actual:'—',previous:'3.7%',forecast:'3.6%',importance:'MED'},
   {date:'2026-10-27T01:01:00+01:00',currency:'GBP',event:'BRC Shop Price Index y/y',releaseState:'overdue',actual:'—',previous:'1.4%',forecast:'1.6%',importance:'LOW'}
  ]},
  {mode:'schedule-fallback',events:[]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload);
  const jpy=out.events.filter(e=>e.currency==='JPY'&&/SPPI y\/y · Sep/.test(e.event));
  const gbp=out.events.filter(e=>e.currency==='GBP'&&/BRC Shop Price Index y\/y · Oct/.test(e.event));
  assert.equal(jpy.length,1,'single JPY SPPI in '+payload.mode);
  assert.equal(gbp.length,1,'single GBP BRC in '+payload.mode);
  for(const [row,actual,previous] of [[jpy[0],'3.7%','3.5%'],[gbp[0],'2.1%','1.4%']]){
   assert.equal(row.releaseState,'released');
   assert.equal(row.actual,actual);
   assert.equal(row.previous,previous);
   assert.equal(row.forecast,'—');
   assert.equal(row.verificationStatus,'verified-secondary');
   assert.equal(row.releaseTimeVerified,false);
   assert.ok(row.sourceUrl.includes('reuters.com'));
  }
  assert.equal(unresolvedNonScheduleOverdue(out),0);
 }
});
test('RBA Brad Jones Oct 26 panel clears past speech pending with official source and no fabricated numeric actual',()=>{
 const cases=[
  {mode:'live',events:[{date:'2026-10-25T22:10:00+01:00',currency:'AUD',event:'RBA Assist Gov Jones Speaks',actual:'—',releaseState:'awaiting-confirmation',importance:'MED'}]},
  {mode:'schedule-fallback',events:[]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload);
  const matches=out.events.filter(x=>x.currency==='AUD'&&/RBA Assistant Governor Brad Jones/.test(x.event));
  assert.equal(matches.length,1,'single verified speech row in '+payload.mode);
  const e=matches[0];
  assert.equal(e.date,'2026-10-25T22:10:00+01:00');
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'Published');
  assert.equal(e.forecast,'—');
  assert.equal(e.numericActualVerified,false);
  assert.equal(e.actualVerifiedAt,null);
  assert.equal(e.verificationStatus,'verified-primary');
  assert.equal(e.releaseTimeVerified,true);
  assert.ok(e.sourceUrl.includes('rba.gov.au/speeches/2026/sp-ag-2026-10-26.html'));
  assert.equal(unresolvedNonScheduleOverdue(out),0);
 }
});
test('October 26 CBI survey publication clears live overdue without inventing October numeric actual',()=>{
 const cases=[
  {mode:'live',events:[{date:'2026-10-26T12:00:00+01:00',currency:'GBP',event:'CBI Realized Sales',releaseState:'overdue',actual:'—',previous:'-55',forecast:'-50'}]},
  {mode:'schedule-fallback',events:[]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload);
  const rows=out.events.filter(x=>x.currency==='GBP'&&/CBI Distributive Trades/.test(x.event));
  assert.equal(rows.length,1,payload.mode);
  const e=rows[0];
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'—');
  assert.equal(e.previous,'-55');
  assert.equal(e.forecast,'—');
  assert.equal(e.numericActualVerified,false);
  assert.equal(e.actualVerifiedAt,null);
  assert.equal(e.verificationStatus,'verified-secondary-publication');
  assert.ok(e.sourceUrl.includes('reuters.com'));
  assert.equal(unresolvedNonScheduleOverdue(out),0);
 }
});
test('numeric values preserve missing versus zero and magnitude',()=>{assert.equal(numeric('0.0%'),0);assert.equal(numeric('—'),null);assert.equal(numeric(null),null);assert.equal(numeric('1.2M'),1200000);assert.equal(numeric('-200K'),-200000);assert.equal(numeric('inflation rose 3%'),null);});
test('release dates are UTC; previous revision is not current actual',()=>{const e=normalizeRelease({Date:'2026-10-02T12:30:00',Actual:'178K',Forecast:'175K',Previous:'142K',Revised:'161K',Reference:'Sep',ReferenceDate:'2026-09-01T00:00:00',LastUpdate:'2026-10-02T12:31:00'});assert.equal(e.releaseDate,'2026-10-02T12:30:00.000Z');assert.equal(e.actual,178000);assert.equal(e.previous,142000);assert.equal(e.priorBeforeRevision,161000);assert.equal(e.surprise,3000);assert.equal(e.reference,'Sep');assert.equal(normalizeRelease({Date:'invalid'}),null);});
test('missing configured provider returns explicit unavailable response',async()=>{const key=process.env.TRADING_ECONOMICS_KEY;delete process.env.TRADING_ECONOMICS_KEY;try{const res=response();await economic({query:{currency:'USD',months:'6'}},res);assert.equal(res.code,503);assert.equal(res.data.mode,'not-configured');assert.deepEqual(res.data.events,[]);assert.equal(res.data.sourceUpdatedAt,null);}finally{if(key)process.env.TRADING_ECONOMICS_KEY=key;}});
test('economic endpoint validates queries',async()=>{const res=response();await economic({query:{currency:'XXX',months:'6'}},res);assert.equal(res.code,400);});
const ctx={Date,AbortController,setTimeout,clearTimeout,fetch:()=>{},process};vm.createContext(ctx);vm.runInContext(fs.readFileSync('api/rates.js','utf8').replace('export default async function','async function'),ctx);
test('rates accept markdown fixture, reject invalid probability totals',()=>{const source=fs.readFileSync('tests/fixtures/rates-source.txt','utf8'),clean=ctx.cleanText(source),bank={name:'Federal Reserve'};const block=ctx.bankSection(clean,bank,0),p=ctx.parseProbabilities(block);assert.ok(p);assert.equal(p.hike,19.5);assert.equal(p.hold,80.5);assert.equal(ctx.parseProbabilities('Rate Hike 90% Hold 90% Rate Cut 1%'),null);assert.equal(ctx.parseSourceDate(clean),'2026-10-06T00:00:00.000Z');});
const html=fs.readFileSync('index.html','utf8'),inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
test('main terminal inline scripts all parse',()=>{for(const x of inline)new vm.Script(x[1]);});
test('displayed G10 calendar respects verified qualitative releases without numeric actual',()=>{
 const source=html.match(/function calendarReleased\([^)]*\)\{[^}]*\}/)?.[0];
 assert.ok(source,'calendarReleased helper exists');
 const c={};vm.createContext(c);vm.runInContext(source,c);
 const row=Array(11).fill(null);
 row[10]='released';assert.equal(c.calendarReleased(row,null,null,null),true,'source-confirmed release must not appear OVERDUE');
 row[10]='overdue';assert.equal(c.calendarReleased(row,null,null,null),false,'unconfirmed release stays overdue');
 row[10]='scheduled';assert.equal(c.calendarReleased(row,null,null,null),false,'future event stays pending');
 assert.equal(c.calendarReleased(row,{actual:'Published'},null,null),true,'verified override releases event');
 assert.match(html,/RELEASED · NUMERIC ACTUAL UNVERIFIED/,'released state is displayed without inventing numeric Actual');
});
test('headline inflation series never mixes CPI q/q or m/m with y/y',()=>{const src=html.slice(html.indexOf('function verifiedArchiveSeries'),html.indexOf('function econIndicatorList'));const c={ARCHIVE_ECON_POINTS:{NZD:[{category:'inflation',event:'Quarterly CPI y/y',reference:'2026-09',actual:3.7,releaseDate:'2026-10-22',verificationStatus:'verified-primary'},{category:'inflation',event:'Quarterly CPI q/q',reference:'2026-09',actual:0.7,releaseDate:'2026-10-22',verificationStatus:'verified-primary'}],GBP:[{category:'inflation',event:'CPI y/y',reference:'2026-09',actual:3.5,releaseDate:'2026-10-21',verificationStatus:'verified-primary'},{category:'inflation',event:'CPI m/m',reference:'2026-09',actual:0.4,releaseDate:'2026-10-21',verificationStatus:'verified-primary'}]}};vm.createContext(c);vm.runInContext(src,c);assert.equal(c.verifiedArchiveSeries('NZD','inflation',{primary:true}).length,1);assert.equal(c.verifiedArchiveSeries('NZD','inflation',{primary:true})[0][1],3.7);assert.equal(c.verifiedArchiveSeries('GBP','inflation',{primary:true}).length,1);assert.equal(c.verifiedArchiveSeries('GBP','inflation',{primary:true})[0][1],3.5);});
test('G10 summary and verified snapshot both select annual headline CPI only',()=>{const annual='latest(rr,/^(?:Headline CPI|Monthly CPI|Quarterly CPI|CPI|HICP)';assert.equal(html.split(annual).length-1,2);});
test('monthly coverage cannot be mislabeled quarterly',()=>{const a=html.slice(html.indexOf('function observationMonthKey'),html.indexOf('function freshnessInfo'));vm.runInContext(a,ctx);const c=ctx.coverageInfo([['2026-08',1],['2026-09',2]],'claims');assert.equal(c.required,6);assert.equal(c.complete,false);});
test('null rates do not display 0%',()=>{const a=html.slice(html.indexOf('function rateProbFmt'),html.indexOf('function rateSnapshot'));vm.runInContext(a,ctx);assert.equal(ctx.rateProbFmt(null),'—');assert.equal(ctx.rateProbFmt(0),'0.00%');assert.deepEqual(JSON.parse(JSON.stringify(ctx.rateValues([{rate:'2%',latest:null}],'latest'))),{});});
test('bank sections never borrow another bank probabilities',()=>{const source=ctx.cleanText(fs.readFileSync('tests/fixtures/rates-source.txt','utf8'));const boj=ctx.parseProbabilities(ctx.bankSection(source,{name:'Bank of Japan'}));assert.equal(boj.hike,0);assert.equal(boj.hold,95.1);assert.equal(ctx.parseProbabilities(ctx.bankSection(source,{name:'Reserve Bank of New Zealand'})),null);assert.equal(ctx.bankSection(source,{name:'Bank of Canada'}),'');});
test('verified snapshot has traceable, non-future observations and honest coverage totals',()=>{const d=JSON.parse(fs.readFileSync('assets/economic-archive.json')),rows=Object.values(d.currencies).flat(),verified=rows.filter(x=>x.verificationStatus==='verified-primary');assert.equal(d.audit.verified,verified.length);assert.equal(d.audit.total,rows.length);const keys=new Set();for(const x of verified){assert.ok(Number.isFinite(x.actual));assert.equal(new URL(x.sourceUrl).protocol,'https:');assert.ok(Date.parse(x.verifiedAt)<=Date.now());if(x.releaseDate)assert.ok(Date.parse(x.releaseDate)<=Date.now());assert.equal(x.forecast,null,'primary statistics do not supply verified market consensus');const key=[x.event,x.reference,x.source].join('|');assert.ok(!keys.has(key),key);keys.add(key)}for(const [c,rr] of Object.entries(d.currencies))assert.ok(rr.some(x=>x.verificationStatus==='verified-primary'&&/GDP/.test(x.event)),c+' GDP coverage');});
test('reviewed calendar actuals preserve forecasts without claiming consensus verification',()=>{const context={Date,Intl,console,AbortSignal,process,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(fs.readFileSync('lib/calendar-legacy.mjs','utf8').replace('export default async function','async function'),context);const result=context.applyPrimaryActuals([{date:'2026-10-07T01:30:00+02:00',currency:'JPY',event:'Labor Cash Earnings y/y',actual:'—',forecast:'3.3%',previous:'2.4%'}])[0];assert.equal(result.actual,'3.8%');assert.equal(result.forecast,'3.3%');assert.equal(result.verificationStatus,'verified-primary');assert.equal(result.forecastVerificationStatus,'provider-unverified');});

test('blank and future releases cannot create trading catalysts',()=>{const h=fs.readFileSync('index.html','utf8'),c={Date,liveEvents:[{date:'2099-01-01',actual:'100K',forecast:'50K'},{date:'2026-10-07T01:00:00Z',actual:'—',forecast:'90K'}],catalystKind:()=> 'NFP',catalystWeight:()=>3};vm.createContext(c);vm.runInContext(h.slice(h.indexOf('function num(v)'),h.indexOf('function inferSurprise')),c);vm.runInContext(h.slice(h.indexOf('function scoredLiveEvents()'),h.indexOf('function canonicalCatalystEvent')),c);assert.ok(Number.isNaN(c.num('—')));assert.ok(Number.isNaN(c.num('')));assert.equal(c.num('1.2M'),1200000);assert.equal(c.num('0.0%'),0);assert.equal(c.scoredLiveEvents().length,0);});

test('history window includes midnight on its first day',()=>{const js=fs.readFileSync('assets/economic-data.js','utf8'),FakeDate=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-07T19:00:00Z']))}},c={Date:FakeDate,state:{months:6,events:[{event:'CPI',actual:3,referenceDate:'2026-04-01T00:00:00Z'}]},matches:()=>true};vm.createContext(c);vm.runInContext(js.slice(js.indexOf('function visible()'),js.indexOf('function render()')),c);assert.equal(c.visible().length,1);});

test('G10 coverage and freshness do not count undated archived values',()=>{
 const c={Date,monthNum:(x)=>{const [y,m]=String(x).split('-').map(Number);return y*12+m;}};
 vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('function observationMonthKey'),html.indexOf('function econIndicatorList')),c);
 const archive=Array.from({length:6},(_,i)=>['2026-'+String(i+4).padStart(2,'0'),2.5,null,null]);
 assert.equal(c.coverageInfo(archive,'Headline CPI y/y').complete,false);
 assert.equal(c.coverageInfo(archive,'Headline CPI y/y').count,0);
 assert.equal(c.freshnessInfo(null).label,'UNVERIFIED');
 assert.equal(c.coverageInfo([['2026-03',3,'2026-04-15T10:00:00Z','verified-primary'],['2026-06',4,'2026-07-15T10:00:00Z','verified-primary']],'Quarterly CPI y/y').required,2);
});
test('EIA published overrides remain secondary verified and USDA is not auto-released',()=>{
 const c={Date,fetch:async()=>({ok:false}),console};vm.createContext(c);
 vm.runInContext(fs.readFileSync('api/commodity-calendar.js','utf8').replace('export default async function','async function'),c);
 const rows=c.knownEiaRows();assert.equal(rows.length,4);assert.ok(rows.some(x=>x.event.includes('Natural Gas Storage')&&x.actual==='+77B'));assert.ok(rows.some(x=>x.event.includes('Crude Oil Inventories')&&x.actual==='-3.060M'));
 assert.ok(rows.every(x=>x.verificationStatus==='verified-secondary'&&x.releaseState==='released'));
 assert.ok(c.usdaRows().filter(x=>Date.parse(x.date)<Date.now()).every(x=>x.actual==='—'&&(x.releaseState==='overdue'||(x.releaseState==='released'&&x.verificationStatus==='verified-primary'&&!!x.sourceUrl))));
});

test('official Oct 9 calendar overlay resolves CAD and USD releases without fabricating consensus',()=>{
 const input={mode:'live',events:[{date:'2026-10-09T14:30:00+02:00',currency:'CAD',event:'Employment Change',actual:'—',forecast:'6.1K',releaseState:'overdue'},{date:'2026-10-09T16:00:00+02:00',currency:'USD',event:'Prelim UoM Consumer Sentiment',actual:'—',forecast:'47.5',releaseState:'overdue'}]};
 const out=applyVerifiedReleaseOverlay(input),cad=out.events.find(x=>x.currency==='CAD'&&/Employment Change/.test(x.event)),usd=out.events.find(x=>x.currency==='USD'&&/Consumer Sentiment/.test(x.event));
 assert.equal(cad.actual,'-68.3K');assert.equal(cad.forecast,'6.1K');assert.equal(cad.verificationStatus,'verified-primary');assert.equal(cad.releaseState,'released');
 assert.equal(usd.actual,'46.3');assert.equal(usd.forecast,'47.5');assert.equal(usd.releaseState,'released');assert.equal(unresolvedNonScheduleOverdue(out),0);
});

// Freshness must respect quarterly frequency; API polling must not manufacture rate history.
test('quarterly releases use quarterly freshness windows',()=>{const c={Date};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function freshnessInfo('),html.indexOf('function verifiedArchiveSeries(')),c);const latest=new Date(Date.now()-82*86400000).toISOString();assert.equal(c.freshnessInfo(latest,false).label,'STALE');assert.equal(c.freshnessInfo(latest,true).label,'FRESH');});
test('rate history rejects unverified and repeated polling snapshots',()=>{const memory={};const c={Date,localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v}};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('const RATE_SNAPSHOT_KEY='),html.indexOf('function rateOutcome(')),c);const rows=[{rate:'4%',latest:20,direction:'hike'},{rate:'3.75%',latest:70,direction:'hold'},{rate:'3.5%',latest:10,direction:'cut'}],stamp=new Date().toISOString();const payload={cards:[{id:'FED',live:true,stale:false,sourceUpdatedAt:stamp,rows}]};const first=c.rateHistory(payload),second=c.rateHistory(payload);assert.equal(first.cards[0].history.length,1);assert.equal(second.cards[0].history.length,1);const unavailable=c.rateHistory({cards:[{id:'FED',live:false,stale:true,sourceUpdatedAt:null,rows:rows.map(x=>({...x,latest:null}))}]});assert.equal(unavailable.cards[0].live,false);assert.ok(unavailable.cards[0].rows.every(x=>Number.isNaN(x.currentPricing)));assert.equal(c.rateProbFmt(null),'—');});


test('Sweden final CPI CPIF and core CPIF each have six official monthly releases',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json'));
 const names=['CPI y/y','CPIF y/y','Core CPIF excluding energy y/y'];
 for(const name of names){
  const rows=d.currencies.SEK.filter(x=>x.event===name);
  assert.equal(rows.length,6,name+' six observations');
  assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
  assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.stage==='final'&&x.sourceUrl.includes('scb.se')&&x.releaseDate&&x.sourceUpdatedAt),name+' provenance');
 }
 const latest=d.currencies.SEK.filter(x=>x.reference==='2026-09'&&names.includes(x.event));
 assert.deepEqual(names.map(name=>latest.find(x=>x.event===name)?.actual),[1.1,1.5,0.5]);
});


test('Swiss SECO unemployment has six verified monthly observations and publication dates',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json'));
 const rows=d.currencies.CHF.filter(x=>x.event==='Unemployment rate · SA');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[3.0,3.1,3.1,3.1,3.1,3.1]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-07','2026-06-04','2026-07-06','2026-08-06','2026-09-07','2026-10-06']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('seco.admin.ch')&&x.sourceUpdatedAt&&x.releaseTimeKnown===false));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
});


test('Canada core CPI median and trimmed series use six verified revised official months',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json'));
 const specs={'Core CPI-median y/y':[2.1,2.1,1.9,2.0,2.0,1.9],'Core CPI-trim y/y':[2.0,2.0,1.9,1.9,1.9,1.8]};
 for(const [name,values] of Object.entries(specs)){
  const rows=d.currencies.CAD.filter(x=>x.event===name);
  assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
  assert.deepEqual(rows.map(x=>x.actual),values);
  assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.stage==='official-revised-table'&&x.sourceUrl.includes('statcan.gc.ca')&&x.sourceUpdatedAt==='2026-10-19T12:30:00Z'));
 }
});

test('Canada median and trimmed October 19 CPI releases are not left overdue',()=>{
 const input={mode:'live',events:[{date:'2026-10-19T14:30:00+02:00',currency:'CAD',event:'Median CPI y/y',releaseState:'overdue',actual:'—',importance:'HIGH'},{date:'2026-10-19T14:30:00+02:00',currency:'CAD',event:'Trimmed CPI y/y',releaseState:'overdue',actual:'—',importance:'HIGH'}]};
 const out=applyVerifiedReleaseOverlay(input);
 const core=out.events.filter(x=>x.currency==='CAD'&&/^(Median|Trimmed) CPI/.test(x.event));
 assert.deepEqual(core.map(x=>x.actual),['1.9%','1.8%']);
 assert.equal(core.filter(x=>x.releaseState==='overdue').length,0);
 assert.ok(core.every(x=>x.verificationStatus==='verified-primary'));
});

test('Japan official unemployment SA six-month revised history is complete and sourced',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.JPY.filter(x=>x.event==='Unemployment rate · SA');
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[2.7,2.5,2.5,2.5,2.4,2.5]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-04-28','2026-05-29','2026-06-30','2026-07-31','2026-08-28','2026-10-02']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('stat.go.jp')&&x.sourceUpdatedAt==='2026-10-02T00:00:00Z'&&x.releaseTimeKnown===false&&x.stage==='official-revised-table'||x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('stat.go.jp')&&x.reference==='2026-08'));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
});

test('archived weekly rate odds and meeting expectations are never displayed as live',()=>{
 const h=fs.readFileSync('index.html','utf8');
 const start=h.indexOf('function safePolicyOdds('),end=h.indexOf('function weekly(){',start);
 assert.ok(start>0&&end>start);
 const c={RATE_STATE:{cards:[{ccy:'USD',live:false,stale:true}]}};
 vm.createContext(c);vm.runInContext(h.slice(start,end),c);
 assert.match(c.safePolicyOdds('USD'),/UNAVAILABLE/);
 assert.doesNotMatch(c.safePolicyOdds('USD'),/66%|39%|75%/);
 assert.match(c.safeNextPolicy('USD'),/Upcoming Calendar/);
 c.RATE_STATE={cards:[{ccy:'USD',live:true,stale:false}]};
 assert.match(c.safePolicyOdds('USD'),/Rates Probabilities tab/);
 assert.ok(!h.includes('${esc(r.pricing)}'));
 assert.ok(!h.includes('${esc(r.next)}'));
 assert.ok(!h.includes("['Next Expectation',r.next]"));
});

test('October 23 CAD retail and Michigan final releases resolve overdue without inventing consensus',()=>{
 const input={mode:'live',events:[
  {date:'2026-10-23T14:30:00+02:00',currency:'CAD',event:'Core Retail Sales m/m',actual:'—',forecast:'1.1%',releaseState:'overdue'},
  {date:'2026-10-23T14:30:00+02:00',currency:'CAD',event:'Retail Sales m/m',actual:'—',forecast:'1.3%',releaseState:'overdue'},
  {date:'2026-10-23T16:00:00+02:00',currency:'USD',event:'Revised UoM Consumer Sentiment',actual:'—',forecast:'46.3',releaseState:'overdue'},
  {date:'2026-10-23T16:00:00+02:00',currency:'USD',event:'Revised UoM Inflation Expectations',actual:'—',forecast:'4.7%',releaseState:'overdue'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const targets=out.events.filter(x=>(x.currency==='CAD'||x.currency==='USD')&&/Retail Sales m\/m|Revised UoM/.test(x.event));
 assert.deepEqual(targets.map(x=>x.actual),['1.1%','1.2%','48.0','4.7%']);
 assert.ok(targets.every(x=>x.releaseState==='released'&&x.sourceUrl));
 assert.deepEqual(targets.map(x=>x.verificationStatus),['verified-primary','verified-primary','verified-secondary','verified-secondary']);
 assert.ok(targets.slice(0,2).every(x=>x.sourceUrl==='https://www150.statcan.gc.ca/n1/daily-quotidien/261023/dq261023a-eng.htm'&&x.source.includes('Statistics Canada')));
 assert.deepEqual(targets.map(x=>x.forecast),['1.1%','1.3%','46.3','4.7%']);
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('weekly focus includes late October 23 verified-secondary catalysts and caveats',()=>{
 const h=fs.readFileSync('index.html','utf8');
 assert.ok(h.includes('US Michigan final (23 Oct, 16:00 CEST)'));
 assert.ok(h.includes('Canada August Retail Sales (23 Oct, 14:30 CEST)'));
 assert.ok(h.includes('not independently verified against the University of Michigan primary bulletin'));
 assert.ok(h.includes('NEW / PRIMARY VERIFIED — Canada August Retail Sales'));
 assert.ok(h.includes('Statistics Canada · Retail trade, August 2026'));
 assert.ok(h.includes('market forecast is provider-unverified'));
 assert.ok(!h.includes('primary bulletin not independently retrieved'));
});

test('G10 revised quarterly GDP Q1/Q2 history has two primary-source observations',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const expected={
  EUR:[['Real GDP q/q · SA',0.0,0.6]],
  CHF:[['Real GDP q/q · sport-event adjusted',0.5,1.5]],
  CAD:[['Real GDP q/q',0.1,0.8]],
  SEK:[['Real GDP q/q · SA',-0.1,1.6]],
  NOK:[['Mainland real GDP q/q · SA',0.1,0.3],['Total real GDP q/q · SA',0.4,0.7]],
  JPY:[['Real GDP q/q · SA',0.5,0.4],['Real GDP q/q annualized',1.9,1.4]],
  AUD:[['Real GDP q/q · SA',0.3,0.4]]
 };
 for(const [ccy,series] of Object.entries(expected))for(const [event,q1,q2] of series){
  const rows=d.currencies[ccy].filter(x=>x.event===event&&['2026-03','2026-06'].includes(x.reference)).sort((a,b)=>a.reference.localeCompare(b.reference));
  assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-06'],ccy+' '+event+' quarters');
  assert.deepEqual(rows.map(x=>x.actual),[q1,q2],ccy+' '+event+' values');
  assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl?.startsWith('https://')&&x.sourceUpdatedAt&&x.releaseDate&&x.releaseTimeKnown===false),ccy+' '+event+' provenance');
 }
});

test('BLS April–September payroll and earnings history is source-verified with revisions dated',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const specs=[
  ['Nonfarm Payrolls',[148,63,31,-10,133,29]],
  ['Average Hourly Earnings y/y',[3.6,3.4,3.5,3.2,3.1,3.0]]
 ];
 for(const [event,expected] of specs){
  const rows=d.currencies.USD.filter(x=>x.event===event).sort((a,b)=>a.reference.localeCompare(b.reference));
  assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
  assert.deepEqual(rows.map(x=>x.actual),expected);
  assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('bls.gov')&&x.sourceUpdatedAt&&x.releaseDate));
 }
 assert.equal(d.currencies.USD.find(x=>x.event==='Nonfarm Payrolls'&&x.reference==='2026-05').sourceUpdatedAt,'2026-08-07T12:30:00Z');
 assert.equal(d.currencies.USD.find(x=>x.event==='Nonfarm Payrolls'&&x.reference==='2026-06').sourceUpdatedAt,'2026-09-04T12:30:00Z');
});

test('NOK September LFS and six-month trend are source-verified, with August revision preserved',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.NOK.filter(x=>x.event==='Unemployment rate · trend').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[4.7,4.7,4.5,4.5,4.6,4.6]);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.releaseDate&&x.sourceUpdatedAt&&x.sourceUrl.includes('ssb.no')&&x.revisionNote));
 assert.equal(rows[4].sourceUpdatedAt,'2026-10-22T06:00:00Z');
 const calendar=applyVerifiedReleaseOverlay({mode:'live',events:[]});
 const sep=calendar.events.find(x=>x.currency==='NOK'&&x.event==='LFS unemployment trend · Sep');
 assert.equal(sep?.actual,'4.6%');
 assert.equal(sep?.releaseState,'released');
 assert.equal(sep?.verificationStatus,'verified-primary');
});

test('Sweden unemployment is six verified SCB smoothed SA months with explicit revision provenance',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.SEK.filter(x=>x.event==='Unemployment rate · SA smoothed');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[8.7,8.7,8.7,8.7,8.7,8.7]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-21','2026-06-15','2026-07-24','2026-08-21','2026-09-16','2026-10-16']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.stage==='official-revised-table'&&x.sourceUrl.includes('scb.se')&&x.sourceUpdatedAt==='2026-10-16T06:00:00Z'&&x.originalReleaseUrl));
 assert.ok(rows[0].revisionNote.includes('8.6%'));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
});

test('GBP unemployment ONS revised rolling-quarter history is six observations with provenance',()=>{
 const archive=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const series=archive.currencies.GBP.filter(e=>e.event==='Unemployment rate · SA');
 assert.equal(series.length,6);
 assert.deepEqual(series.map(e=>e.reference),['2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']);
 assert.deepEqual(series.map(e=>e.actual),[5.0,4.9,4.9,4.9,4.9,4.7]);
 assert.ok(series.every(e=>e.verificationStatus==='verified-primary'&&e.sourceUrl?.includes('ons.gov.uk')&&e.releaseDate&&e.sourceUpdatedAt&&e.referencePeriod&&e.revisionVintage==='2026-10-20'));
 assert.equal(archive.currencies.GBP.filter(e=>e.event==='LFS unemployment · 3M SA').length,0);
});

test('NZD BusinessNZ Manufacturing PMI has six primary-verified months and documented revision vintages',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.NZD.filter(x=>x.event==='BusinessNZ Manufacturing PMI');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[50.5,51.4,60.1,54.4,53.3,56.5]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-15','2026-06-12','2026-07-09','2026-08-14','2026-09-11','2026-10-16']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.frequency==='monthly'&&x.releaseTimeKnown===false&&x.sourceUrl.startsWith('https://businessnz.org.nz/')&&x.sourceUpdatedAt&&x.verifiedAt));
 assert.equal(rows[0].sourceUpdatedAt,'2026-09-11T00:00:00Z');
 assert.ok(rows.slice(1).every(x=>x.sourceUpdatedAt==='2026-10-16T00:00:00Z'));
 assert.ok(rows.every(x=>x.sourceUrl&&x.revisionNote));
});


test('ONS September GBP retail sales resolves overdue calendar event as official release',()=>{
 const base={date:'2026-10-23T08:00:00+02:00',currency:'GBP',event:'Retail Sales m/m',actual:'—',releaseState:'overdue',importance:'HIGH'};
 const d=applyVerifiedReleaseOverlay({mode:'live',events:[base]});
 const row=d.events.find(x=>x.currency==='GBP'&&x.event.startsWith('Retail Sales m/m'));
 assert.equal(row?.releaseState,'released');
 assert.equal(row?.actual,'-0.4%');
 assert.equal(row?.previous,'+0.7%');
 assert.equal(row?.verificationStatus,'verified-primary');
 assert.ok(row?.sourceUrl.includes('ons.gov.uk'));
 assert.equal(unresolvedNonScheduleOverdue(d),0);
});

test('ONS revised GBP retail volume index has six consistent verified April-September observations',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.GBP.filter(x=>x.event==='Retail Sales Volume Index · SA incl fuel');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[101.5,102.9,103.4,103.0,103.7,103.3]);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.frequency==='monthly'&&x.unit.startsWith('index')&&x.sourceUrl.includes('ons.gov.uk')&&x.sourceUpdatedAt==='2026-10-23T06:00:00Z'&&x.releaseDate==='2026-10-23T06:00:00Z'&&x.revisionNote.includes('NOT monthly percent change')));
 assert.ok(d.audit.scope.includes('GBP April–September 2026 retail volume SA index J5EK'));
 assert.equal(rows.length,6);
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
});

test('Oct 23 flash PMI secondary actuals clear overdue statuses without invented consensus',()=>{
 const cases=[['USD','Flash Manufacturing PMI','56.0'],['USD','Flash Services PMI','57.9'],['EUR','Flash Manufacturing PMI','52.4'],['EUR','Flash Services PMI','51.7'],['GBP','Flash Manufacturing PMI','52.8'],['GBP','Flash Services PMI','53.1'],['EUR','German Flash Manufacturing PMI','54.2'],['EUR','German Flash Services PMI','51.7']];
 const events=cases.map(([currency,event])=>({date:'2026-10-23T10:00:00+02:00',currency,event,actual:'—',forecast:'—',releaseState:'overdue',importance:'HIGH'}));
 const result=applyVerifiedReleaseOverlay({mode:'live',events});
 for(const [currency,event,actual] of cases){const row=result.events.find(x=>x.currency===currency&&x.event.startsWith(event+' · Oct'));
  assert.ok(row,currency+' '+event+' missing');assert.equal(row.actual,actual);assert.equal(row.releaseState,'released');assert.equal(row.verificationStatus,'verified-secondary');assert.equal(row.forecastVerificationStatus,'provider-unverified');}
 assert.equal(unresolvedNonScheduleOverdue(result),0);
});


test('USD Census retail sales Apr-Sep 2026 primary backfill preserves original and revised vintages',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.USD.filter(x=>x.event==='Retail Sales m/m'&&x.verificationStatus==='verified-primary');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[0.5,0.9,0.2,-0.4,1.3,0.8]);
 assert.ok(rows.every(x=>x.releaseDate&&x.sourceUpdatedAt&&x.sourceUrl.includes('census.gov')&&x.revisionNote.includes('NOT interpret as a fully harmonized revised series')));
 assert.ok(rows.slice(0,3).every(x=>x.stage==='first-release-vintage'));
 assert.ok(rows.slice(3,5).every(x=>x.stage==='revised-oct15-2026'));
 assert.equal(rows[5].stage,'advance-oct15-2026');
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.ok(html.includes('MIXED VINTAGES — not one harmonized revision series.'));
});


test('USD JOLTS March-Aug 2026 official revised mixed-vintage backfill has six traceable months',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.USD.filter(x=>x.event==='JOLTS Job Openings').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[6.887,7.585,7.537,7.182,7.335,7.079]);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('bls.gov')&&x.releaseDate&&x.sourceUpdatedAt&&x.revisionNote.includes('MIXED REVISION VINTAGES')));
 assert.ok(rows.slice(0,2).every(x=>x.sourceUpdatedAt==='2026-08-04T00:00:00Z'));
 assert.ok(rows.slice(2).every(x=>x.sourceUpdatedAt==='2026-09-29T00:00:00Z'));
 assert.equal(rows[5].stage,'official-preliminary-sep29-2026');
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('Swedbank Silf September 2026 revised manufacturing PMI table verifies six monthly SEK growth observations',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.SEK.filter(x=>x.event==='Swedbank Manufacturing PMI');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[56.9,57.2,58.1,56.0,56.3,58.1]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-04T06:30:00Z','2026-06-01T06:30:00Z','2026-07-01T06:30:00Z','2026-08-03T06:30:00Z','2026-09-01T06:30:00Z','2026-10-01T06:30:00Z']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.frequency==='monthly'&&x.stage==='official-revised-table'&&x.revisionVintage==='2026-10-01'&&x.sourceUrl==='https://mb.cision.com/Main/67/4402963/4296154.pdf'&&x.sourceUpdatedAt==='2026-10-01T06:30:00Z'&&x.releaseTimeKnown===true));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl&&x.sourceUpdatedAt&&x.releaseDate&&x.referenceDate).length);
});

test('MHLW March-August 2026 Japan nominal and real wages use six official revised-history observations',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const cases=[
  ['Average Cash Earnings y/y',[3.1,3.6,3.3,4.0,4.3,3.8]],
  ['Real Wage Growth y/y',[1.4,2.0,1.6,2.2,2.0,1.5]]
 ];
 const months=['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08'];
 const dates=['2026-05-08','2026-06-05','2026-07-07','2026-08-05','2026-09-08','2026-10-07'];
 for(const [name,values] of cases){
  const rows=d.currencies.JPY.filter(x=>x.event===name);
  assert.deepEqual(rows.map(x=>x.reference),months,name+' six monthly periods');
  assert.deepEqual(rows.map(x=>x.actual),values,name+' official values');
  assert.deepEqual(rows.map(x=>x.releaseDate),dates,name+' original first-release dates');
  assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('mhlw.go.jp')&&x.sourceUpdatedAt==='2026-10-07T00:00:00Z'&&x.releaseTimeKnown===false&&x.revisionVintage==='2026-10-07'),name+' primary provenance');
  assert.ok(rows.slice(0,5).every(x=>x.stage==='official-revised-history-oct07-2026'&&x.revisionNote.includes('not the original preliminary')));
 }
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl&&x.sourceUpdatedAt&&x.releaseDate&&x.referenceDate).length);
});

test('JPY G10 labor UI keeps nominal and real wages as distinct six-month series',()=>{
 const archive=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const html=fs.readFileSync('index.html','utf8');
 const src=html.slice(html.indexOf('function econIndicatorList('),html.indexOf('function activeIndicator('));
 const c={
  econCfg:()=>({data:{JPY:{},EUR:{}},unit:'%',decimals:1,source:'MHLW'}),
  ECON_INDICATOR_DEFS:{labor:[{id:'wages',label:'Wage Growth',re:/hourly earnings|wage/i,unit:'%',decimals:1}]},
  ECON_STATIC_HISTORY:{},
  dynamicIndicatorSeries:()=>[],
  verifiedArchiveSeries:(ccy,cat,def)=>(archive.currencies[ccy]||[]).filter(x=>x.category===cat&&def.re.test(x.event)&&x.verificationStatus==='verified-primary').map(x=>[x.reference,x.actual,x.releaseDate,'verified-primary']),
  mergeEconHistory:(a,b)=>b,
  coverageInfo:p=>({count:p.length,latest:p.at(-1)?.[2]||null}),
  freshnessInfo:()=>({label:'FRESH'})
 };
 vm.createContext(c);vm.runInContext(src,c);
 const jp=c.econIndicatorList('JPY','labor');
 assert.deepEqual(jp.map(x=>x.id).join(','),'wages,realwages');
 assert.deepEqual(jp[0].p.map(x=>x[1]).join(','),'3.1,3.6,3.3,4,4.3,3.8');
 assert.deepEqual(jp[1].p.map(x=>x[1]).join(','),'1.4,2,1.6,2.2,2,1.5');
 assert.equal(c.econIndicatorList('EUR','labor').length,1,'no extra real-wage indicator for other G10');
});

test('BEA October 6 revised-vintage USD goods-and-services trade balance has six verified monthly readings',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.USD.filter(x=>x.category==='growth'&&x.event==='Trade Balance').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[-53.657,-52.883,-75.752,-71.182,-92.826,-105.572]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-05T12:30:00Z','2026-06-09T12:30:00Z','2026-07-07T12:30:00Z','2026-08-04T12:30:00Z','2026-09-03T12:30:00Z','2026-10-06T12:30:00Z']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUpdatedAt==='2026-10-06T12:30:00Z'&&x.revisionVintage==='2026-10-06'&&x.sourceUrl.includes('bea.gov/sites/default/files/2026-10/trad0826.pdf')&&x.revisionNote.includes('GOODS AND SERVICES')));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl&&x.sourceUpdatedAt&&x.releaseDate&&x.referenceDate).length);
});


test('SSB October 9 official NOK total PPI table verifies six monthly y/y readings without implying consumer CPI',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.NOK.filter(x=>x.category==='inflation'&&x.event==='Producer Price Index (PPI) total y/y').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[22.7,24.0,14.9,23.4,30.1,48.8]);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.frequency==='monthly'&&x.stage==='official-revised-table'&&x.sourceUrl.includes('ssb.no/en/priser-og-prisindekser/')&&x.sourceUpdatedAt==='2026-10-09T08:00:00Z'&&x.releaseDate==='2026-10-09T08:00:00Z'&&x.revisionNote.includes('NOT the original first release')&&x.revisionNote.includes('not consumer CPI')));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('USD wage m/m backfill stays separate from annual wage growth in Economic Trends',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const mom=d.currencies.USD.filter(x=>x.event==='Average Hourly Earnings m/m').sort((a,b)=>a.reference.localeCompare(b.reference));
 const yoy=d.currencies.USD.filter(x=>x.event==='Average Hourly Earnings y/y').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(mom.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(mom.map(x=>x.actual),[0.2,0.3,0.3,0.1,0.3,0.1]);
 assert.deepEqual(yoy.map(x=>x.actual),[3.6,3.4,3.5,3.2,3.1,3.0]);
 assert.ok(mom.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl?.includes('bls.gov')&&x.releaseDate&&x.sourceUpdatedAt));
 assert.ok(mom.slice(0,3).every(x=>x.sourceUpdatedAt==='2026-07-14T12:30:00Z'));
 assert.ok(mom.slice(3,5).every(x=>x.sourceUpdatedAt==='2026-10-14T12:30:00Z'));
 const src=html.slice(html.indexOf('const ECON_INDICATOR_DEFS='),html.indexOf('function mergeEconHistory'));
 const c={};vm.createContext(c);vm.runInContext(src+'\nthis.defs=ECON_INDICATOR_DEFS;',c);
 const wages=c.defs.labor.find(x=>x.id==='wages');
 assert.equal(wages.re.test('Average Hourly Earnings y/y'),true);
 assert.equal(wages.re.test('Average Hourly Earnings m/m'),false,'y/y selector must not include m/m');
 assert.ok(html.includes("id:'wagesmom',label:'Average Hourly Earnings m/m'"),'separate USD m/m selector');
 assert.ok(html.includes("if(ccy==='USD'&&cat==='labor')defs="));
 assert.ok(html.includes("if(ind?.id==='wagesmom')return"),'separate monthly-wage trend semantics');
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('JPY household consumption six-month official revised history is source-linked and independently selectable',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.JPY.filter(x=>x.event==='Household Consumption Expenditure y/y · real').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[-2.9,-0.5,-0.4,-3.3,-3.6,-3.1]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-12','2026-06-05','2026-07-07','2026-08-07','2026-09-04','2026-10-09']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl==='https://www.stat.go.jp/data/kakei/sokuhou/tsuki/pdf/fies_mr.pdf'&&x.sourceUpdatedAt==='2026-10-09T00:00:00Z'&&x.frequency==='monthly'&&x.forecast===null));
 assert.ok(rows.every(x=>x.revisionNote.includes('retrospective CPI 2025-base revision')));
 assert.ok(html.includes("if(ccy==='JPY'&&cat==='growth')defs="));
 assert.ok(html.includes("id:'household',label:'Household Consumption y/y · real'"));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('EUR German industrial production six-month official mixed-vintage backfill is independently verified',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.EUR.filter(x=>x.event==='German Industrial Production m/m').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[-0.1,0.2,0.7,0,-1.2,2]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-08','2026-06-09','2026-07-07','2026-08-07','2026-09-07','2026-10-07']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.source==='Destatis · Production in industry, real, seasonally/calendar adjusted, month-on-month'&&x.sourceUrl.startsWith('https://www.destatis.de/EN/Press/2026/')&&x.forecast===null));
 assert.ok(rows.slice(0,5).every(x=>x.stage==='revised-vintage'&&x.revisionDate&&x.provenanceNote.includes('MIXED REVISION VINTAGES')));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,d.audit.verified);
});

test('EUR French Customs revised goods trade balance is six-month verified and dated',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.EUR.filter(x=>x.event==='French Trade Balance').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[-6.5,-5.7,-7.6,-5.8,-6.6,-6.1]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-07','2026-06-05','2026-07-07','2026-08-07','2026-09-08','2026-10-07']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl==='https://lekiosque.finances.gouv.fr/'&&x.sourceUpdatedAt&&x.forecast===null));
 assert.ok(rows.slice(0,5).every(x=>x.stage==='revised-vintage'&&x.revisionDate==='2026-10-07'&&x.provenanceNote.includes('revised')));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,d.audit.verified);
});

test('CHF procure.ch UBS September revised PMI history has six primary-verified monthly observations',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.CHF.filter(x=>x.category==='growth'&&x.event==='procure.ch / UBS PMI').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[54.5,57.3,54.3,53.2,57.1,55.3]);
 assert.deepEqual(rows.map(x=>x.releaseDate),['2026-05-04','2026-06-01','2026-07-01','2026-08-03','2026-09-01','2026-10-01T07:30:00Z']);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.frequency==='monthly'&&x.stage==='official-revised-table'&&x.sourceUpdatedAt==='2026-10-01T07:30:00Z'&&x.revisionVintage==='2026-10-01'&&x.sourceUrl.includes('beitrag_dokument_download.aspx')&&x.revisionNote.includes('licensing')&&x.forecast===null));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 assert.equal(d.audit.provenanceComplete,d.audit.verified);
});

test('NOK official manufacturing production has six source-verified monthly observations, no legacy PMI proxy',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.NOK.filter(x=>x.event==='Manufacturing Production m/m · SA');
 assert.equal(rows.length,6);
 assert.deepEqual(rows.map(x=>x.reference),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);
 assert.deepEqual(rows.map(x=>x.actual),[2.0,-0.9,0.8,-1.0,0.7,-0.4]);
 for(const x of rows){
  assert.equal(x.verificationStatus,'verified-primary');
  assert.equal(x.frequency,'monthly');
  assert.match(x.sourceUrl,/^https:\/\/www\.ssb\.no\//);
  assert.ok(Date.parse(x.releaseDate)<=Date.now());
  assert.ok(Date.parse(x.sourceUpdatedAt)<=Date.now());
  assert.ok(x.provenanceNote);
 }
 assert.equal(d.currencies.NOK.filter(x=>x.event==='Manufacturing output y/y · proxy').length,0);
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('NOK LFS six verified trend observations are not relabeled as SA',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.NOK.filter(x=>x.event==='Unemployment rate · trend');
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[4.7,4.7,4.5,4.5,4.6,4.6]);
 assert.ok(rows.every(x=>x.verificationStatus==='verified-primary'&&x.sourceUrl.includes('ssb.no')&&x.releaseDate&&x.sourceUpdatedAt));
 assert.equal(d.currencies.NOK.filter(x=>x.event==='Unemployment rate · SA').length,0,'unverified SA legacy readings must be retired');
 assert.ok(html.includes("NOK:{metric:'Unemployment rate · trend (LFS 15–74)'"));
 assert.ok(html.includes("ccy==='NOK'?/^Unemployment rate · trend$/i.test(ev)"));
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
});


test('Canada S&P manufacturing PMI has six dated observations with explicit primary versus secondary provenance',()=>{
 const d=JSON.parse(fs.readFileSync('assets/economic-archive.json','utf8'));
 const rows=d.currencies.CAD.filter(x=>x.event==='S&P Manufacturing PMI').sort((a,b)=>a.reference.localeCompare(b.reference));
 assert.deepEqual(rows.map(x=>x.reference),['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.deepEqual(rows.map(x=>x.actual),[53.3,52.9,53.0,53.5,53.0,51.5]);
 assert.deepEqual(rows.map(x=>x.verificationStatus),['verified-primary','verified-primary','verified-secondary','verified-secondary','verified-secondary','verified-secondary']);
 assert.ok(rows.every(x=>x.releaseDate&&x.sourceUpdatedAt&&x.sourceUrl&&x.verifiedAt&&x.forecast===null));
 assert.ok(rows.slice(0,2).every(x=>new URL(x.sourceUrl).hostname==='www.pmi.spglobal.com'&&x.releaseTimeKnown));
 assert.ok(rows.slice(2).every(x=>x.releaseTimeKnown===false&&x.sourceTimestampPrecision==='date'));
 assert.equal(d.audit.verified,Object.values(d.currencies).flat().filter(x=>x.verificationStatus==='verified-primary').length);
 assert.equal(d.audit.total,Object.values(d.currencies).flat().length);
 // Secondary Reuters checks are traceable, but primary-only coverage must stay incomplete.
 assert.equal(rows.filter(x=>x.verificationStatus==='verified-primary').length,2);
});


test('qualitative Fed and ECB minutes are published, not overdue or numeric surprises',()=>{
 const input={mode:'schedule-fallback',events:[
  {date:'2026-10-07T20:00:00+02:00',currency:'USD',event:'FOMC Meeting Minutes',actual:'—',releaseState:'overdue',forecast:'—'},
  {date:'2026-10-08T13:30:00+02:00',currency:'EUR',event:'ECB Monetary Policy Meeting Accounts',actual:'—',releaseState:'overdue',forecast:'—'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const publications=out.events.filter(x=>/FOMC Meeting Minutes|ECB Monetary Policy Accounts/.test(x.event));
 assert.equal(publications.length,2);
 assert.equal(publications.filter(x=>x.releaseState==='overdue').length,0);
 for(const row of publications){
  assert.equal(row.releaseState,'released');
  assert.equal(row.actual,'Published');
  assert.equal(row.label,'Official publication');
  assert.equal(row.verificationStatus,'verified-primary');
  assert.equal(row.forecastVerificationStatus,'provider-unverified');
  assert.equal(row.lastUpdate.slice(0,10),row.date.slice(0,10));
  assert.ok(row.sourceUrl.startsWith('https://'));
 }
 assert.equal(publications.find(x=>x.currency==='EUR').releaseTimeVerified,false);
 assert.equal(publications.find(x=>x.currency==='USD').releaseTimeVerified,true);
});


test('sector ETF scanner snapshots never claim live quotes without exchange timestamps',()=>{
 const source=fs.readFileSync('api/sectors.js','utf8');
 assert.match(source,/mode:'snapshot'/);
 assert.match(source,/quoteTimestamp:null/);
 assert.match(source,/freshnessStatus:'UNVERIFIED_QUOTE_TIME'/);
 assert.ok(!source.includes("mode:'live'"));
 assert.ok(html.includes('Sector Rotation · Last Available Snapshot'));
 assert.ok(html.includes('Quote timestamps are unverified; values may be stale'));
});

test('official Oct 5–6 releases resolve overdue rows without inventing verified forecasts',()=>{
 const input={mode:'live',events:[
  {date:'2026-10-05T06:00:00+02:00',currency:'JPY',event:'Consumer Confidence',forecast:'35.3',previous:'35.5',actual:'—',importance:'HIGH',releaseState:'overdue'},
  {date:'2026-10-06T10:00:00+02:00',currency:'CHF',event:'Unemployment Rate',forecast:'3.1%',previous:'3.1%',actual:'—',importance:'MED',releaseState:'overdue'},
  {date:'2026-10-06T14:30:00+02:00',currency:'USD',event:'Trade Balance',forecast:'-89.8B',previous:'-88.6B',actual:'—',importance:'MED',releaseState:'overdue'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const expected={JPY:'35.4',CHF:'3.1%',USD:'-$105.6B'};
 for(const e of out.events.filter(x=>(x.currency==='JPY'&&x.date.startsWith('2026-10-05'))||(x.currency==='CHF'&&x.date.startsWith('2026-10-06'))||(x.currency==='USD'&&x.date.startsWith('2026-10-06')))){
  assert.equal(e.releaseState,'released');
  assert.equal(e.verificationStatus,'verified-primary');
  assert.equal(e.actual,expected[e.currency]);
  assert.equal(e.forecastVerificationStatus,'provider-unverified');
  assert.ok(e.sourceUrl.startsWith('https://'));
 }
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('official Oct 6 and Oct 8 France/Japan releases resolve overdue with primary provenance',()=>{
 const input={mode:'live',events:[
  {date:'2026-10-06T08:45:00+02:00',currency:'EUR',event:'France Industrial Output m/m',forecast:'0.2%',previous:'-0.6%',actual:'—',releaseState:'overdue'},
  {date:'2026-10-08T01:50:00+02:00',currency:'JPY',event:'Current Account',forecast:'—',previous:'—',actual:'—',releaseState:'overdue'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const fr=out.events.find(x=>x.currency==='EUR'&&x.event.startsWith('France Industrial Output m/m'));
 const jp=out.events.find(x=>x.currency==='JPY'&&x.event.startsWith('Current Account · Aug'));
 assert.ok(fr&&jp);
 assert.equal(fr.actual,'-0.3%');
 assert.equal(fr.previous,'-0.6%');
 assert.equal(fr.forecast,'0.2%');
 assert.match(fr.event,/total industry/);
 assert.equal(jp.actual,'¥4.062T');
 assert.equal(jp.previous,'¥2.989T');
 assert.equal(jp.forecast,'—'); // Provider forecast belonged to a seasonally adjusted series.
 assert.match(jp.event,/unadjusted/);
 for(const e of [fr,jp]){
  assert.equal(e.releaseState,'released');
  assert.equal(e.verificationStatus,'verified-primary');
  assert.equal(e.forecastVerificationStatus,'provider-unverified');
  assert.ok(e.sourceUrl.startsWith('https://'));
  assert.equal(e.lastUpdate.slice(0,10),e.date.slice(0,10));
 }
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('Census August wholesale inventories final is released, distinct from the advance estimate',()=>{
 const input={mode:'schedule-fallback',events:[
  {date:'2026-10-08T16:00:00+02:00',currency:'USD',event:'Wholesale Inventories m/m',actual:'—',previous:'0.7%',forecast:'0.7%',releaseState:'overdue'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const row=out.events.find(x=>x.currency==='USD'&&x.event.includes('Wholesale Inventories'));
 assert.equal(row.actual,'+0.5%');
 assert.equal(row.previous,'+1.4%');
 assert.equal(row.forecast,'—');
 assert.equal(row.releaseState,'released');
 assert.equal(row.verificationStatus,'verified-primary');
 assert.equal(row.sourceUrl,'https://www.census.gov/wholesale/current/index.html');
 assert.equal(row.lastUpdate,'2026-10-08');
 assert.equal(row.releaseTimeVerified,false);
 assert.equal(row.forecastVerificationStatus,'provider-unverified');
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('NZIER Q3 business confidence is primary-verified, SA-consistent, and on the actual October 6 release date',()=>{
 const input={mode:'schedule-fallback',events:[{date:'2026-10-05T21:00:00+02:00',currency:'NZD',event:'NZIER Business Confidence',actual:'—',previous:'8%',releaseState:'overdue'}]};
 const out=applyVerifiedReleaseOverlay(input);
 const row=out.events.find(x=>x.currency==='NZD'&&x.event.startsWith('NZIER Business Confidence'));
 assert.equal(row.actual,'+40%');assert.equal(row.previous,'+14%');assert.equal(row.forecast,'—');
 assert.equal(row.date,'2026-10-06T01:00:00+02:00');assert.equal(row.releaseState,'released');
 assert.equal(row.verificationStatus,'verified-primary');assert.match(row.sourceUrl,/nzier.org.nz/);
 assert.equal(out.events.filter(x=>x.currency==='NZD'&&/NZIER Business Confidence/i.test(x.event)).length,1);
});
test('RICS September house price balance is released with primary source and no invented consensus',()=>{
 const input={mode:'live',events:[{date:'2026-10-08T01:01:00+02:00',currency:'GBP',event:'RICS Housing Price Balance',actual:'—',previous:'-28%',releaseState:'overdue'}]};
 const out=applyVerifiedReleaseOverlay(input);
 const row=out.events.find(x=>x.currency==='GBP'&&x.event.startsWith('RICS Housing Price Balance'));
 assert.equal(row.actual,'-32%');assert.equal(row.previous,'-28%');assert.equal(row.forecast,'—');
 assert.equal(row.releaseState,'released');assert.equal(row.verificationStatus,'verified-primary');
 assert.match(row.sourceUrl,/rics.org/);assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('official Japan Oct 6 Ueda speech and Oct 8 Economy Watchers are released with original-source provenance',()=>{
 const input={mode:'schedule-fallback',events:[
  {date:'2026-10-06T08:35:00+02:00',currency:'JPY',event:'BOJ Gov Ueda Speaks',actual:'—',previous:'—',forecast:'Policy / normalization outlook',releaseState:'overdue',importance:'HIGH'},
  {date:'2026-10-08T07:00:00+02:00',currency:'JPY',event:'Eco Watchers Survey: Current',actual:'—',previous:'46.4',forecast:'46.8',releaseState:'overdue',importance:'MED'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 const speech=out.events.find(x=>x.event.includes('National Securities Convention'));
 const survey=out.events.find(x=>x.event.includes('Economy Watchers Survey'));
 assert.equal(unresolvedNonScheduleOverdue(out),0);
 assert.equal(out.events.filter(x=>/National Securities Convention|Economy Watchers Survey/.test(x.event)).length,2);
 assert.equal(speech.actual,'Published');
 assert.equal(speech.label,'Official publication');
 assert.equal(speech.forecast,'—');
 assert.equal(survey.actual,'47.0');
 assert.equal(survey.previous,'46.4');
 assert.equal(survey.forecast,'—');
 assert.match(survey.event,/seasonally adjusted/);
 for(const row of [speech,survey]){
  assert.equal(row.releaseState,'released');
  assert.equal(row.verificationStatus,'verified-primary');
  assert.equal(row.forecastVerificationStatus,'provider-unverified');
  assert.equal(row.releaseTimeVerified,false);
  assert.ok(row.sourceUrl.startsWith('https://'));
  assert.equal(row.lastUpdate.slice(0,10),row.date.slice(0,10));
 }
});

test('Weekly Focus and Overview never claim a fixed October freshness date',()=>{
 assert.ok(html.includes('Currency Focus · Latest verified catalysts + upcoming policy week'));
 assert.ok(html.includes('Source verification and publication timestamps are shown per release'));
 assert.ok(!html.includes('Official releases below were checked on 7 October 2026'));
 assert.ok(!html.includes('Currency Focus · 23 October catalysts + next policy week'));
});

test('Oct 7 CHF foreign currency reserves are released with secondary-only provenance',()=>{
 const input={mode:'schedule-fallback',events:[{date:'2026-10-07T09:00:00+02:00',currency:'CHF',event:'Foreign Currency Reserves',actual:'—',previous:'770B',forecast:'—',importance:'MED',releaseState:'overdue'}]};
 const out=applyVerifiedReleaseOverlay(input);
 const row=out.events.find(x=>x.currency==='CHF'&&x.event.startsWith('Foreign Currency Reserves'));
 assert.equal(row.actual,'CHF 770.476B');
 assert.equal(row.previous,'CHF 770.074B');
 assert.equal(row.forecast,'—');
 assert.equal(row.releaseState,'released');
 assert.equal(row.verificationStatus,'verified-secondary');
 assert.equal(row.releaseTimeVerified,false);
 assert.match(row.sourceUrl,/metatrader.com/);
 assert.equal(out.events.filter(x=>x.currency==='CHF'&&/Foreign Currency Reserves/.test(x.event)).length,1);
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('ISM September 2026 Services PMI, prices and employment resolve overdue with primary report',()=>{
 const input={mode:'live',events:[
  {date:'2026-10-05T16:00:00+02:00',currency:'USD',event:'ISM Services PMI',actual:'—',previous:'55.4',forecast:'55.3',importance:'HIGH',releaseState:'overdue'},
  {date:'2026-10-05T16:00:00+02:00',currency:'USD',event:'ISM Services Prices Paid',actual:'—',previous:'72.6',forecast:'—',importance:'HIGH',releaseState:'overdue'},
  {date:'2026-10-05T16:00:00+02:00',currency:'USD',event:'ISM Services Employment Index',actual:'—',previous:'47.8',forecast:'—',importance:'MED',releaseState:'overdue'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 assert.equal(unresolvedNonScheduleOverdue(out),0);
 const ismRows=out.events.filter(x=>x.currency==='USD'&&x.date.startsWith('2026-10-05')&&/^ISM Services (?:PMI|Prices Paid|Employment Index) · Sep$/.test(x.event));
 assert.equal(ismRows.length,3);
 const expected={'ISM Services PMI · Sep':['54.9','55.4'],'ISM Services Prices Paid · Sep':['74.0','72.6'],'ISM Services Employment Index · Sep':['50.1','47.8']};
 for(const row of ismRows){
  assert.deepEqual([row.actual,row.previous],expected[row.event]);
  assert.equal(row.forecast,'—');
  assert.equal(row.releaseState,'released');
  assert.equal(row.verificationStatus,'verified-primary');
  assert.equal(row.lastUpdate,'2026-10-05');
  assert.equal(row.releaseTimeVerified,true);
  assert.equal(row.forecastVerificationStatus,'provider-unverified');
  assert.match(row.sourceUrl,/ismworld\.org/);
 }
});


test('Sunday Gulf closing prices confirm regional risk-off without inventing oil outages',()=>{
 assert.ok(html.includes('NEW / CONFIRMED GULF SUNDAY CLOSE · 25 ОКТ 2026'));
 assert.ok(html.includes('Saudi TASI затвори −2.7%'));
 assert.ok(html.includes('Egypt EGX30 −3.6%'));
 assert.ok(html.includes('gulf-bourses-slip-houthi-saudi-clashes-rattle-investors-2026-10-25'));
 assert.ok(html.includes('го потврдува regional risk-off'));
 assert.ok(html.includes('не докажува global risk-off'));
 assert.ok(html.includes('не е потврден нов physical outage'));
 assert.ok(html.includes('major US/EU cash markets and Brent/WTI futures do not yet provide a fresh post-headline session signal'));
});


test('Weekly Focus explicitly includes BoC, all five rate decisions and the next high-impact data',()=>{
 assert.ok(html.includes('Official Cash Rate|RBNZ Press Conference'));
 assert.ok(html.includes('Overnight Rate|BOC Press Conference'));
 assert.ok(html.includes('Federal Funds Rate|FOMC'));
 assert.ok(html.includes('Main Refinancing Rate|ECB Press Conference'));
 assert.ok(html.includes('BOJ Policy Rate|BOJ'));
 assert.ok(html.includes('Advance GDP q\\/q'));
 assert.ok(html.includes('Employment Cost Index'));
 assert.ok(html.includes('.slice(0,16)'));
});


test('Weekly Focus policy matcher includes official fallback decision names without inventing events',()=>{
 const start=html.indexOf('function weeklyPolicyEventName(');
 const end=html.indexOf('function weekly(){',start);
 assert.ok(start>0&&end>start,'policy matcher must be a standalone testable helper');
 const c={};vm.createContext(c);vm.runInContext(html.slice(start,end),c);
 const accepted=[
  'CPI y/y · Sep (ABS Australia)',
  'RBNZ Official Cash Rate Decision',
  'Bank of Canada Rate Decision & Monetary Policy Report',
  'FOMC Rate Decision',
  'FOMC Chair Press Conference',
  'Advance GDP q/q · Q3 (annualized, BEA)',
  'Core PCE Price Index m/m · Sep (BEA)',
  'ECB Rate Decision',
  'ECB Press Conference',
  'BOJ Governor Ueda Press Conference (rate decision & Outlook Report time TBA)',
  'Employment Cost Index · Q3',
  'German Ifo Business Climate · Oct',
  'Durable Goods Orders m/m · Sep',
  'New Home Sales · Sep',
  'Advance Goods Trade Balance · Sep',
  'UK Budget Statement & OBR Forecast · 2026'
 ];
 for(const event of accepted)assert.equal(c.weeklyPolicyEventName(event),true,event);
 for(const event of ['Consumer Confidence','EIA Crude Oil Inventories','Retail Sales m/m'])assert.equal(c.weeklyPolicyEventName(event),false,event);
 assert.ok(html.includes('&&weeklyPolicyEventName(x[3])'),'Weekly Focus must use this matcher, not an older inline regex');
});

test('ABS CPI and BEA GDP/PCE official schedule is present even when ForexFactory is in fallback',()=>{
 const out=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]});
 const expected=[
  ['AUD','CPI y/y · Sep','2026-10-28T01:30:00+01:00','abs.gov.au'],
  ['AUD','International Trade Price Indexes · Sep quarter','2026-10-29T01:30:00+01:00','abs.gov.au'],
  ['AUD','Producer Price Indexes · Sep quarter','2026-10-30T01:30:00+01:00','abs.gov.au'],
  ['USD','Advance GDP q/q · Q3','2026-10-29T13:30:00+01:00','bea.gov'],
  ['USD','Core PCE Price Index m/m · Sep','2026-10-29T13:30:00+01:00','bea.gov']
 ];
 for(const [currency,prefix,date,domain] of expected){
  const rows=out.events.filter(x=>x.currency===currency&&x.event.startsWith(prefix));
  assert.equal(rows.length,1,currency+' '+prefix+' missing or duplicated');
  assert.equal(rows[0].date,date);
  if(currency==='AUD'&&prefix==='CPI y/y · Sep'){
   assert.equal(rows[0].verificationStatus,'verified-primary');
   assert.equal(rows[0].releaseState,'released');
   assert.equal(rows[0].actual,'4.3%');
   assert.equal(rows[0].previous,'4.0%');
   assert.ok(rows[0].sourceUrl.includes('abs.gov.au'));
  }else{
   assert.equal(rows[0].verificationStatus,'official-schedule');
   assert.equal(rows[0].actual,'—');
   assert.ok(rows[0].sourceUrl.includes(domain));
  }
  assert.equal(rows[0].forecast,'—');
 }
 const existing={date:'2026-10-28T01:30:00+01:00',currency:'AUD',event:'CPI y/y',actual:'—',releaseState:'scheduled'};
 const merged=applyVerifiedReleaseOverlay({mode:'live',events:[
  existing,
  {date:'2026-10-29T01:30:00+01:00',currency:'AUD',event:'Import Price Index',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-30T01:30:00+01:00',currency:'AUD',event:'PPI q/q',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-29T13:30:00+01:00',currency:'USD',event:'Core PCE Price Index m/m',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-30T06:30:00+01:00',currency:'JPY',event:'BOJ Press Conference',actual:'—',releaseState:'scheduled'}
 ]});
 assert.equal(merged.events.filter(x=>x.currency==='AUD'&&x.date.startsWith('2026-10-28')&&x.event.includes('CPI y/y')).length,1);
 assert.equal(merged.events.filter(x=>x.currency==='AUD'&&x.date.startsWith('2026-10-29')&&/Trade Price Indexes|Import Price Index/.test(x.event)).length,1);
 assert.equal(merged.events.filter(x=>x.currency==='AUD'&&x.date.startsWith('2026-10-30')&&/Producer Price Indexes|PPI q\/q/.test(x.event)).length,1);
 assert.equal(merged.events.filter(x=>x.currency==='USD'&&x.date.startsWith('2026-10-29')&&x.event.includes('Core PCE')).length,1);
 const boj=merged.events.filter(x=>x.currency==='JPY'&&x.date.startsWith('2026-10-30')&&x.event.includes('Press Conference'));
 assert.equal(boj.length,1);
 assert.equal(boj[0].date,'2026-10-30T07:30:00+01:00');
});

test('geopolitical missile and critical-infrastructure reports are highlighted without treating routine updates as high impact',()=>{
 assert.equal(regimeHighImpact('Saudi-led coalition: intercepted and destroyed ballistic missile launched towards Riyadh'),true);
 assert.equal(regimeHighImpact('One killed in Ukrainian missile strike on industrial site'),true);
 assert.equal(regimeHighImpact('Houthis say they struck Saudi Aramco site in Yanbu'),true);
 assert.equal(regimeHighImpact('Houthis targeted Riyadh airport'),true);
 assert.equal(regimeHighImpact('Yemen-based Houthis: attack on King Khalid International Airport in Riyadh; no immediate Saudi confirmation'),true);
 assert.equal(regimeHighImpact('Houthis attack oil refinery near Riyadh'),true);
 assert.equal(regimeHighImpact('Saudi-led coalition: military operation targets Houthi sites in Yemen to neutralize threats - statement'),true);
 assert.equal(regimeHighImpact('Saudi-led coalition: two missile launchers destroyed in Yemen\'s Sanaa, one targeted Riyadh'),true);
 assert.equal(regimeHighImpact('Houthis say they targeted Saudi Arabia’s east-west crude oil pumping stations with drones; no immediate confirmation from Saudi'),true);
 assert.equal(regimeHighImpact('Saudi-led coalition: operation demolished five ballistic missile storage sites and four launch platforms in Houthi-controlled areas'),true);
 assert.equal(regimeHighImpact('Saudi-led coalition: regular training drill concludes'),false);
 assert.equal(regimeHighImpact('Saudi pumping stations publish monthly efficiency report'),false);

 assert.equal(regimeHighImpact('Drone strike against oil facilities'),true);
 assert.equal(regimeHighImpact('Airport announces summer flights'),false);
 assert.equal(regimeHighImpact('Algerian parliament approves resolution to deploy troops to Niger'),true);
 assert.equal(regimeHighImpact('Parliament authorizes deployment of military units abroad'),true);
 assert.equal(regimeHighImpact('Troops complete routine training exercise'),false);
 assert.equal(regimeHighImpact('Qatari mediators arrive in Tehran for talks'),false);
 assert.equal(regimeHighImpact('Bank of Canada rate decision'),true);
});


test('Macro Watch marks the Oct 26 Riyadh airport report as unconfirmed',()=>{
 assert.ok(html.includes('NEW / UNCONFIRMED RIYADH AIRPORT REPORT · 26 ОКТ 2026'));
 assert.ok(html.includes('NEW / COALITION OPERATIONS IN YEMEN · 26 ОКТ 2026'));
 assert.ok(html.includes('26 OCT · SAUDI / YEMEN ESCALATION WATCH'));
 assert.ok(html.includes('https://www.spa.gov.sa/N2710294'));

 assert.ok(html.includes('нема непосредна потврда од саудиските власти'));
 assert.ok(html.includes('3M G10 bias: UNCHANGED'));
});

test('calendar suppresses inherited duplicates but preserves distinct simultaneous releases',()=>{
 const input={mode:'schedule-fallback',events:[
  {date:'2026-10-05T09:30:00+02:00',currency:'GBP',event:'UK Final Services PMI · Sep',actual:'52.1',verificationStatus:'manual-archive',releaseState:'released'},
  {date:'2026-10-05T09:30:00+02:00',currency:'GBP',event:'Final Services PMI · Sep (S&P Global UK)',actual:'52.1',verificationStatus:'verified-secondary',releaseState:'released'},
  {date:'2026-10-05T10:00:00+02:00',currency:'EUR',event:'Euro Area PPI y/y · Aug',actual:'8.2%',verificationStatus:'manual-archive',releaseState:'released'},
  {date:'2026-10-05T10:00:00+02:00',currency:'EUR',event:'Euro Area PPI m/m · Aug',actual:'1.9%',verificationStatus:'verified-primary',releaseState:'released'},
  {date:'2026-10-23T01:30:00+02:00',currency:'JPY',event:'National CPI y/y · Sep (2025-base)',actual:'2.1%',verificationStatus:'verified-primary',releaseState:'released'},
  {date:'2026-10-23T01:30:00+02:00',currency:'JPY',event:'National Core CPI ex fresh food y/y · Sep',actual:'2.1%',verificationStatus:'verified-primary',releaseState:'released'}
 ]};
 const out=applyVerifiedReleaseOverlay(input);
 assert.equal(out.events.filter(x=>x.currency==='GBP'&&/Final Services PMI/.test(x.event)).length,1);
 assert.ok(!out.events.some(x=>x.event==='UK Final Services PMI · Sep'));
 assert.ok(out.events.some(x=>x.event==='Euro Area PPI y/y · Aug'));
 assert.ok(out.events.some(x=>x.event==='Euro Area PPI m/m · Aug'));
 assert.ok(out.events.some(x=>x.event==='National CPI y/y · Sep (2025-base)'));
 assert.ok(out.events.some(x=>x.event==='National Core CPI ex fresh food y/y · Sep'));
 assert.equal(unresolvedNonScheduleOverdue(out),0);
});

test('past qualitative speeches await confirmation instead of false OVERDUE or PENDING',()=>{
 const c={Date,Intl,console,AbortSignal,process,setTimeout,clearTimeout};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync('lib/calendar-legacy.mjs','utf8').replace('export default async function','async function'),c);
 const now=Date.parse('2026-10-25T21:35:00Z');
 assert.equal(c.eventState({date:'2026-10-25T22:10:00+01:00',event:'RBA Assist Gov Jones Speaks',actual:'—'},now),'awaiting-confirmation');
 assert.equal(c.eventState({date:'2026-10-25T22:10:00+01:00',event:'CPI y/y',actual:'—'},now),'overdue');
 assert.equal(c.eventState({date:'2026-10-28T19:00:00+01:00',event:'FOMC Rate Decision',actual:'—'},now),'scheduled');
 assert.match(html,/SPEECH · CONFIRMATION PENDING/);
 assert.match(html,/SPEECH · UNCONFIRMED/);
});

test('verified Oct 26–28 G10 activity calendar is present in fallback without invented actuals',()=>{
 const expected=[
  ['USD','Durable Goods Orders m/m · Sep','2026-10-27T13:30:00+01:00','census.gov'],
  ['USD','New Home Sales · Sep (Census/HUD, SAAR)','2026-10-27T15:00:00+01:00','census.gov'],
  ['USD','Advance Goods Trade Balance · Sep','2026-10-28T13:30:00+01:00','census.gov'],
  ['GBP','UK Budget Statement & OBR Forecast · 2026','2026-10-28T13:30:00+01:00','irishnews.com']
 ];
 const out=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]});
 for(const [currency,name,date,domain] of expected){
  const rows=out.events.filter(x=>x.currency===currency&&x.event===name);
  assert.equal(rows.length,1,name+' should appear exactly once');
  assert.equal(rows[0].date,date);
  if(name==='Durable Goods Orders m/m · Sep'||name.startsWith('New Home Sales')||name==='Advance Goods Trade Balance · Sep'){
   // The Census reports are now released and primary-verified.
   assert.equal(rows[0].verificationStatus,'verified-primary');
   assert.equal(rows[0].actual,name.startsWith('New Home Sales')?'676K':name==='Advance Goods Trade Balance · Sep'?'-134.9B':'+1.8%');
  }else{
   assert.equal(rows[0].verificationStatus,'verified-secondary-publication');
   assert.equal(rows[0].releaseState,'released');
   assert.equal(rows[0].actual,'Published');
   assert.equal(rows[0].numericActualVerified,false);
  }
  assert.equal(rows[0].forecast,'—');
  assert.ok(rows[0].sourceUrl.includes(domain));
 }
 const merged=applyVerifiedReleaseOverlay({mode:'live',events:[
  {date:'2026-10-26T10:30:00+01:00',currency:'EUR',event:'German Ifo Business Climate',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-27T13:30:00+01:00',currency:'USD',event:'Durable Goods Orders',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-27T15:00:00+01:00',currency:'USD',event:'New Home Sales',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-28T13:30:00+01:00',currency:'USD',event:'Advance Goods Trade Balance',actual:'—',releaseState:'scheduled'},
  {date:'2026-10-28T12:30:00+01:00',currency:'GBP',event:'Annual Budget Release',actual:'—',releaseState:'scheduled'}
 ]});
 for(const [currency,name,date] of expected){
  const aliases=merged.events.filter(x=>x.currency===currency&&x.date===date&&
   (x.event===name||/Ifo Business Climate|Durable Goods Orders|New Home Sales|Advance Goods Trade Balance|UK Budget Statement|Annual Budget Release/.test(x.event)));
  assert.equal(aliases.length,1,'duplicate '+name);
 }
 const budget=out.events.find(x=>x.event==='UK Budget Statement & OBR Forecast · 2026');
 assert.equal(budget.releaseState,'released');
 assert.equal(budget.verificationStatus,'verified-secondary-publication');
 assert.equal(budget.actual,'Published');
 assert.equal(budget.releaseTimeVerified,false,'nominal Budget start is not issuer-confirmed');
 const budgetLive=merged.events.find(x=>x.event==='UK Budget Statement & OBR Forecast · 2026');
 assert.equal(budgetLive.date,'2026-10-28T13:30:00+01:00');
 assert.equal(budgetLive.releaseState,'released');
 assert.equal(budgetLive.verificationStatus,'verified-secondary-publication');
 assert.equal(budgetLive.releaseTimeVerified,false);
});

test('Oct 28 UK Budget and Autumn Forecast alias are one released secondary publication in LIVE and FALLBACK',()=>{
 for(const mode of ['live','schedule-fallback']){
  const out=applyVerifiedReleaseOverlay({mode,events:[
   {date:'2026-10-28T13:30:00+01:00',currency:'GBP',event:'Annual Budget Release',actual:'—',releaseState:'overdue'},
   {date:'2026-10-28T13:30:00+01:00',currency:'GBP',event:'Autumn Forecast Statement',actual:'—',releaseState:'overdue'}
  ]});
  const rows=out.events.filter(x=>x.currency==='GBP'&&String(x.date).startsWith('2026-10-28'));
  assert.equal(rows.length,1,'UK fiscal event should not be duplicated');
  assert.equal(rows[0].event,'UK Budget Statement & OBR Forecast · 2026');
  assert.equal(rows[0].releaseState,'released');
  assert.equal(rows[0].verificationStatus,'verified-secondary-publication');
  assert.equal(rows[0].actual,'Published');
  assert.equal(rows[0].numericActualVerified,false);
  assert.equal(rows[0].releaseTimeVerified,false);
  assert.equal(out.overdue,0);
 }
});

test('Oct 27 ADP and FHFA primary releases resolve overdue in both calendar modes without fabricating consensus',()=>{
 for(const mode of ['live','schedule-fallback']){
  const out=applyVerifiedReleaseOverlay({mode,events:[
   {date:'2026-10-27T13:15:00+01:00',currency:'USD',event:'ADP Weekly Employment Change',actual:'—',releaseState:'overdue'},
   {date:'2026-10-27T14:00:00+01:00',currency:'USD',event:'HPI m/m',actual:'—',releaseState:'overdue'}
  ]});
  const adp=out.events.filter(x=>x.event.startsWith('ADP NER Pulse'));
  const fhfa=out.events.filter(x=>x.event.startsWith('FHFA House Price Index'));
  assert.equal(adp.length,1);
  assert.equal(fhfa.length,1);
  assert.equal(adp[0].actual,'+16.75K/week');
  assert.equal(adp[0].previous,'+17.50K/week (revised)');
  assert.equal(fhfa[0].actual,'+0.3%');
  assert.equal(fhfa[0].previous,'+0.2% revised');
  for(const row of [...adp,...fhfa]){
   assert.equal(row.releaseState,'released');
   assert.equal(row.verificationStatus,'verified-primary');
   assert.equal(row.forecast,'—');
   assert.ok(row.sourceUrl.startsWith('https://'));
  }
 }
 const fallback=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]});
 const cs=fallback.events.filter(x=>x.event==='S&P/CS Composite-20 HPI y/y · Aug');
 assert.equal(cs.length,1);
 assert.equal(cs[0].actual,'2.7%');
 assert.equal(cs[0].previous,'2.5%');
 assert.equal(cs[0].verificationStatus,'verified-primary');
 assert.equal(cs[0].forecast,'—');
 assert.equal(cs[0].releaseState,'released');
});

test('Oct 27 S&P Case-Shiller August 20-city primary release resolves overdue without duplicates',()=>{
 for(const mode of ['live','schedule-fallback']){
  const out=applyVerifiedReleaseOverlay({mode,events:[
   {date:'2026-10-27T14:00:00+01:00',currency:'USD',event:'S&P/CS Composite-20 HPI y/y',actual:'—',previous:'2.5%',forecast:'2.6%',releaseState:'overdue',importance:'MED'}
  ]});
  const rows=out.events.filter(e=>e.currency==='USD'&&/S&P\/CS Composite-20 HPI/.test(e.event));
  assert.equal(rows.length,1,mode+' should contain exactly one 20-city release');
  assert.equal(rows[0].actual,'2.7%');
  assert.equal(rows[0].previous,'2.5%');
  assert.equal(rows[0].forecast,'—','do not invent or trust unverified consensus');
  assert.equal(rows[0].releaseState,'released');
  assert.equal(rows[0].verificationStatus,'verified-primary');
  assert.match(rows[0].sourceUrl,/spglobal\.com\/spdji/);
 }
 assert.ok(html.includes('US CASE-SHILLER 20-CITY'));
 assert.ok(!html.includes('Case-Shiller August 20-city y/y remains <b>OVERDUE'));
});

test('Oct 27 Census/HUD September new home sales is released with revised August and no invented consensus',()=>{
 for(const mode of ['live','schedule-fallback']){
  const out=applyVerifiedReleaseOverlay({mode,events:[
   {date:'2026-10-27T15:00:00+01:00',currency:'USD',event:'New Home Sales',actual:'—',previous:'684K',releaseState:'overdue'}
  ]});
  const rows=out.events.filter(e=>e.currency==='USD'&&e.event.startsWith('New Home Sales · Sep'));
  assert.equal(rows.length,1);
  assert.equal(rows[0].actual,'676K');
  assert.equal(rows[0].previous,'680K revised');
  assert.equal(rows[0].forecast,'—');
  assert.equal(rows[0].releaseState,'released');
  assert.equal(rows[0].verificationStatus,'verified-primary');
  assert.match(rows[0].sourceUrl,/census.gov/);
 }
 assert.ok(html.includes('US NEW HOME SALES (USD / HOUSING)'));
 assert.ok(html.includes('US NEW HOME SALES (CENSUS/HUD PRIMARY / USD)'));
});

test('Oct 27 Conference Board and Richmond Fed primary actuals supersede overdue without fabricating consensus',()=>{
 for(const mode of ['live','schedule-fallback']){
  const out=applyVerifiedReleaseOverlay({mode,events:[
   {date:'2026-10-27T15:00:00+01:00',currency:'USD',event:'CB Consumer Confidence',actual:'—',previous:'81.9',releaseState:'overdue'},
   {date:'2026-10-27T15:00:00+01:00',currency:'USD',event:'Richmond Manufacturing Index',actual:'—',releaseState:'overdue'}
  ]});
  const cb=out.events.filter(e=>e.event==='Conference Board Consumer Confidence · Oct');
  const rich=out.events.filter(e=>e.event==='Richmond Fed Manufacturing Index · Oct');
  assert.equal(cb.length,1);
  assert.equal(rich.length,1);
  assert.equal(cb[0].actual,'91.7');
  assert.equal(cb[0].previous,'84.2 revised');
  assert.equal(rich[0].actual,'-2');
  assert.equal(rich[0].previous,'-2');
  for(const e of [...cb,...rich]){
   assert.equal(e.releaseState,'released');
   assert.equal(e.verificationStatus,'verified-primary');
   assert.equal(e.forecast,'—');
   assert.ok(e.sourceUrl.startsWith('https://'));
  }
 }
 assert.ok(html.includes('US CONSUMER CONFIDENCE (USD / GROWTH)'));
 assert.ok(html.includes('RICHMOND FED MANUFACTURING (USD / GROWTH)'));
 assert.ok(html.includes('CONFERENCE BOARD CONSUMER CONFIDENCE (USD / PRIMARY)'));
});

test('Oct 26 German ifo is RELEASED with secondary provenance and no duplicated live/fallback overdue',()=>{
 const fallback=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]});
 const live=applyVerifiedReleaseOverlay({mode:'live',events:[
  {date:'2026-10-26T10:00:00+01:00',currency:'EUR',event:'German ifo Business Climate',actual:'—',forecast:'89.9',releaseState:'overdue',importance:'HIGH'}
 ]});
 for(const data of [fallback,live]){
  const matches=data.events.filter(x=>x.currency==='EUR'&&/ifo Business Climate/i.test(x.event));
  assert.equal(matches.length,1,'single ifo row in '+data.mode);
  const e=matches[0];
  assert.equal(e.date,'2026-10-26T10:30:00+01:00');
  assert.equal(e.actual,'90.2');
  assert.equal(e.previous,'89.9');
  assert.equal(e.forecast,'—','conflicting secondary forecasts must not become verified consensus');
  assert.equal(e.releaseState,'released');
  assert.equal(e.verificationStatus,'verified-secondary');
  assert.equal(e.releaseTimeVerified,false,'official schedule and wire timestamps differ');
  assert.ok(e.sourceUrl.includes('reuters.com'));
  assert.equal(unresolvedNonScheduleOverdue(data),0);
 }
 assert.ok(html.includes('26 OCT · GERMAN IFO RELEASE (EUR / GROWTH)'));
 assert.ok(html.includes('GERMAN IFO OCTOBER RELEASE'));
});

test('FinancialJuice ifo headline maps to EUR and high-impact macro, components remain separate',()=>{
 const source=fs.readFileSync('api/news.js','utf8')
  .replace('export function categories','function categories')
   .replace('export function regimeHighImpact','function regimeHighImpact')
  .replace('export default async function handler','async function handler');
 const c={Date};vm.createContext(c);vm.runInContext(source,c);
 const xml='<rss><channel><item><title>FinancialJuice: German IFO Business Climate Actual 90.2 (Forecast 89.9, Previous 89.9)</title><pubDate>Mon, 26 Oct 2026 09:00:13 GMT</pubDate></item><item><title>FinancialJuice: German IFO Current Conditions Actual 88.8 (Forecast 89.8, Previous 89.5)</title><pubDate>Mon, 26 Oct 2026 09:00:22 GMT</pubDate></item></channel></rss>';
 const rows=c.parseRSS(xml);
 assert.equal(rows.length,2);
 assert.equal(rows[0].macro.ccy,'EUR');
 assert.equal(rows[0].macro.kind,'IFO BUSINESS SENTIMENT');
 assert.equal(rows[0].macro.result,'BEAT');
 assert.equal(rows[0].highImpact,true);
 assert.ok(rows[0].categories.includes('MACRO'));
 assert.equal(rows[1].macro.ccy,'EUR');
 assert.equal(rows[1].highImpact,false);
});


test('Oct 26 Dallas Fed primary release is deduplicated and published in Weekly Focus',()=>{
 const fallback=applyVerifiedReleaseOverlay({mode:'schedule-fallback',events:[]});
 const live=applyVerifiedReleaseOverlay({mode:'live',events:[
  {date:'2026-10-26T15:30:00+01:00',currency:'USD',event:'Dallas Fed Manufacturing Index',actual:'—',releaseState:'overdue',importance:'MED'}
 ]});
 for(const data of [fallback,live]){
  const matches=data.events.filter(x=>x.currency==='USD'&&/Dallas Fed Manufacturing/i.test(x.event));
  assert.equal(matches.length,1,'one Dallas Fed release in '+data.mode);
  const e=matches[0];
  assert.equal(e.actual,'13.4');
  assert.equal(e.previous,'9.8');
  assert.equal(e.forecast,'—');
  assert.equal(e.releaseState,'released');
  assert.equal(e.verificationStatus,'verified-primary');
  assert.equal(e.releaseTimeVerified,false);
  assert.match(e.sourceUrl,/dallasfed.org\/research\/surveys\/tmos\/2026\/2610/);
  assert.equal(unresolvedNonScheduleOverdue(data),0);
 }
 assert.ok(html.includes('DALLAS FED MANUFACTURING · 26 OCT 2026'));
 assert.ok(html.includes('26 OCT · DALLAS FED MANUFACTURING (USD / GROWTH)'));
});


test('UKMTO fire report near Al-Faw is high-impact maritime risk, not a confirmed attack or supply outage',()=>{
 const headline='FinancialJuice: UKMTO receives multiple reports of vessel on fire near Iraq';
 assert.equal(regimeHighImpact(headline),true,'UKMTO vessel fire must surface as high-impact');
 assert.equal(regimeHighImpact('UKMTO advises ships to transit with caution'),false,'generic maritime advisory should not be high-impact');
 assert.ok(html.includes('UKMTO REPORTED VESSEL FIRE OFF IRAQ'));
 assert.ok(html.includes('26 OCT · UKMTO VESSEL FIRE REPORT OFF IRAQ'));
 assert.ok(html.includes('63 nautical miles southeast of Al-Faw'));
 assert.ok(html.includes('not confirmation of an attack'));
});


test('Oct 26 US–Canada tariff talks appear in Macro Watch and Weekly Focus with explicit no-deal caveat',()=>{
 assert.ok(html.includes('NEW / US–CANADA SECTION 232 TARIFF TALKS'));
 assert.ok(html.includes('26 OCT · US–CANADA SECTION 232 TRADE NEGOTIATIONS'));
 assert.ok(html.includes('Talks are NOT a signed agreement'));
 assert.ok(html.includes('not signed or implemented'));
 assert.ok(html.includes('us-canada-working-deal-ease-steel-auto-tariffs-sources-say-2026-10-26'));
});
test('Plural tariffs headline is geopolitics but preliminary talks are not a confirmed high-impact shock',()=>{
 const headline='The US and Canada are working on a deal to ease US tariffs on Canadian steel and auto imports - Sources';
 assert.ok(categories(headline).includes('GEOPOLITICS'));
 assert.equal(regimeHighImpact(headline),false);
});

test('USDA Oct 26 Crop Progress official publication clears overdue and reaches Weekly Focus',()=>{
 const c={Date,fetch:async()=>({ok:false}),console};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync('api/commodity-calendar.js','utf8').replace('export default async function','async function'),c);
 const row=c.usdaRows().find(x=>x.date.startsWith('2026-10-26')&&x.event==='Crop Progress');
 assert.ok(row,'Oct 26 USDA row exists');
 assert.equal(row.releaseState,'released');
 assert.equal(row.verificationStatus,'verified-primary');
 assert.equal(row.actual,'—','multi-metric report has no single Actual');
 assert.equal(row.sourceUrl,'https://esmis.nal.usda.gov/sites/default/release-files/796124/prog4326.txt');
 assert.ok(html.includes('26 OCT · USDA CROP PROGRESS RELEASED'));
 assert.ok(html.includes('NEW / USDA CROP PROGRESS · 26 OCT 2026'));
});

test('October 26 ECB SAFE and Carney qualification are present in both Macro Watch and Weekly Focus',()=>{
 const ecb='https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr261026~bde7b6d11a.en.html';
 const carney='https://www.financialjuice.com/News/9821859/Canadas-PM-Carney-Not-willing-to-sign-US-trade-terms-offered-in-August.aspx?xy=rss';
 assert.equal(html.split(ecb).length-1,2,'ECB primary source linked in Macro Watch and Weekly Focus');
 assert.equal(html.split(carney).length-1,2,'Carney secondary headline attributed in both views');
 assert.match(html,/NEW \/ ECB SAFE Q3 2026[^<]*· 26 OCT · VERIFIED PRIMARY/);
 assert.match(html,/26 OCT · ECB SAFE Q3 2026 \(EUR \/ FINANCING CONDITIONS\)/);
 assert.match(html,/26 OCT 20:34–20:40 UTC · CARNEY QUALIFIES CANADA–US TRADE OPTIMISM/);
 assert.match(html,/NOT an ECB policy decision or live rate probability/);
 assert.match(html,/not a signed agreement, confirmed tariff reduction or independently verified full transcript/);
});

test('China industrial profits are macro data, not geopolitics solely because country is China',()=>{
 const headline='FinancialJuice: China Jan-Sept industrial profits rise 15.5% yr/yr: stats bureau';
 assert.ok(categories(headline).includes('MACRO'));
 assert.ok(!categories(headline).includes('GEOPOLITICS'));
});
test('China central bank liquidity injections are CENTRAL BANK, not geopolitics',()=>{
 const headlines=[
  'FinancialJuice: China cbank injects 1 trillion yuan through overnight reverse repos: statement',
  'FinancialJuice: China c.bank injects 412 bln yuan via 7-day reverse repos',
  'FinancialJuice: PBOC conducts reverse repos'
 ];
 for(const headline of headlines){
  assert.ok(categories(headline).includes('CENTRAL BANK'),headline);
  assert.ok(!categories(headline).includes('GEOPOLITICS'),headline);
 }
 assert.ok(categories('US announces new tariffs on China imports').includes('GEOPOLITICS'));
 assert.ok(categories('South China Sea military confrontation').includes('GEOPOLITICS'));
});

test('Oct 27 Saudi-Houthi interceptions are attributed in Macro Watch and Weekly Focus without invented oil outage',()=>{
 const link='https://www.reuters.com/world/middle-east/saudi-led-coalition-says-it-intercepted-houthi-missiles-drones-attacking-kingdom-2026-10-27/';
 const html=fs.readFileSync('index.html','utf8');
 assert.equal(html.split(link).length-1,2,'Reuters source is linked in both views');
 assert.ok(html.includes('NEW / SAUDI–HOUTHI MISSILE &amp; DRONE INTERCEPTIONS'));
 assert.ok(html.includes('27 OCT · SAUDI–HOUTHI MISSILE &amp; DRONE INTERCEPTIONS'));
 assert.ok(html.includes('three Houthi ballistic missiles'));
 assert.ok(html.includes('four drones'));
 assert.ok(html.includes('not a confirmed oil supply outage'));
 assert.ok(html.includes('3M G10 bias unchanged'));
});

test('ECB Bank Lending Survey is released with verified publication provenance and no invented numeric actual',()=>{
 const cases=[
  {mode:'schedule-fallback',events:[]},
  {mode:'live',events:[{date:'2026-10-27T10:00:00+01:00',currency:'EUR',event:'ECB Bank Lending Survey',releaseState:'scheduled',importance:'MED',actual:'—'}]}
 ];
 for(const payload of cases){
  const out=applyVerifiedReleaseOverlay(payload);
  const rows=out.events.filter(x=>x.currency==='EUR'&&/Bank Lending Survey/i.test(x.event));
  assert.equal(rows.length,1,'ECB BLS must appear once in '+payload.mode);
  assert.equal(rows[0].date,'2026-10-27T10:00:00+01:00');
  assert.equal(rows[0].releaseState,'released','verified publication must clear overdue');
  assert.equal(rows[0].actual,'Published','multi-metric survey is not a single numeric actual');
  assert.equal(rows[0].forecast,'—','no fabricated market forecast');
  assert.equal(rows[0].numericActualVerified,false,'no fabricated numeric actual');
  assert.equal(rows[0].verificationStatus,'verified-secondary-publication');
  assert.equal(rows[0].sourceUrl,'https://www.reuters.com/business/finance/euro-zone-mortgage-demand-falls-rates-rise-ecb-survey-shows-2026-10-27/');
  assert.equal(rows[0].releaseTimeVerified,true);
 }
 const h=fs.readFileSync('index.html','utf8');
 assert.ok(h.includes('RELEASED / ECB BANK LENDING SURVEY · 27 OCT 2026'));
 assert.ok(!h.includes('UPCOMING / ECB BANK LENDING SURVEY · 27 OCT 2026'),'no stale upcoming status after release');
 assert.ok(h.includes('27 OCT 10:00 CET · ECB Q3 BANK LENDING SURVEY'),'published BLS appears in Weekly Focus');
 assert.ok(h.includes('ECB Bank Lending Survey|Durable Goods Orders'),'weekly event matcher includes ECB BLS');
 assert.ok(h.includes('September M3 и household Private Loans се веќе'),'published ECB values replace old overdue warning');
 assert.ok(!h.includes('September M3 Money Supply и Private Loans Actual остануваат непотврдени'),'remove obsolete unverified claim');
});

test('Oct 27 BoJ underlying CPI clears live/fallback overdue and is shown in both research views',()=>{
 const cases=[
  {mode:'schedule-fallback',events:[]},
  {mode:'live',events:[{date:'2026-10-27T06:00:00+01:00',currency:'JPY',event:'BOJ Core CPI y/y',actual:'—',previous:'1.8%',forecast:'1.9%',releaseState:'overdue',importance:'LOW'}]}
 ];
 for(const input of cases){
  const out=applyVerifiedReleaseOverlay(input);
  const rows=out.events.filter(x=>x.currency==='JPY'&&/BOJ Core CPI/i.test(x.event));
  assert.equal(rows.length,1,'one BoJ CPI event in '+input.mode);
  assert.equal(rows[0].releaseState,'released');
  assert.equal(rows[0].actual,'2.4%');
  assert.equal(rows[0].previous,'1.8%');
  assert.equal(rows[0].forecast,'—','unverified forecast must not be presented as fact');
  assert.equal(rows[0].verificationStatus,'verified-secondary');
  assert.equal(rows[0].releaseTimeVerified,true);
  assert.equal(unresolvedNonScheduleOverdue(out),0);
 }
 const html=fs.readFileSync('index.html','utf8');
 assert.equal(html.split('https://www.forexfactory.com/calendar/631-jn-boj-core-cpi-yy').length-1,2);
 assert.ok(html.includes('RELEASED / 27 OCT · BOJ UNDERLYING CORE CPI'));
 assert.ok(html.includes('27 OCT · BOJ UNDERLYING CORE CPI y/y (JPY / INFLATION)'));
 assert.ok(html.includes('Not the 2.1% national CPI'));
});

test('28 Oct AUD monthly CPI and trimmed-mean releases clear LIVE overdue without quarterly metric confusion',()=>{
 const payload={mode:'live',events:[
  {date:'2026-10-28T01:30:00+01:00',currency:'AUD',event:'CPI m/m',actual:'—',releaseState:'overdue',importance:'HIGH'},
  {date:'2026-10-28T01:30:00+01:00',currency:'AUD',event:'Trimmed Mean CPI m/m',actual:'—',releaseState:'overdue',importance:'HIGH'}
 ]};
 const out=applyVerifiedReleaseOverlay(payload);
 const expected=[['CPI m/m · Sep','+0.8%'],['Trimmed Mean CPI m/m · Sep','+0.3%']];
 for(const [name,actual] of expected){
  const rows=out.events.filter(x=>x.currency==='AUD'&&x.event.startsWith(name));
  assert.equal(rows.length,1,name+' duplicate/missing');
  assert.equal(rows[0].actual,actual);
  assert.equal(rows[0].releaseState,'released');
  assert.equal(rows[0].verificationStatus,'verified-primary');
  assert.equal(rows[0].forecast,'—');
 }
 assert.equal(out.events.filter(x=>x.currency==='AUD'&&x.releaseState==='overdue').length,0);
});

test('28 Oct Bullock remarks are released as secondary publication without numeric policy decision',()=>{
 const out=applyVerifiedReleaseOverlay({mode:'live',events:[{
  date:'2026-10-28T01:15:00+01:00',currency:'AUD',event:'RBA Gov Bullock Speaks',
  releaseState:'awaiting-confirmation',actual:'—',importance:'HIGH'
 }]});
 const matches=out.events.filter(x=>x.currency==='AUD'&&x.event.startsWith('RBA Gov Bullock Speaks'));
 assert.equal(matches.length,1);
 assert.equal(matches[0].releaseState,'released');
 assert.equal(matches[0].actual,'Published');
 assert.equal(matches[0].numericActualVerified,false);
 assert.equal(matches[0].verificationStatus,'verified-secondary-publication');
});

test('28 Oct RBNZ rate statement and OCR decision are separate primary-verified releases',()=>{
 const base=[
  {date:'2026-10-28T02:00:00+01:00',currency:'NZD',event:'RBNZ Rate Statement',actual:'—',releaseState:'overdue',importance:'EXTREME'},
  {date:'2026-10-28T02:00:00+01:00',currency:'NZD',event:'RBNZ Official Cash Rate',actual:'—',releaseState:'overdue',importance:'EXTREME'}
 ];
 for(const payload of [
  {mode:'live',events:base},
  {mode:'live',events:[...base].reverse()},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const nzd=out.events.filter(e=>e.currency==='NZD'&&e.date.startsWith('2026-10-28'));
  const ocr=nzd.filter(e=>e.event.startsWith('RBNZ OCR ·'));
  const statement=nzd.filter(e=>e.event.startsWith('RBNZ Rate Statement ·'));
  assert.equal(ocr.length,1,'one OCR result in '+payload.mode);
  assert.equal(statement.length,1,'one separate RBNZ statement in '+payload.mode);
  assert.equal(ocr[0].actual,'2.75% HOLD (4–3)');
  assert.equal(statement[0].actual,'Published','qualitative statement has no numeric Actual');
  assert.equal(statement[0].numericActualVerified,false);
  assert.equal(statement[0].actualVerifiedAt,null);
  assert.equal(statement[0].verificationStatus,'verified-primary');
  assert.equal(nzd.filter(e=>e.releaseState==='overdue'||e.releaseState==='pending').length,0);
  assert.equal(ocr[0].sourceUrl,statement[0].sourceUrl);
 }
});

test('RBNZ Oct 28 media conference clears past pending without inventing a numerical actual or primary transcript',()=>{
 for(const payload of [
  {mode:'live',events:[{date:'2026-10-28T03:00:00+01:00',currency:'NZD',event:'RBNZ Press Conference',actual:'—',releaseState:'awaiting-confirmation',importance:'HIGH'}]},
  {mode:'live',events:[{date:'2026-10-28T03:00:00+01:00',currency:'NZD',event:'RBNZ Press Conference',actual:'—',releaseState:'overdue',importance:'HIGH'}]},
  {mode:'schedule-fallback',events:[]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const rows=out.events.filter(x=>x.currency==='NZD'&&/^RBNZ Press Conference · 28 Oct/.test(x.event));
  assert.equal(rows.length,1,'exactly one qualitative conference event');
  const e=rows[0];
  assert.equal(e.date,'2026-10-28T03:00:00+01:00');
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'Held · remarks reported');
  assert.equal(e.numericActualVerified,false);
  assert.equal(e.actualVerifiedAt,null);
  assert.equal(e.verificationStatus,'verified-secondary-publication');
  assert.equal(e.releaseTimeVerified,true);
  assert.ok(e.sourceUrl.includes('investinglive.com/central-banks/'));
  assert.equal(out.events.filter(x=>x.currency==='NZD'&&/^RBNZ Press Conference/.test(x.event)&&x.releaseState!=='released').length,0);
 }
});

test('Oct 28 German 10-y Bund auction is primary-verified and released exactly once in both modes',()=>{
 for(const payload of [
  {mode:'schedule-fallback',events:[]},
  {mode:'live',events:[{
   date:'2026-10-28T11:32:00+01:00',currency:'EUR',event:'German 10-y Bond Auction',
   releaseState:'overdue',actual:'—',previous:'3.58%',importance:'LOW'
  }]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const rows=out.events.filter(e=>e.currency==='EUR'&&/^German 10-y Bond Auction/.test(e.event));
  assert.equal(rows.length,1,'one auction row in '+payload.mode);
  const e=rows[0];
  assert.equal(e.date,'2026-10-28T11:32:00+01:00');
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'3.37%');
  assert.equal(e.previous,'3.58%');
  assert.equal(e.forecast,'—');
  assert.equal(e.verificationStatus,'verified-primary');
  assert.equal(e.releaseTimeVerified,false);
  assert.match(e.source,/cover 1.1/);
  assert.ok(e.sourceUrl.includes('deutsche-finanzagentur.de'));
  assert.equal(out.events.filter(x=>x.releaseState==='overdue'&&/German 10-y Bond Auction/.test(x.event)).length,0);
 }
});

test('Oct 28 CHF UBS-CFA release clears overdue once in LIVE and fallback with secondary provenance',()=>{
 for(const payload of [
  {mode:'schedule-fallback',events:[]},
  {mode:'live',events:[{
   date:'2026-10-28T10:00:00+01:00',currency:'CHF',event:'UBS Economic Expectations',
   releaseState:'overdue',actual:'—',previous:'2.6',forecast:'1.3',importance:'LOW'
  }]}
 ]){
  const out=applyVerifiedReleaseOverlay(payload,{includeFullSchedule:true});
  const rows=out.events.filter(e=>e.currency==='CHF'&&/^UBS Economic Expectations/.test(e.event));
  assert.equal(rows.length,1,'one UBS-CFA row in '+payload.mode);
  const e=rows[0];
  assert.equal(e.date,'2026-10-28T10:00:00+01:00');
  assert.equal(e.releaseState,'released');
  assert.equal(e.actual,'-15.3');
  assert.equal(e.previous,'2.6');
  assert.equal(e.forecast,'—','unverified provider consensus not imported');
  assert.equal(e.verificationStatus,'verified-secondary');
  assert.equal(e.releaseTimeVerified,false);
  assert.match(e.source,/Original UBS October bulletin not independently retrieved/);
  assert.ok(e.sourceUrl.includes('nau.ch'));
  assert.equal(out.events.filter(e=>e.currency==='CHF'&&e.releaseState==='overdue'&&/UBS Economic Expectations/.test(e.event)).length,0);
 }
});
