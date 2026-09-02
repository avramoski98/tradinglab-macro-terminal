from pathlib import Path
import re

p = Path('index.html')
s = p.read_text()

anchor = "function adjustedBiasNote(c){let s=catalystScore(c);return s>=3?'UPGRADE WATCH':s<=-3?'DOWNGRADE WATCH':Math.abs(s)>=1.5?'CATALYST ACTIVE':'BASE INTACT'}"
helpers = r'''
function liveBias(c){let map={'VERY BULLISH':2,'BULLISH':1.25,'MILD BULLISH':.65,'NEUTRAL+':.25,'NEUTRAL':0,'MILD BEARISH':-.65,'BEARISH':-1.25,'VERY BEARISH':-2},key=String(RES[c].final||'NEUTRAL').toUpperCase(),base=Object.prototype.hasOwnProperty.call(map,key)?map[key]:0,v=base+catalystScore(c)*.38,label='NEUTRAL',tone='blue';if(v>=1.75){label='VERY BULLISH';tone='green'}else if(v>=.75){label='BULLISH';tone='green'}else if(v>=.25){label='MILD BULLISH';tone='green'}else if(v<=-1.75){label='VERY BEARISH';tone='red'}else if(v<=-.75){label='BEARISH';tone='red'}else if(v<=-.25){label='MILD BEARISH';tone='red'}return{label,tone,value:Math.round(v*100)/100,base:RES[c].final}}
function nextFocusEvent(c){let now=Date.now(),xs=[...STATIC_CAL].filter(x=>x[2]===c).map(x=>[x,new Date(`${x[0]}T${x[1]}:00+02:00`)]).filter(z=>z[1].getTime()>now).sort((a,b)=>a[1]-b[1]);return xs.length?xs[0][0]:null}
function recentFocusCatalysts(c,limit=2){return allCatalysts().filter(x=>x.ccy===c).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,limit)}
function dynamicFocus(c){let xs=recentFocusCatalysts(c,2),n=nextFocusEvent(c),s=catalystScore(c),parts=[];if(xs.length){parts.push('Latest: '+xs.map(u=>`${u.event}: ${u.actual}${u.forecast&&u.forecast!=='—'?` vs ${u.forecast}`:''} · ${u.result||'UPDATE'}`).join(' | ')+`. Weekly Δ ${s>0?'+':''}${s.toFixed(1)}.`)}else parts.push(RES[c].weekly);if(n)parts.push(`Next: ${n[3]} · ${n[0]} ${n[1]} Skopje.`);else parts.push('No further scheduled tier-one event this week.');return parts.join(' ')}
function dynamicInvalidation(c){let s=catalystScore(c),n=nextFocusEvent(c),state=s<=-3?'DOWNGRADE WATCH: negative catalysts materially weakened the base thesis.':s<=-1.5?'THESIS PRESSURED: the latest macro impulse weakened the base thesis.':s>=3?'UPGRADE WATCH: positive catalysts materially strengthened the base thesis.':s>=1.5?'THESIS CONFIRMED: the latest macro impulse supports the base thesis.':'BASE INTACT: no weekly catalyst has materially changed the base thesis.';return `${state} Base invalidation: ${RES[c].invalidate}${n?` Next confirmation: ${n[3]}.`:''}`}
'''.strip()

if 'function liveBias(c)' not in s:
    if anchor not in s:
        raise SystemExit('adjustedBiasNote anchor not found')
    s = s.replace(anchor, anchor + '\n' + helpers, 1)

# Keep the main G10 table aligned with the same live bias used in Currency Focus.
s = s.replace('<th>Live Bias</th>', '<th>Live Bias</th>', 1)
s = s.replace('<th>Bias</th>', '<th>Live Bias</th>', 1)
s = s.replace("let r=RES[c],lc=latestFor(c),s=catalystScore(c);return", "let r=RES[c],lc=latestFor(c),s=catalystScore(c),lb=liveBias(c);return", 1)
s = s.replace('${tag(r.final,r.tone)}<div class="mini">CONF ${esc(r.confidence)}</div></td>', '${tag(lb.label,lb.tone)}<div class="mini">BASE ${esc(r.final)} · CONF ${esc(r.confidence)}</div></td>', 1)

# Replace the stale pre-data Weekly Focus with a live post-release narrative.
weekly = r'''function weekly(){let baseFocus=['USD','EUR','JPY','AUD','NZD','CAD','CHF'],order=currentOrder(),focus=order.filter(c=>baseFocus.includes(c)),pairs=[[order[0],order[order.length-1]],[order[1],order[order.length-2]],[order[2],order[order.length-3]]];$('#weekly').innerHTML=`<div class="weekhero"><div class="kicker">TRADINGLAB WEEKLY OVERVIEW · LIVE</div><h2>Currency Focus updates after every macro catalyst</h2><div class="mini" style="font-size:12px">Current live hierarchy: ${order.join(' → ')}. The 3M thesis stays as the base, while this panel rewrites the live bias, focus and invalidation after new structured macro releases.</div></div><div class="grid"><div class="card s7"><h3>Currency Focus</h3><div class="focusgrid">${focus.map(c=>{let lb=liveBias(c),s=catalystScore(c);return `<div class="focusitem"><div>${tag(c+' · '+lb.label,lb.tone)} <span class="conf">${esc(RES[c].confidence)} · Δ ${s>0?'+':''}${s.toFixed(1)} · BASE ${esc(RES[c].final)}</span></div><div class="mini" style="margin-top:8px"><b>Focus:</b> ${esc(dynamicFocus(c))}</div><div class="mini" style="margin-top:7px;color:#f0c4c4"><b>Invalidation:</b> ${esc(dynamicInvalidation(c))}</div></div>`}).join('')}</div></div><div class="card s5"><h3>Live Pair Focus</h3><div class="call">${pairs.map(([a,b])=>`<b>${a} / ${b}</b> · live divergence ${a} ${liveBias(a).label} (Δ ${catalystScore(a)>0?'+':''}${catalystScore(a).toFixed(1)}) vs ${b} ${liveBias(b).label} (Δ ${catalystScore(b)>0?'+':''}${catalystScore(b).toFixed(1)}).`).join('<br><br>')}</div><h3>Risk Override</h3><div class="call">Global risk-off can temporarily strengthen <b>USD, JPY and CHF</b> regardless of domestic rank. Energy/geopolitical shocks can also reprice inflation faster than scheduled data. If price and 2Y yields reject the macro story, do not force the table.</div></div></div>`}'''
pattern = r"function weekly\(\)\{.*?\}\nconst CAL_MACRO_STORE="
if not re.search(pattern, s, re.S):
    raise SystemExit('weekly function target not found')
s = re.sub(pattern, lambda m: weekly + '\nconst CAL_MACRO_STORE=', s, count=1, flags=re.S)

# Drawer should explain live state rather than showing the stale pre-data weekly strings.
s = s.replace('<div style="margin-bottom:14px">${tag(r.final,r.tone)}</div>', '<div style="margin-bottom:14px">${tag(liveBias(c).label,liveBias(c).tone)} <span class="conf">BASE ${esc(r.final)}</span></div>', 1)
s = s.replace("['Live Catalyst Value',`${catalystScore(c)>0?'+':''}${catalystScore(c).toFixed(1)} · ${adjustedBiasNote(c)}`],['Weekly Focus',r.weekly],['Invalidation',r.invalidate]", "['Live Catalyst Value',`${catalystScore(c)>0?'+':''}${catalystScore(c).toFixed(1)} · ${adjustedBiasNote(c)}`],['Live Bias',`${liveBias(c).label} · base ${r.final}`],['Weekly Focus',dynamicFocus(c)],['Invalidation',dynamicInvalidation(c)]", 1)

# If FinancialJuice temporarily falls back to the last-good cache, re-render every panel,
# not only the News Desk, so Currency Focus remains synchronized.
s = s.replace("newsMode=(newsData.financialjuice||[]).length?'cached':'error';if(manual)showToast('News feed retry',String(e.message||e));newsDesk()}}", "newsMode=(newsData.financialjuice||[]).length?'cached':'error';if(manual)showToast('News feed retry',String(e.message||e));render()}}", 1)

p.write_text(s)
print('Dynamic Currency Focus enabled: live bias + post-release narrative + next catalyst + synchronized cache render')
