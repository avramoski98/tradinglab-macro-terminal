from pathlib import Path
import re
p=Path('index.html')
s=p.read_text()
css='''
/* Commodity Cycles · restored original visual language */
#commodity .commodity-hero{border-top:1px solid #6b461a;border-bottom:1px solid #6b461a;background:#0b0906;padding:12px 2px;margin-bottom:10px}
#commodity .commodity-hero b{color:var(--accent2)}
#commodity .commodity-table{overflow:auto;border:1px solid var(--line2)}
#commodity .commodity-table table{min-width:1220px;font-size:10px}
#commodity .commodity-table td{padding:10px 8px}
#commodity .commodity-sym{font-size:12px;font-weight:900;color:#fff}
#commodity .commodity-note{max-width:320px;line-height:1.45;color:#c8c8c8}
#commodity .commodity-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
#commodity .commodity-card{border:1px solid var(--line);background:var(--panel);padding:12px}
#commodity .commodity-card h3{margin:0 0 9px;font-size:11px;color:var(--accent);text-transform:uppercase}
#commodity .commodity-news{margin-top:12px;border:1px solid var(--line)}
#commodity .commodity-news-head{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border-bottom:1px solid #4a3218;background:#15100a;color:var(--accent2);font-size:10px;text-transform:uppercase}
#commodity .commodity-news-item{padding:9px 10px;border-bottom:1px solid #1d1d1d;background:#080808}
#commodity .commodity-news-item:last-child{border-bottom:0}
#commodity .commodity-detail-btn{border:1px solid #51401d;background:#15100a;color:var(--accent2);padding:6px 8px;cursor:pointer;font:inherit;font-size:9px;text-transform:uppercase}
@media(max-width:1000px){#commodity .commodity-cards{grid-template-columns:1fr}}
'''
if '/* Commodity Cycles · restored original visual language */' not in s:
    s=s.replace('</style>',css+'\n</style>',1)
newfn=r'''function commodityNewsItems(){let items=[...(newsData.financialjuice||[]),...(newsData.reuters||[])],out=[];for(const n of items){let hit=COMMODITY_CORE.find(c=>c.keys.test(String(n.title||'')));if(hit)out.push({c:hit,title:String(n.title||''),time:n.time||n.pubDate||''})}return out.slice(0,20)}
function openCommodityDrawer(sym){let c=COMMODITY_CORE.find(x=>x.sym===sym);if(!c)return;$('#drawerBody').innerHTML=`<div class="kicker">${esc(c.sym)} · ${esc(c.name)}</div><h2>${esc(c.narr)}</h2><div class="call"><b>WHAT THIS MEANS FOR MARKET</b><br>${esc(c.meaning)}</div>${[['Current Phase',c.phase],['Current Narrative',c.narr],['Structural',c.struct],['Key Driver Now',c.driver],['Next Catalyst',c.next],['Bullish Confirmation',c.confirm],['Invalidation / Bear Risk',c.invalidate],['Live News Note',commodityHeadline(c)]].map(x=>`<div class="detail-row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}`;$('#drawer').classList.add('open')}
function commodityDesk(){let rows=COMMODITY_CORE.map(c=>`<tr><td><div class="commodity-sym">${c.sym}</div><div class="mini">${c.name}</div></td><td><b>${c.phase}</b></td><td>${tag(c.narr,c.tone)}</td><td>${tag(c.struct,tone(c.struct))}</td><td>${esc(c.driver)}</td><td>${esc(c.next)}</td><td class="commodity-note">${esc(commodityHeadline(c))}</td><td><button class="commodity-detail-btn" onclick="openCommodityDrawer('${c.sym}')">DETAIL</button></td></tr>`).join(''),news=commodityNewsItems();$('#commodity').innerHTML=`<div class="commodity-hero"><div class="kicker">TRADINGLAB · COMMODITY DESK</div><h2 style="margin:3px 0 7px;font-size:17px">Commodity Fundamental Cycles</h2><div class="mini" style="font-size:12px">PHASE = physical state · NARRATIVE = current fundamental interpretation · NOTE = fresh news that can change the thesis</div><div class="mini" style="margin-top:8px"><b>Decision use:</b> combine this with your existing COT + Valuation + Seasonality + HTF S/D. This tab answers only: what phase are we in, what is the current fundamental narrative, and what can change it next?</div></div><div class="commodity-table"><table><thead><tr><th>Market</th><th>Current Phase</th><th>Current Narrative</th><th>Structural</th><th>Key Driver Now</th><th>Next Catalyst</th><th>News Note</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="commodity-cards"><div class="commodity-card"><h3>Phase ≠ Narrative</h3><div class="mini">Example: HARVEST can create supply pressure, but if yield estimates collapse and exports accelerate, the actual narrative can still turn bullish.</div></div><div class="commodity-card"><h3>Current Cycle</h3><div class="mini">1–6 week view. Production stage + weather + physical supply/demand + inventory direction + active news.</div></div><div class="commodity-card"><h3>What This Means For Market</h3><div class="mini">Open DETAIL on any market. You will see the market implication, confirmation and invalidation without changing the main table style.</div></div></div><div class="commodity-news"><div class="commodity-news-head"><span>Live Commodity News Notes</span><span>${news.length} relevant headlines</span></div>${news.length?news.map(x=>`<div class="commodity-news-item"><b>${esc(x.c.sym)} · ${esc(x.c.name)}</b><div style="margin-top:4px">${esc(x.title)}</div><div class="mini" style="margin-top:4px">${esc(skopjeTime(x.time))}</div></div>`).join(''):'<div class="commodity-news-item mini">No major fresh commodity headline in the current live feed.</div>'}</div>`}'''
pattern=r"function commodityDesk\(\)\{.*?\}\nlet SECTOR_STATE=null;"
if not re.search(pattern,s,flags=re.S):
    raise SystemExit('commodityDesk block not found')
s=re.sub(pattern,newfn+'\nlet SECTOR_STATE=null;',s,count=1,flags=re.S)
p.write_text(s)
