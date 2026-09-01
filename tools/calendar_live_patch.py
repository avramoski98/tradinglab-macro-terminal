from pathlib import Path
import re

p=Path('index.html')
s=p.read_text()

# Make the header explicit that the terminal uses Skopje/Belgrade local time.
s=s.replace('Updated 1 Sep 2026 · 17:52 · Week of 31 Aug–4 Sep',
            'Updated 1 Sep 2026 · 17:52 Skopje · Week of 31 Aug–4 Sep')
s=s.replace('Updated 1 Sep 2026 · 17:52 Skopje · Week of 31 Aug–4 Sep',
            'Updated 1 Sep 2026 · 17:52 Skopje · Week of 31 Aug–4 Sep')

# Replace the calendar helper/render block with a version that has verified static results
# for all events already released through ISM/JOLTS, while still accepting future live FJ results.
block=r'''const CAL_MACRO_STORE='tl_calendar_macro_v1';
const CAL_RESULT_OVERRIDES=[
 {date:'2026-08-31',ccy:'JPY',test:/Retail Sales.*Industrial Production/i,previous:'Retail 0.6% · IP 1.9% m/m',forecast:'Retail 3.2% · IP -0.7% m/m',actual:'Retail 4.0% · IP 0.1% m/m',verdict:'BEAT',detail:'Retail BEAT +0.8pp · IP BEAT +0.8pp'},
 {date:'2026-08-31',ccy:'EUR',test:/Germany Preliminary CPI/i,previous:'2.8% y/y',forecast:'3.0% y/y',actual:'2.9% y/y',verdict:'MISS',detail:'MISS -0.1pp vs forecast'},
 {date:'2026-09-01',ccy:'SEK',test:/Manufacturing PMI/i,previous:'55.7',forecast:'55.1',actual:'56.1',verdict:'BEAT',detail:'BEAT +1.0 vs forecast'},
 {date:'2026-09-01',ccy:'GBP',test:/UK Manufacturing PMI/i,previous:'51.9',forecast:'51.5',actual:'51.7',verdict:'BEAT',detail:'BEAT +0.2 vs forecast'},
 {date:'2026-09-01',ccy:'EUR',test:/Euro Area Flash CPI/i,previous:'Headline 2.9% · Core 2.5%',forecast:'Headline 3.3% · Core 2.5%',actual:'Headline 3.3% · Core 2.4%',verdict:'MIXED',detail:'Headline NEUTRAL · Core MISS -0.1pp'},
 {date:'2026-09-01',ccy:'EUR',test:/Euro Area Unemployment/i,previous:'6.4%',forecast:'6.3%',actual:'6.4%',verdict:'MISS',detail:'MISS +0.1pp unemployment'},
 {date:'2026-09-01',ccy:'USD',test:/ISM Manufacturing.*JOLTS/i,previous:'ISM 55.6 · JOLTS 7.182M rev.',forecast:'ISM 55.2 · JOLTS 7.300M',actual:'ISM 54.6 · JOLTS 7.271M',verdict:'MISS',detail:'ISM MISS -0.6 · JOLTS MISS -0.029M'}
];
function calendarMacroHistory(){try{return JSON.parse(localStorage.getItem(CAL_MACRO_STORE)||'[]')}catch(e){return[]}}
function saveCalendarMacro(items){try{let all=[...(items||[]),...calendarMacroHistory()],seen=new Set(),out=[];for(const u of all){let k=[u.date,u.ccy,u.event,u.actual].join('|');if(seen.has(k))continue;seen.add(k);out.push(u)}localStorage.setItem(CAL_MACRO_STORE,JSON.stringify(out.slice(0,240)))}catch(e){}}
function allCalendarMacro(){let all=[...(newsData.macroUpdates||[]),...calendarMacroHistory()],seen=new Set();return all.filter(u=>{let k=[u.date,u.ccy,u.event,u.actual].join('|');if(seen.has(k))return false;seen.add(k);return true})}
function skopjeDate(v){let d=new Date(v);if(!isFinite(d))return'';let q=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Skopje',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),m={};q.forEach(z=>m[z.type]=z.value);return `${m.year}-${m.month}-${m.day}`}
function skopjeTime(v,seconds=false){if(!v)return'';let d=new Date(v);if(!isFinite(d))return String(v).replace(/\s*(GMT|UTC)$/i,'');return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Skopje',hour:'2-digit',minute:'2-digit',second:seconds?'2-digit':undefined,hour12:false}).format(d)+' Skopje'}
function calendarEventMatch(cal,u){let a=String(cal||'').toLowerCase(),b=[u.event,u.kind,u.headline].join(' ').toLowerCase();let rules=[[/nonfarm|payroll|\bnfp\b/,/nonfarm|payroll|\bnfp\b/],[/unemployment/,/unemployment/],[/cpi|hicp|inflation/,/cpi|hicp|inflation/],[/ism manufacturing/,/ism.*manufacturing|manufacturing.*ism/],[/jolts/,/jolts|job openings/],[/retail sales/,/retail sales/],[/industrial production/,/industrial production/],[/manufacturing pmi/,/manufacturing pmi/],[/services pmi/,/services pmi/],[/\bgdp\b/,/\bgdp\b/],[/rate decision|ocr|cash rate|bank rate/,/rate decision|interest rate|policy rate|ocr|cash rate|bank rate/]];return rules.some(([ra,rb])=>ra.test(a)&&rb.test(b))}
function calendarHits(x){return allCalendarMacro().filter(u=>u.ccy===x[2]&&skopjeDate(u.date)===x[0]&&calendarEventMatch(x[3],u)).sort((a,b)=>new Date(a.date)-new Date(b.date))}
function calendarOverride(x){return CAL_RESULT_OVERRIDES.find(o=>o.date===x[0]&&o.ccy===x[2]&&o.test.test(x[3]))||null}
function verdictClass(v){return /BEAT/.test(v)?'good':/MISS/.test(v)?'bad':'warn'}
function calendar(){let rows=[...STATIC_CAL].sort((a,b)=>(a[0]+a[1]).localeCompare(b[0]+b[1]));let sev=x=>String(x).replace(/[^A-Z]/g,'');$('#calendar').innerHTML=`<div class="card"><div class="call"><b>Times: Europe/Skopje / Belgrade.</b> Passed releases are locked as <b>RELEASED</b>. Future structured FinancialJuice results can update this table automatically and feed the G10 catalyst layer.</div><div style="overflow:auto"><div class="calrow head" style="grid-template-columns:78px 50px 55px minmax(210px,1.35fr) 120px 120px minmax(210px,1.2fr) minmax(250px,1.3fr)"><div>Date</div><div>Time</div><div>CCY</div><div>Event</div><div>Previous</div><div>Forecast</div><div>Last Update</div><div>TradingLab Trigger</div></div>${rows.map(x=>{let ov=calendarOverride(x),hits=calendarHits(x),live=hits.length?hits[hits.length-1]:null,released=!!ov||!!live;let prev=ov?ov.previous:x[4],fc=ov?ov.forecast:x[5],last='';if(ov)last=`<b>${esc(ov.actual)}</b><div class="${verdictClass(ov.verdict)}" style="margin-top:3px;font-weight:900">${esc(ov.verdict)} · ${esc(ov.detail)}</div>`;else if(live)last=`<b>${esc(live.actual)}</b><div class="${verdictClass(live.result)}" style="margin-top:3px;font-weight:900">${esc(live.result)}</div>`;else last='<span class="tag gray">PENDING</span>';return `<div class="calrow" style="grid-template-columns:78px 50px 55px minmax(210px,1.35fr) 120px 120px minmax(210px,1.2fr) minmax(250px,1.3fr)"><div class="caldate">${esc(x[0].slice(5))}</div><div>${esc(x[1])}</div><div><b>${esc(x[2])}</b><br><span class="severity ${sev(x[7])}">${esc(x[7])}</span></div><div><b>${esc(x[3])}</b><div class="mini" style="margin-top:4px">${released?'<span class="tag green">RELEASED</span>':'<span class="tag gray">PENDING</span>'}</div><div class="mini">${esc(x[8])}</div></div><div>${esc(prev)}</div><div>${esc(fc)}</div><div class="trigger">${last}</div><div class="trigger">${esc(x[9])}</div></div>`}).join('')}</div></div>`}'''

# Replace existing calendar helper block regardless of whether it was already patched.
pattern=r"const CAL_MACRO_STORE='tl_calendar_macro_v1';.*?\nfunction live\(\)"
if re.search(pattern,s,re.S):
    s=re.sub(pattern,block+'\nfunction live()',s,count=1,flags=re.S)
else:
    # Fallback for an older build: replace only the calendar function and prepend helpers.
    m=re.search(r'function calendar\(\)\{.*?\}\nfunction live\(\)',s,re.S)
    if not m: raise SystemExit('calendar patch target not found')
    s=s[:m.start()]+block+'\nfunction live()'+s[m.end():]

# Ensure new live FinancialJuice macro data persists for calendar matching.
needle="newsData={financialjuice:d.items||d.financialjuice||[],macroUpdates:d.macroUpdates||[],reuters:d.reuters||[],reutersConfigured:!!d.reutersConfigured};"
if needle in s and 'saveCalendarMacro(newsData.macroUpdates);newsMode=' not in s:
    s=s.replace(needle,needle+'saveCalendarMacro(newsData.macroUpdates);',1)

# Convert news timestamps, last sync and header clock to Europe/Skopje.
s=re.sub(r"tm=esc\(x\.time\|\|x\.pubDate\|\|''\)","tm=esc(skopjeTime(x.time||x.pubDate||''))",s)
s=s.replace("$('#lastSync').textContent='Last sync: '+new Date().toLocaleTimeString();",
            "$('#lastSync').textContent='Last sync: '+new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Skopje',hour12:false})+' Skopje';")
s=s.replace("new Date().toLocaleString([], {dateStyle:'medium',timeStyle:'medium'})",
            "new Date().toLocaleString('en-GB',{timeZone:'Europe/Skopje',dateStyle:'medium',timeStyle:'medium'})+' · Skopje/Belgrade'")

p.write_text(s)
print('Skopje timezone + released calendar status enabled')
