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
 const targets=out.events.filter(x=>/Retail Sales m\/m|Revised UoM/.test(x.event));
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
