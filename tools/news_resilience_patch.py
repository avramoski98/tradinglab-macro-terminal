from pathlib import Path
import re

p = Path('index.html')
s = p.read_text()

# ---- Dynamic freshness label -------------------------------------------------
s = re.sub(
    r'<div class="mini">Updated [^<]*?· Week of 31 Aug–4 Sep · click any currency for full reasoning</div>',
    '<div class="mini"><span id="dataFreshness">Live sync active</span> · Week of 31 Aug–4 Sep · click any currency for full reasoning</div>',
    s,
    count=1
)

# ---- One release history used everywhere ------------------------------------
history_helpers = r'''
function validActual(v){let a=String(v??'').trim().toLowerCase();return !!a&&a!=='—'&&a!=='-'&&a!=='null'&&a!=='n/a'}
function rawLiveReleaseObjects(){return (liveEvents||[]).filter(x=>ORDER.includes(x.currency)&&validActual(x.actual)).map(x=>{let kind=catalystKind(x.event),a=num(x.actual),f=num(x.forecast),lower=/unemployment|jobless|claims|deficit/i.test(x.event||''),result=x.label||x.surprise||'RELEASED',w=catalystWeight(kind),score=0;if(isFinite(a)&&isFinite(f)){let d=a-f;result=Math.abs(d)<1e-9?'NEUTRAL':(lower?(a<f?'BEAT':'MISS'):(a>f?'BEAT':'MISS'));score=result==='BEAT'?w:result==='MISS'?-w:0}return{date:x.date,ccy:x.currency,event:x.event,kind,actual:x.actual,forecast:x.forecast,previous:x.previous,result,score,highImpact:w>=1.5,why:x.impact||'Live structured calendar release'}})}
function staticReleaseObjects(){return STATIC_RELEASES.map(x=>({date:x[0],ccy:x[1],event:x[2],previous:x[3],forecast:x[4],actual:x[5],result:x[6],score:x[7]==='Bullish'?1:x[7]==='Bearish'?-1:0,highImpact:false,why:x[8]}))}
function allReleaseHistory(){let all=[...(newsData.macroUpdates||[]),...calendarMacroHistory(),...rawLiveReleaseObjects(),...MANUAL_CATALYSTS,...staticReleaseObjects()],seen=new Set(),out=[];for(const u of all){if(!u||!ORDER.includes(u.ccy)||!validActual(u.actual))continue;let key=[u.ccy,skopjeDate(u.date),String(u.event||'').toLowerCase().replace(/\s+/g,' ').trim(),String(u.actual)].join('|');if(seen.has(key))continue;seen.add(key);out.push(u)}return out.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))}
function recentCurrencyReleases(c,limit=8){return allReleaseHistory().filter(x=>x.ccy===c).slice(0,limit)}
function releaseHistoryRows(c,limit=8){let xs=recentCurrencyReleases(c,limit);if(!xs.length)return '<div class="mini">No released macro data yet.</div>';return xs.map(u=>{let score=Number(u.score||0),cls=score>0?'good':score<0?'bad':'warn',stamp=[skopjeDate(u.date),skopjeTime(u.date)].filter(Boolean).join(' · ');return `<div class="detail-row" style="display:block"><div class="mini" style="margin-bottom:4px">${esc(stamp)}</div><div style="display:flex;justify-content:space-between;gap:12px"><b>${esc(u.event)}</b><b class="${cls}">${esc(u.result||'RELEASED')}</b></div><div class="mini" style="margin-top:4px">Actual <b>${esc(u.actual)}</b> · Forecast ${esc(u.forecast)} · Previous ${esc(u.previous)}</div></div>`}).join('')}
'''
if 'function allReleaseHistory()' not in s:
    marker = 'function calendarEventMatch('
    if marker not in s:
        raise SystemExit('calendarEventMatch marker not found')
    s = s.replace(marker, history_helpers.strip() + '\n' + marker, 1)

# Latest Catalyst must use the same newest release shown in release history.
latest = r'''function latestFor(c){let u=recentCurrencyReleases(c,1)[0];if(u)return {date:u.date,currency:u.ccy,event:u.event,previous:u.previous,forecast:u.forecast,actual:u.actual,label:u.result||'RELEASED',impact:Number(u.score)>0?'Strengthens':Number(u.score)<0?'Weakens':'Neutral',why:u.why,score:u.score,highImpact:u.highImpact};return null}
'''
s, n = re.subn(r'function latestFor\(c\)\{.*?\}\nfunction impactClass', lambda m: latest + 'function impactClass', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('latestFor target not found')

# ---- Preserve News Desk scroll on every auto refresh -------------------------
newsdesk = r'''function newsDesk(){let oldNews=$('#news .newslist'),oldCat=$('#news .catalyst-panel'),newsTop=oldNews?oldNews.scrollTop:0,catTop=oldCat?oldCat.scrollTop:0,fj=newsData.financialjuice||[],mu=allCatalysts();$('#news').innerHTML=`<div class="livebar"><div><b>FinancialJuice · Live Headlines</b><div class="statusline">Auto refresh: 15s · high-impact macro / regime changes glow red</div></div><button class="refresh" onclick="loadNews(true)">Refresh now</button></div><div class="newsgrid"><div class="newspanel"><div class="newshead"><b>Headline Feed</b><span class="tag ${newsMode==='live'?'green':newsMode==='cached'?'amber':'red'}">${newsMode==='live'?'LIVE':newsMode==='cached'?'CACHED · RETRYING':'CONNECTING'}</span></div><div class="newslist">${fj.length?fj.slice(0,80).map(x=>newsCardItem(x,'FinancialJuice')).join(''):'<div class="newsitem mini">Feed loading or temporarily rate-limited.</div>'}</div></div><div class="newspanel"><div class="newshead"><b>G10 · Weekly Macro Catalysts</b><span class="tag green">AUTO RANK · MON–SUN</span></div><div class="catalyst-panel">${mu.length?mu.slice(0,25).map(catalystRow).join(''):'<div class="newsitem mini">Waiting for a structured Actual / Forecast / Previous macro release.</div>'}</div></div></div><div class="card" style="margin-top:10px"><div class="call"><b>Rule:</b> ordinary headlines stay headlines only. A structured G10 release is scored as Beat / Miss / Neutral with event-specific weight. CPI/PCE/NFP/rate decisions carry the most weight; secondary data carry less. The live value can re-rank G10, while the 3M macro state remains the base thesis.</div></div>`;let newNews=$('#news .newslist'),newCat=$('#news .catalyst-panel');if(newNews)newNews.scrollTop=newsTop;if(newCat)newCat.scrollTop=catTop}
'''
s, n = re.subn(r'function newsDesk\(\)\{.*?\}\nfunction showToast', lambda m: newsdesk + 'function showToast', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('newsDesk target not found')

# ---- Drawer: always show the newest released values --------------------------
drawer = r'''function openDrawer(c){let r=RES[c],lc=latestFor(c),historyTitle=c==='USD'?'Recent US Releases':`Recent ${c} Releases`;$('#drawerBody').innerHTML=`<div class="kicker">${c} · MACRO BREAKDOWN</div><h2>${esc(r.country)}</h2><div style="margin-bottom:14px">${tag(liveBias(c).label,liveBias(c).tone)} <span class="conf">BASE ${esc(r.final)}</span></div><div class="call">${esc(r.why)}</div>${[['3M Macro',r.macro],['Growth',r.growth],['Labor',r.labor],['Activity',r.activity],['Core Inflation',r.core],['Inflation regime',r.inflation],['Policy Rate',r.rate],['Central Bank',r.cb],['Next Expectation',r.next],['2Y / Pricing',`${r.y2} · ${r.pricing}`],['Confidence',r.confidence],['Live Catalyst Value',`${catalystScore(c)>0?'+':''}${catalystScore(c).toFixed(1)} · ${adjustedBiasNote(c)}`],['Live Bias',`${liveBias(c).label} · base ${r.final}`],['Weekly Focus',dynamicFocus(c)],['Invalidation',dynamicInvalidation(c)],['Latest Catalyst',lc?`${lc.event}: ${lc.actual} vs ${lc.forecast} · ${lc.impact||lc.label||'Update'}`:'—']].map(x=>`<div class="detail-row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}<h3 style="margin-top:20px">3M Evidence</h3><div class="mini" style="font-size:12px;line-height:1.7">${esc(r.trendDetail)}</div><h3 style="margin-top:20px">${esc(historyTitle)}</h3>${releaseHistoryRows(c,8)}`;$('#drawer').classList.add('open')}
'''
s, n = re.subn(r'function openDrawer\(c\)\{.*?\}\nfunction closeDrawer', lambda m: drawer + 'function closeDrawer', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('openDrawer target not found')

# ---- Whole-page scroll must also survive loadLive/loadNews render() ----------
render_block = r'''function captureUiScroll(){let n=$('#news .newslist'),c=$('#news .catalyst-panel'),d=$('#drawer');return{x:window.scrollX,y:window.scrollY,news:n?n.scrollTop:0,cat:c?c.scrollTop:0,drawer:d?d.scrollTop:0}}
function restoreUiScroll(st){requestAnimationFrame(()=>{window.scrollTo(st.x,st.y);let n=$('#news .newslist'),c=$('#news .catalyst-panel'),d=$('#drawer');if(n)n.scrollTop=st.news;if(c)c.scrollTop=st.cat;if(d)d.scrollTop=st.drawer})}
function updateDataFreshness(){let el=$('#dataFreshness');if(el)el.textContent='Live checked '+new Date().toLocaleString('en-GB',{timeZone:'Europe/Skopje',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' Skopje'}
function render(){let st=captureUiScroll();renderMarketTape();overview();$('#g10').innerHTML=table();weekly();calendarFull();live();newsDesk();divergence();method();updateAlertUI();updateNextEvent();updateDataFreshness();restoreUiScroll(st)}
'''
s, n = re.subn(r'function render\(\)\{.*?\}\nasync function loadLive', lambda m: render_block + 'async function loadLive', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('render target not found')

# Keep cached fallback fully synchronized with G10/Weekly/Recent Releases.
s = s.replace(
    "newsMode=(newsData.financialjuice||[]).length?'cached':'error';if(manual)showToast('News feed retry',String(e.message||e));newsDesk()}}",
    "newsMode=(newsData.financialjuice||[]).length?'cached':'error';if(manual)showToast('News feed retry',String(e.message||e));render()}}"
)

p.write_text(s)
print('Live release history + latest catalyst sync + scroll preservation enabled')
