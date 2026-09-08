from pathlib import Path

p = Path('index.html')
s = p.read_text()

# Upgrade the Rates Probabilities desk from Latest/Previous into a clearer
# three-snapshot institutional view: Prior -> Previous -> Current.
if "tl_rates_snapshot_v2" not in s:
    css = r'''
#rates .rate-table{grid-template-columns:minmax(138px,1.25fr) 92px 92px 92px 100px 92px}
#rates .rate-cell:nth-child(4n+1){text-align:right}
#rates .rate-cell:nth-child(6n+1){text-align:left}
#rates .rate-outcome b{display:block;color:#fff;font-size:10px}
#rates .rate-outcome .mini{margin-top:2px}
#rates .rate-current-pricing{color:var(--accent2);font-weight:900}
#rates .rate-prior{color:#777}
@media(max-width:700px){#rates .rate-table{min-width:760px}}
'''
    if '</style>' not in s:
        raise SystemExit('style close anchor missing')
    s = s.replace('</style>', css + '\n</style>', 1)

    start = s.find('let RATE_STATE=null;')
    end = s.find('async function loadRates()', start)
    if start == -1 or end == -1:
        raise SystemExit('rates JS block not found')

    js = r'''let RATE_STATE=null;
const RATE_SNAPSHOT_KEY='tl_rates_snapshot_v2';
function rateProbFmt(n){n=Number(n);return Number.isFinite(n)?n.toFixed(2)+'%':'—'}
function rateDeltaFmt(n){n=Number(n);return Number.isFinite(n)?`${n>0?'+':''}${n.toFixed(2)}pp`:'—'}
function rateValues(rows,field){let out={};for(let r of rows||[]){let v=Number(r[field]);if(Number.isFinite(v))out[r.rate]=v}return out}
function rateSnapshot(stamp,values,kind='market'){return {stamp:String(stamp||''),values,kind}}
function rateHistory(payload){
  let saved={};try{saved=JSON.parse(localStorage.getItem(RATE_SNAPSHOT_KEY)||'{}')}catch(e){}
  let next={},stamp=String(payload.updatedAt||new Date().toISOString());
  let cards=(payload.cards||[]).map(card=>{
    let seed=card.rows||[],old=(saved[card.id]&&Array.isArray(saved[card.id].history))?saved[card.id].history:[];
    let currentValues=rateValues(seed,'latest'),referenceValues=rateValues(seed,'previous'),history=[...old];
    if(!history.length){
      history.push(rateSnapshot(stamp,currentValues,'market'));
      if(Object.keys(referenceValues).length)history.push(rateSnapshot('REFERENCE',referenceValues,'reference'));
    }else if(history[0].stamp===stamp){
      history[0]=rateSnapshot(stamp,currentValues,'market');
    }else{
      history.unshift(rateSnapshot(stamp,currentValues,'market'));
    }
    history=history.slice(0,3);
    let cur=history[0]||null,prev=history[1]||null,prior=history[2]||null;
    let rows=seed.map(r=>({...r,
      currentPricing:cur&&Object.prototype.hasOwnProperty.call(cur.values,r.rate)?Number(cur.values[r.rate]):Number(r.latest),
      previousPricing:prev&&Object.prototype.hasOwnProperty.call(prev.values,r.rate)?Number(prev.values[r.rate]):NaN,
      priorPricing:prior&&Object.prototype.hasOwnProperty.call(prior.values,r.rate)?Number(prior.values[r.rate]):NaN
    }));
    next[card.id]={history};
    return {...card,rows,history};
  });
  try{localStorage.setItem(RATE_SNAPSHOT_KEY,JSON.stringify(next))}catch(e){}
  return {...payload,cards};
}
function rateOutcome(r){let label=r.direction==='hike'?'HIKE':r.direction==='cut'?'CUT':'HOLD';return `<div class="rate-outcome"><b>${label}${r.current?' · CURRENT RATE':''}</b><div class="mini">${esc(r.rate)}</div></div>`}
function ratePolicyDelta(card,baseField){
  let hike=(card.rows||[]).find(r=>r.direction==='hike'),cut=(card.rows||[]).find(r=>r.direction==='cut');
  if(!hike&&!cut)return NaN;
  let hc=hike?Number(hike.currentPricing):0,hb=hike?Number(hike[baseField]):0,cc=cut?Number(cut.currentPricing):0,cb=cut?Number(cut[baseField]):0;
  if((hike&&!Number.isFinite(hb))||(cut&&!Number.isFinite(cb)))return NaN;
  return (hc-hb)-(cc-cb);
}
function rateRepricing(card){
  let short=ratePolicyDelta(card,'previousPricing'),broad=ratePolicyDelta(card,'priorPricing'),signal=Number.isFinite(short)?short:0;
  if(signal>.05)return {label:'HAWKISH REPRICING',tone:'good',short,broad};
  if(signal<-.05)return {label:'DOVISH REPRICING',tone:'bad',short,broad};
  return {label:'PRICING STABLE',tone:'warn',short,broad};
}
function ratesDesk(){
  let el=$('#rates');if(!el)return;
  if(!RATE_STATE){el.innerHTML='<div class="card"><h3>Interest Rate Probabilities</h3><div class="mini">Loading market-implied probabilities…</div></div>';return}
  let stamp=new Date(RATE_STATE.updatedAt||Date.now()).toLocaleString('en-GB',{timeZone:'Europe/Skopje',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  el.innerHTML=`<div class="weekhero"><div class="kicker">TRADINGLAB · RATES PROBABILITIES</div><h2>Prior Pricing → Previous Pricing → Current Market Expectation</h2><div class="mini" style="font-size:12px"><b>Current Market Expectation</b> = what the market prices now. <b>Previous Pricing</b> = the immediately preceding snapshot. <b>Prior Pricing</b> = the snapshot before that. The two Δ columns show exactly how much today's expectation moved versus each of the last two observations.</div></div><div class="rates-status"><div><b>${RATE_STATE.mode==='live'?'LIVE / MARKET-IMPLIED':'REFERENCE SNAPSHOT'}</b><div class="mini">This is market pricing, not the central bank's official forecast or decision.</div></div><div class="mini" style="text-align:right">Current snapshot ${esc(stamp)} · Prilep, Macedonia<br>Snapshots are stored locally in this browser.</div></div><div class="rates-grid">${(RATE_STATE.cards||[]).map(card=>{let read=rateRepricing(card),short=Number.isFinite(read.short)?rateDeltaFmt(read.short):'—',broad=Number.isFinite(read.broad)?rateDeltaFmt(read.broad):'—';return `<div class="rate-card"><div class="rate-head"><div><div class="rate-bank">${esc(card.id)} · ${esc(card.ccy)}</div><b>${esc(card.name)} Interest Rate Probabilities</b><div class="mini" style="margin-top:4px">Policy rate now ${esc(card.current)} · Source ${esc(card.source)}</div></div><div class="rate-meta">NEXT DECISION<br><b style="color:#ddd">${esc(card.nextMeeting)}</b></div></div><div style="overflow:auto"><div class="rate-table"><div class="rate-cell rate-colhead">Policy Outcome</div><div class="rate-cell rate-colhead">Prior Pricing</div><div class="rate-cell rate-colhead">Previous Pricing</div><div class="rate-cell rate-colhead">Current Pricing</div><div class="rate-cell rate-colhead">Δ vs Previous</div><div class="rate-cell rate-colhead">Δ vs Prior</div>${(card.rows||[]).map(r=>{let dp=Number(r.currentPricing)-Number(r.previousPricing),d2=Number(r.currentPricing)-Number(r.priorPricing),cp=dp>.0001?'pos':dp<-.0001?'neg':'flat',c2=d2>.0001?'pos':d2<-.0001?'neg':'flat';return `<div class="rate-cell">${rateOutcome(r)}</div><div class="rate-cell rate-prior">${rateProbFmt(r.priorPricing)}</div><div class="rate-cell">${rateProbFmt(r.previousPricing)}</div><div class="rate-cell rate-current-pricing">${rateProbFmt(r.currentPricing)}</div><div class="rate-cell rate-change ${Number.isFinite(dp)?cp:'flat'}">${rateDeltaFmt(dp)}</div><div class="rate-cell rate-change ${Number.isFinite(d2)?c2:'flat'}">${rateDeltaFmt(d2)}</div>`}).join('')}</div></div><div class="rate-read"><b class="${read.tone}">${read.label}</b> · latest policy repricing <b>${short}</b>${Number.isFinite(read.broad)?` · vs prior <b>${broad}</b>`:''}. <span class="muted">If both deltas point the same way, the repricing has continuity; if they conflict, the latest move may be a short-term reversal/spike.</span></div></div>`}).join('')}</div><div class="call" style="margin-top:8px"><b>Example:</b> HIKE 48.2% prior → 55.6% previous → 57.4% current means the hike probability strengthened across both snapshots. Δ vs Previous = +1.8pp; Δ vs Prior = +9.2pp. That is much stronger confirmation than seeing 57.4% in isolation.</div>`;
}
'''
    s = s[:start] + js + '\n' + s[end:]

p.write_text(s)
print('Rates history upgraded to Current / Previous / Prior pricing')
