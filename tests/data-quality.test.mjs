import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {numeric,normalizeRelease} from '../lib/economic-provider.mjs';
import economic from '../api/economic.js';
import {applyVerifiedReleaseOverlay} from '../api/calendar.js';
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(d){this.data=d;return this;}});
test('numeric values preserve missing versus zero and magnitude',()=>{assert.equal(numeric('0.0%'),0);assert.equal(numeric('—'),null);assert.equal(numeric(null),null);assert.equal(numeric('1.2M'),1200000);assert.equal(numeric('-200K'),-200000);assert.equal(numeric('inflation rose 3%'),null);});
test('release dates are UTC; previous revision is not current actual',()=>{const e=normalizeRelease({Date:'2026-10-02T12:30:00',Actual:'178K',Forecast:'175K',Previous:'142K',Revised:'161K',Reference:'Sep',ReferenceDate:'2026-09-01T00:00:00',LastUpdate:'2026-10-02T12:31:00'});assert.equal(e.releaseDate,'2026-10-02T12:30:00.000Z');assert.equal(e.actual,178000);assert.equal(e.previous,142000);assert.equal(e.priorBeforeRevision,161000);assert.equal(e.surprise,3000);assert.equal(e.reference,'Sep');assert.equal(normalizeRelease({Date:'invalid'}),null);});
test('missing configured provider returns explicit unavailable response',async()=>{const key=process.env.TRADING_ECONOMICS_KEY;delete process.env.TRADING_ECONOMICS_KEY;try{const res=response();await economic({query:{currency:'USD',months:'6'}},res);assert.equal(res.code,503);assert.equal(res.data.mode,'not-configured');assert.deepEqual(res.data.events,[]);assert.equal(res.data.sourceUpdatedAt,null);}finally{if(key)process.env.TRADING_ECONOMICS_KEY=key;}});
test('economic endpoint validates queries',async()=>{const res=response();await economic({query:{currency:'XXX',months:'6'}},res);assert.equal(res.code,400);});
const ctx={Date,AbortController,setTimeout,clearTimeout,fetch:()=>{},process};vm.createContext(ctx);vm.runInContext(fs.readFileSync('api/rates.js','utf8').replace('export default async function','async function'),ctx);
test('rates accept markdown fixture, reject invalid probability totals',()=>{const source=fs.readFileSync('tests/fixtures/rates-source.txt','utf8'),clean=ctx.cleanText(source),bank={name:'Federal Reserve'};const block=ctx.bankSection(clean,bank,0),p=ctx.parseProbabilities(block);assert.ok(p);assert.equal(p.hike,19.5);assert.equal(p.hold,80.5);assert.equal(ctx.parseProbabilities('Rate Hike 90% Hold 90% Rate Cut 1%'),null);assert.equal(ctx.parseSourceDate(clean),'2026-10-06T00:00:00.000Z');});
const html=fs.readFileSync('index.html','utf8'),inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
test('main terminal inline scripts all parse',()=>{for(const x of inline)new vm.Script(x[1]);});
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
 assert.equal(usd.actual,'46.3');assert.equal(usd.forecast,'47.5');assert.equal(usd.releaseState,'released');assert.equal(out.overdue,0);
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
 assert.ok(targets.every(x=>x.releaseState==='released'&&x.verificationStatus==='verified-secondary'&&x.sourceUrl));
 assert.deepEqual(targets.map(x=>x.forecast),['1.1%','1.3%','46.3','4.7%']);
 assert.equal(out.overdue,0);
});

test('weekly focus includes late October 23 verified-secondary catalysts and caveats',()=>{
 const h=fs.readFileSync('index.html','utf8');
 assert.ok(h.includes('US Michigan final (23 Oct, 16:00 CEST)'));
 assert.ok(h.includes('Canada August Retail Sales (23 Oct, 14:30 CEST)'));
 assert.ok(h.includes('not independently verified against the University of Michigan primary bulletin'));
 assert.ok(h.includes('primary bulletin not independently retrieved'));
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
 assert.equal(d.overdue,0);
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
 assert.equal(result.events.filter(x=>x.releaseState==='overdue').length,0);
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
