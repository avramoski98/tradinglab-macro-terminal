from pathlib import Path

p = Path('index.html')
s = p.read_text()

# -----------------------------------------------------------------------------
# Rates probabilities UI
# -----------------------------------------------------------------------------
if '#rates .rates-grid' not in s:
    css = r'''
#rates .rates-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#rates .rate-card{border:1px solid var(--line);background:#080808;min-width:0}
#rates .rate-head{display:flex;justify-content:space-between;gap:14px;padding:10px 11px;border-bottom:1px solid #4a3218;background:#15100a}
#rates .rate-bank{font-size:12px;font-weight:900;color:var(--accent2)}
#rates .rate-meta{text-align:right;color:#777;font-size:9px;line-height:1.5}
#rates .rate-table{display:grid;grid-template-columns:minmax(92px,1fr) 88px 88px 86px}
#rates .rate-cell{padding:8px 10px;border-bottom:1px solid #1d1d1d;font-size:10px;text-align:right}
#rates .rate-cell:nth-child(4n+1){text-align:left}
#rates .rate-colhead{background:#0d0d0d;color:#777;font-size:8.5px;text-transform:uppercase;letter-spacing:.55px;font-weight:800}
#rates .rate-current{color:#fff;font-weight:900}
#rates .rate-change.pos{color:var(--green);font-weight:900}
#rates .rate-change.neg{color:var(--red);font-weight:900}
#rates .rate-change.flat{color:#7f7f7f;font-weight:900}
#rates .rate-read{padding:9px 10px;background:#090909;font-size:9.5px;line-height:1.5}
#rates .rate-read b{font-weight:900}
#rates .rates-status{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:8px;padding:9px 10px;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);background:#090909}
@media(max-width:950px){#rates .rates-grid{grid-template-columns:1fr}}
'''
    if '</style>' not in s:
        raise SystemExit('style close anchor missing')
    s = s.replace('</style>', css + '\n</style>', 1)

if 'data-tab="rates"' not in s:
    anchor = '    <button data-tab="g10">G10 Macro Monitor</button>'
    if anchor not in s:
        raise SystemExit('rates nav anchor missing')
    s = s.replace(anchor, anchor + '\n    <button data-tab="rates">Rates Probabilities</button>', 1)

if 'id="rates" class="section"' not in s:
    anchor = '  <section id="g10" class="section"></section>'
    if anchor not in s:
        raise SystemExit('rates section anchor missing')
    s = s.replace(anchor, anchor + '\n  <section id="rates" class="section"></section>', 1)

if 'function ratesDesk()' not in s:
    js = r'''
let RATE_STATE=null;
const RATE_SNAPSHOT_KEY='tl_rates_snapshot_v1';
function rateProbFmt(n){n=Number(n);return Number.isFinite(n)?n.toFixed(2)+'%':'—'}
function rateDeltaFmt(n){n=Number(n);return Number.isFinite(n)?`${n>0?'+':''}${n.toFixed(2)}%`:'—'}
function rateHistory(payload){
  let saved={};try{saved=JSON.parse(localStorage.getItem(RATE_SNAPSHOT_KEY)||'{}')}catch(e){}
  let next={};
  let cards=(payload.cards||[]).map(card=>{
    let old=saved[card.id]||null,seed=card.rows||[],previousMap={};
    if(old&&old.snapshot===payload.snapshot&&(old.previous||[]).length){for(let r of old.previous)previousMap[r.rate]=r.value}
    else if(old&&(old.latest||[]).length){for(let r of old.latest)previousMap[r.rate]=r.value}
    let rows=seed.map(r=>({...r,previous:Object.prototype.hasOwnProperty.call(previousMap,r.rate)?Number(previousMap[r.rate]):Number(r.previous)}));
    next[card.id]={snapshot:payload.snapshot,latest:rows.map(r=>({rate:r.rate,value:Number(r.latest)})),previous:rows.map(r=>({rate:r.rate,value:Number(r.previous)}))};
    return {...card,rows};
  });
  try{localStorage.setItem(RATE_SNAPSHOT_KEY,JSON.stringify(next))}catch(e){}
  return {...payload,cards};
}
function rateRepricing(card){
  let hike=(card.rows||[]).find(r=>r.direction==='hike'),cut=(card.rows||[]).find(r=>r.direction==='cut');
  let h=hike?Number(hike.latest)-Number(hike.previous):0,c=cut?Number(cut.latest)-Number(cut.previous):0,net=h-c;
  if(net>.05)return {label:'HAWKISH REPRICING',tone:'good',delta:net};
  if(net<-.05)return {label:'DOVISH REPRICING',tone:'bad',delta:net};
  return {label:'PRICING STABLE',tone:'warn',delta:net};
}
function ratesDesk(){
  let el=$('#rates');if(!el)return;
  if(!RATE_STATE){el.innerHTML='<div class="card"><h3>Interest Rate Probabilities</h3><div class="mini">Loading market-implied probabilities…</div></div>';return}
  let stamp=new Date(RATE_STATE.updatedAt||Date.now()).toLocaleString('en-GB',{timeZone:'Europe/Skopje',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  el.innerHTML=`<div class="weekhero"><div class="kicker">TRADINGLAB · RATES PROBABILITIES</div><h2>Latest → Previous → Change</h2><div class="mini" style="font-size:12px">Market-implied central-bank decision probabilities. Positive/negative values in Change show the movement in probability points versus the previous stored/reference snapshot — the same fast repricing read you use around CPI, labor data and central-bank headlines.</div></div><div class="rates-status"><div><b>${RATE_STATE.mode==='live'?'LIVE / MARKET-IMPLIED':'REFERENCE SNAPSHOT'}</b><div class="mini">Sources: CentralBank.Watch futures/OIS models; BoC fallback can use RateProbability.</div></div><div class="mini" style="text-align:right">Updated ${esc(stamp)} · Prilep, Macedonia<br>Probabilities are pricing, not a forecast.</div></div><div class="rates-grid">${(RATE_STATE.cards||[]).map(card=>{let read=rateRepricing(card);return `<div class="rate-card"><div class="rate-head"><div><div class="rate-bank">${esc(card.id)} · ${esc(card.ccy)}</div><b>${esc(card.name)} Interest Rate Probabilities</b><div class="mini" style="margin-top:4px">Current ${esc(card.current)} · Source ${esc(card.source)}</div></div><div class="rate-meta">NEXT DECISION<br><b style="color:#ddd">${esc(card.nextMeeting)}</b></div></div><div class="rate-table"><div class="rate-cell rate-colhead">Rate</div><div class="rate-cell rate-colhead">Latest</div><div class="rate-cell rate-colhead">Previous</div><div class="rate-cell rate-colhead">Change</div>${(card.rows||[]).map(r=>{let d=Number(r.latest)-Number(r.previous),cls=d>.0001?'pos':d<-.0001?'neg':'flat';return `<div class="rate-cell ${r.current?'rate-current':''}">${esc(r.rate)}${r.current?' · NOW':''}</div><div class="rate-cell ${r.current?'rate-current':''}">${rateProbFmt(r.latest)}</div><div class="rate-cell">${rateProbFmt(r.previous)}</div><div class="rate-cell rate-change ${cls}">${rateDeltaFmt(d)}</div>`}).join('')}</div><div class="rate-read"><b class="${read.tone}">${read.label}</b> · net policy repricing ${read.delta>0?'+':''}${read.delta.toFixed(2)}pp. <span class="muted">Read the direction together with the macro base and 2Y/front-end yields.</span></div></div>`}).join('')}</div><div class="call" style="margin-top:8px"><b>How to read it:</b> if probability shifts from the current rate toward the higher-rate row, the market is repricing more hawkish. If probability shifts toward the lower-rate row, it is more dovish. A large probability change after a release is a much cleaner policy-confirmation signal than looking at the headline alone.</div>`;
}
async function loadRates(){
  try{let r=await fetch('/api/rates',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);RATE_STATE=rateHistory(await r.json());ratesDesk()}catch(e){if(!RATE_STATE&&$('#rates'))$('#rates').innerHTML=`<div class="card"><h3>Interest Rate Probabilities</h3><div class="call"><b>Rates feed unavailable.</b> ${esc(String(e.message||e))}</div></div>`}
}
'''
    anchor = 'function weekly()'
    if anchor not in s:
        raise SystemExit('rates JS anchor missing')
    s = s.replace(anchor, js + '\n' + anchor, 1)

# Add rates rendering to the regular render loop.
old = 'commodityDesk();sectorDesk();method();updateAlertUI()'
new = 'commodityDesk();sectorDesk();ratesDesk();method();updateAlertUI()'
if old in s and 'sectorDesk();ratesDesk();method()' not in s:
    s = s.replace(old, new, 1)

# Add rates title.
old = "sector:'Sector Rotation',method:'Framework'"
new = "sector:'Sector Rotation',rates:'Rates Probabilities',method:'Framework'"
if old in s:
    s = s.replace(old, new, 1)

# Load rates at startup and refresh every 15 minutes.
old = 'render();loadMarkets();loadLive();loadNews();loadSectors();checkEventReminders();'
new = 'render();loadMarkets();loadLive();loadNews();loadSectors();loadRates();checkEventReminders();'
if old in s:
    s = s.replace(old, new, 1)
old = 'setInterval(loadSectors,60000);setInterval(checkEventReminders,15000);'
new = 'setInterval(loadSectors,60000);setInterval(loadRates,900000);setInterval(checkEventReminders,15000);'
if old in s:
    s = s.replace(old, new, 1)

# -----------------------------------------------------------------------------
# Sep 7-8 released macro data
# -----------------------------------------------------------------------------
# The UK Construction PMI was actually released on Sep 4, not Sep 7. Correct the
# static calendar entry if this old date is still present.
s = s.replace("'2026-09-07','10:30','GBP','UK Construction PMI · Aug'", "'2026-09-04','10:30','GBP','UK Construction PMI · Aug'")

if "event:'UK Construction PMI · Aug'" not in s:
    anchor = " {date:'2026-09-04T14:30:00+02:00',ccy:'USD',event:'Nonfarm Payrolls · Aug'"
    idx = s.find(anchor)
    if idx != -1:
        add = " {date:'2026-09-04T10:30:00+02:00',ccy:'GBP',event:'UK Construction PMI · Aug',kind:'CONSTRUCTION PMI',actual:'44.3',forecast:'45.5',previous:'44.7',result:'MISS',score:-1.0,highImpact:false,why:'Construction PMI fell further below 50 and missed consensus; a secondary negative GBP activity signal.'},\n"
        s = s[:idx] + add + s[idx:]

if "event:'Germany Trade Balance · Jul'" not in s:
    anchor = " {date:'2026-09-07T08:00:00+02:00',ccy:'EUR',event:'German Industrial Production · Jul'"
    idx = s.find(anchor)
    if idx == -1:
        raise SystemExit('Sep 8 catalyst anchor missing')
    # Insert immediately before the existing Sep 7 German industrial production row.
    add = """ {date:'2026-09-08T08:00:00+02:00',ccy:'EUR',event:'Germany Trade Balance · Jul',kind:'TRADE',actual:'€21.3B',forecast:'€16.0B',previous:'€15.4B',result:'BEAT / MIXED',score:0.5,highImpact:false,why:'The surplus beat consensus, but the detail was mixed: exports fell 0.8% m/m while imports fell 5.7%, so this is not a clean external-demand bullish signal.'},
 {date:'2026-09-08T08:45:00+02:00',ccy:'EUR',event:'France Trade Balance · Jul',kind:'TRADE',actual:'-€6.67B',forecast:'-€6.0B',previous:'-€5.75B rev.',result:'MISS',score:-0.75,highImpact:false,why:'The French trade deficit widened more than expected, a secondary negative contribution to EUR breadth.'},
 {date:'2026-09-08T08:45:00+02:00',ccy:'EUR',event:'France Current Account · Jul',kind:'CURRENT ACCOUNT',actual:'-€4.70B',forecast:'-€2.0B',previous:'-€1.60B',result:'MISS',score:-0.5,highImpact:false,why:'The current-account deficit widened sharply as goods and services balances deteriorated; secondary EUR negative.'},
"""
    s = s[:idx] + add + s[idx:]

if "test:/Germany Trade Balance/i" not in s:
    anchor = 'const CAL_RESULT_OVERRIDES=['
    if anchor not in s:
        raise SystemExit('calendar override list missing')
    add = r'''
 {date:'2026-09-08',ccy:'EUR',test:/Germany Trade Balance/i,previous:'€15.4B',forecast:'€16.0B',actual:'€21.3B',verdict:'BEAT / MIXED',detail:'Surplus beat · exports -0.8% m/m, imports -5.7% m/m'},
 {date:'2026-09-08',ccy:'EUR',test:/France.*Trade Balance|French.*Trade Balance/i,previous:'-€5.75B rev.',forecast:'-€6.0B',actual:'-€6.67B',verdict:'MISS',detail:'Deficit wider than expected'},
 {date:'2026-09-08',ccy:'EUR',test:/France.*Current Account|French.*Current Account/i,previous:'-€1.60B',forecast:'-€2.0B',actual:'-€4.70B',verdict:'MISS',detail:'Current-account deficit widened sharply'},
'''
    s = s.replace(anchor, anchor + add, 1)

# If Construction PMI remains in the static calendar for any reason, at least lock
# its result correctly. The canonical released date is Sep 4.
if "test:/UK Construction PMI/i" not in s:
    anchor = 'const CAL_RESULT_OVERRIDES=['
    add = r'''
 {date:'2026-09-04',ccy:'GBP',test:/UK Construction PMI/i,previous:'44.7',forecast:'45.5',actual:'44.3',verdict:'MISS',detail:'MISS -1.2 vs consensus · 20th month below 50'},
'''
    s = s.replace(anchor, anchor + add, 1)

p.write_text(s)
print('Rates probabilities desk + Sep 8 macro updates applied')
