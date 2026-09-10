from pathlib import Path
import re

p = Path('index.html')
s = p.read_text()


def replace_calendar_row(ccy, event_text, new_row):
    global s
    pat = re.compile(r'\["2026-09-10","[^"]*","' + re.escape(ccy) + r'","' + re.escape(event_text) + r'",.*?\],')
    s, n = pat.subn(new_row + ',', s, count=1)
    print(f'{event_text}:', 'updated' if n else 'not found/already changed')


# Lock already-released Sep 10 events in the static calendar.
replace_calendar_row(
    'GBP', 'UK RICS House Price Balance · Aug',
    '["2026-09-10","01:01","GBP","UK RICS House Price Balance · Aug","-29%","-30%","-28%","MED","Housing sentiment improved slightly and beat consensus.","BEAT +2pp vs forecast · small GBP positive only; Friday GDP remains much more important."]'
)
replace_calendar_row(
    'EUR', 'ECB Rate Decision',
    '["2026-09-10","14:15","EUR","ECB Rate Decision","Deposit 2.25% · MRO 2.40%","Deposit 2.50% · MRO 2.65%","Deposit 2.50% · MRO 2.65%","EXTREME","ECB delivered the expected 25bp hike. The important signal came from persistent inflation risk and higher macro projections.","HAWKISH CONFIRMATION · hike was priced, but guidance/projections keep further tightening optionality alive → EUR positive."]'
)
replace_calendar_row(
    'USD', 'PPI · Aug',
    '["2026-09-10","14:30","USD","PPI · Aug","+0.1% m/m rev. · 4.8% y/y","+0.4% m/m · 5.3% y/y","+0.4% m/m · 5.4% y/y","VERY HIGH","Headline PPI matched m/m consensus but accelerated to 5.4% y/y; energy was the main driver.","MIXED / HAWKISH INFLATION · headline m/m in-line, annual rate hotter. CPI remains the decisive Fed confirmation."]'
)
replace_calendar_row(
    'EUR', 'ECB Press Conference · Lagarde',
    '["2026-09-10","14:45","EUR","ECB Press Conference · Lagarde","—","—","HAWKISH / DATA-DEPENDENT","EXTREME","Lagarde stressed resilient activity and upside inflation risks while retaining meeting-by-meeting optionality.","EUR positive confirmation: no clear pause signal; inflation persistence keeps further hikes possible."]'
)
replace_calendar_row(
    'USD', 'Wholesale Inventories · Jul final',
    '["2026-09-10","16:00","USD","Wholesale Inventories · Jul final","+1.3% advance","+1.2%","+1.3%","MED","July wholesale inventories were confirmed up 1.3% m/m; wholesale sales rose 0.8%.","CONFIRMED · secondary growth/inventory input; do not re-rank USD on this release alone."]'
)

# Add released rows visible in the live calendar but absent from the static weekly desk.
ppi_row = '["2026-09-10","14:30","USD","PPI · Aug","+0.1% m/m rev. · 4.8% y/y","+0.4% m/m · 5.3% y/y","+0.4% m/m · 5.4% y/y","VERY HIGH","Headline PPI matched m/m consensus but accelerated to 5.4% y/y; energy was the main driver.","MIXED / HAWKISH INFLATION · headline m/m in-line, annual rate hotter. CPI remains the decisive Fed confirmation."],'
if '["2026-09-10","14:30","USD","Core PPI · Aug"' not in s:
    addition = (
        '\n["2026-09-10","14:30","USD","Core PPI · Aug","+0.2% m/m","+0.3% m/m","+0.2% m/m","HIGH","Core producer inflation was softer than consensus on the month.","SOFTER CORE · offsets part of the hot annual headline; read together with headline PPI and yields."],'
        '\n["2026-09-10","14:30","USD","Initial Jobless Claims","206K","205K","206K","MED","Claims were essentially unchanged and only 1K above consensus.","NEAR CONSENSUS · no meaningful labor re-rank."],'
    )
    s = s.replace(ppi_row, ppi_row + ''.join(addition), 1)

wholesale_row = '["2026-09-10","16:00","USD","Wholesale Inventories · Jul final","+1.3% advance","+1.2%","+1.3%","MED","July wholesale inventories were confirmed up 1.3% m/m; wholesale sales rose 0.8%.","CONFIRMED · secondary growth/inventory input; do not re-rank USD on this release alone."],'
if '["2026-09-10","16:00","USD","Existing Home Sales · Aug"' not in s:
    home = '\n["2026-09-10","16:00","USD","Existing Home Sales · Aug","4.06M","3.98M","3.98M","MED","Existing-home sales fell 2.0% m/m to a 14-month low, exactly at consensus.","IN LINE / SOFT LEVEL · mild growth drag, but secondary to inflation and Fed pricing."],'
    s = s.replace(wholesale_row, home + wholesale_row, 1)

# Calendar overrides keep passed rows RELEASED even when provider naming differs.
if "date:'2026-09-10',ccy:'GBP',test:/UK RICS" not in s:
    block = """
 {date:'2026-09-10',ccy:'GBP',test:/UK RICS House Price Balance/i,previous:'-29%',forecast:'-30%',actual:'-28%',verdict:'BEAT',detail:'BEAT +2pp vs consensus · small positive only'},
 {date:'2026-09-10',ccy:'EUR',test:/ECB Rate Decision/i,previous:'Deposit 2.25% · MRO 2.40%',forecast:'Deposit 2.50% · MRO 2.65%',actual:'Deposit 2.50% · MRO 2.65%',verdict:'HAWKISH HIKE',detail:'25bp delivered · inflation risks/projections keep tightening optionality alive'},
 {date:'2026-09-10',ccy:'EUR',test:/ECB Press Conference/i,previous:'—',forecast:'—',actual:'Hawkish / data-dependent',verdict:'HAWKISH',detail:'Resilient growth + upside inflation risks · no clear pause signal'},
 {date:'2026-09-10',ccy:'USD',test:/^PPI · Aug$/i,previous:'+0.1% m/m rev. · 4.8% y/y',forecast:'+0.4% m/m · 5.3% y/y',actual:'+0.4% m/m · 5.4% y/y',verdict:'MIXED / HAWKISH',detail:'m/m in-line · y/y +0.1pp above consensus'},
 {date:'2026-09-10',ccy:'USD',test:/Core PPI · Aug/i,previous:'+0.2% m/m',forecast:'+0.3% m/m',actual:'+0.2% m/m',verdict:'MISS / SOFTER',detail:'Core m/m -0.1pp vs consensus'},
 {date:'2026-09-10',ccy:'USD',test:/Initial Jobless Claims/i,previous:'206K',forecast:'205K',actual:'206K',verdict:'NEAR CONSENSUS',detail:'Only 1K above forecast · labor signal unchanged'},
 {date:'2026-09-10',ccy:'USD',test:/Existing Home Sales/i,previous:'4.06M',forecast:'3.98M',actual:'3.98M',verdict:'IN LINE / SOFT',detail:'-2.0% m/m · 14-month low'},
 {date:'2026-09-10',ccy:'USD',test:/Wholesale Inventories/i,previous:'+1.3% advance',forecast:'+1.2%',actual:'+1.3%',verdict:'CONFIRMED',detail:'Unrevised from advance estimate · secondary'},
"""
    s = s.replace('const CAL_RESULT_OVERRIDES=[\n', 'const CAL_RESULT_OVERRIDES=[\n' + block, 1)

# Context-aware catalyst layer: do not over-score secondary releases.
if "event:'PPI y/y · Aug'" not in s:
    catalysts = """
 {date:'2026-09-10T01:01:00+02:00',ccy:'GBP',event:'UK RICS House Price Balance · Aug',kind:'MACRO',actual:'-28%',forecast:'-30%',previous:'-29%',result:'BEAT / SMALL',score:0.5,highImpact:false,why:'Housing sentiment beat consensus slightly, but remains weak and is secondary to Friday GDP.'},
 {date:'2026-09-10T14:15:00+02:00',ccy:'EUR',event:'ECB Rate Decision + Guidance',kind:'RATE',actual:'Deposit 2.50% · MRO 2.65%',forecast:'25bp hike priced',previous:'Deposit 2.25% · MRO 2.40%',result:'HAWKISH CONFIRMATION',score:2.5,highImpact:true,why:'Expected hike was delivered, while inflation risks and the projection/guidance mix kept further tightening optionality alive.'},
 {date:'2026-09-10T14:30:00+02:00',ccy:'USD',event:'Core PPI m/m',kind:'CORE PPI',actual:'0.2%',forecast:'0.3%',previous:'0.2%',result:'SOFTER',score:-0.75,highImpact:true,why:'Core producer inflation undershot consensus on the month.'},
 {date:'2026-09-10T14:30:00+02:00',ccy:'USD',event:'PPI m/m',kind:'PPI',actual:'0.4%',forecast:'0.4%',previous:'0.1% rev.',result:'IN LINE',score:0,highImpact:true,why:'Headline monthly PPI matched consensus.'},
 {date:'2026-09-10T14:30:00+02:00',ccy:'USD',event:'PPI y/y · Aug',kind:'PPI',actual:'5.4%',forecast:'5.3%',previous:'4.8%',result:'HOT',score:2,highImpact:true,why:'Annual producer inflation accelerated above consensus, keeping inflation pressure and Fed hike risk elevated.'},
 {date:'2026-09-10T14:30:00+02:00',ccy:'USD',event:'Unemployment Claims',kind:'CLAIMS',actual:'206K',forecast:'205K',previous:'206K',result:'NEAR CONSENSUS',score:-0.25,highImpact:false,why:'A 1K miss is too small to change the labor narrative.'},
 {date:'2026-09-10T16:00:00+02:00',ccy:'USD',event:'Existing Home Sales · Aug',kind:'MACRO',actual:'3.98M',forecast:'3.98M',previous:'4.06M',result:'IN LINE / SOFT',score:0,highImpact:false,why:'Sales matched consensus but fell 2.0% m/m to a 14-month low.'},
 {date:'2026-09-10T16:00:00+02:00',ccy:'USD',event:'Wholesale Inventories · Jul final',kind:'MACRO',actual:'1.3%',forecast:'1.2%',previous:'1.3% advance',result:'CONFIRMED',score:0,highImpact:false,why:'Inventories were unrevised from the advance estimate; secondary for USD.'},
"""
    s = s.replace('const MANUAL_CATALYSTS=[\n', 'const MANUAL_CATALYSTS=[\n' + catalysts, 1)

# Recognize/match these event aliases on future live releases.
s = s.replace(
    "function catalystKind(ev=''){let s=String(ev).toLowerCase();if(/core.*(cpi|pce)|trimmed mean|median cpi|cpif/.test(s))return'CORE INFLATION';",
    "function catalystKind(ev=''){let s=String(ev).toLowerCase();if(/core.*ppi|producer price.*core/.test(s))return'CORE PPI';if(/\\bppi\\b|producer price/.test(s))return'PPI';if(/core.*(cpi|pce)|trimmed mean|median cpi|cpif/.test(s))return'CORE INFLATION';"
)
s = s.replace(
    "function catalystWeight(kind){return ({'CORE INFLATION':3,'INFLATION':2.5,",
    "function catalystWeight(kind){return ({'CORE PPI':1.75,'PPI':1.5,'CORE INFLATION':3,'INFLATION':2.5,"
)
s = s.replace(
    "[/cpi|hicp|inflation/,/cpi|hicp|inflation/],",
    "[/cpi|hicp|inflation/,/cpi|hicp|inflation/],[/ppi|producer price/,/ppi|producer price/],[/rics|house price balance/,/rics|house price balance/],[/wholesale inventories/,/wholesale inventories/],[/existing home sales/,/existing home sales/],[/ecb press conference|press conference/,/ecb press conference|press conference/],[/monetary policy statement/,/monetary policy statement/],",
    1
)
s = s.replace(
    "|CPI|PCE|payroll|employment|unemployment|wages|GDP|ISM|PMI|central bank|",
    "|CPI|PPI|PCE|payroll|employment|unemployment|wages|GDP|ISM|PMI|central bank|",
    1
)

# Post-event G10 narrative. Base rank stays EUR #1, USD #2; conviction changes today.
s = s.replace('"rate":"2.25% deposit"', '"rate":"2.50% deposit"', 1)
s = s.replace('"lastDecision":"Hold \\u00b7 23 Jul"', '"lastDecision":"Hike +25bp \\u00b7 10 Sep"', 1)
s = s.replace('"next":"10 Sep hike heavily priced; guidance decides follow-through"', '"next":"Post-hike: Oct/Dec optionality stays open; follow inflation, energy and front-end rates"', 1)
s = s.replace('"weekly":"Thursday ECB decision and Lagarde guidance are the key EUR test. The hike itself is largely priced; projections and December optionality decide whether EUR can extend."', '"weekly":"ECB delivered the priced 25bp hike. Lagarde kept a hawkish/data-dependent tone and the inflation-risk mix leaves further tightening optionality open. EUR conviction strengthens, but follow front-end yields for confirmation."', 1)
s = s.replace('"why":"EUR keeps the #1 spot because growth/activity are improving, labour is stable and inflation remains above target while the ECB is leaning toward another hike. Unlike USD, the bullish case is not dependent on one speech or one release."', '"why":"EUR keeps the #1 spot because growth/activity are improving, labour is stable and inflation remains above target. The ECB delivered the September hike and kept further tightening optionality alive, so the policy pillar remains supportive."', 1)
s = s.replace('"next":"Sep hike is a real base-case contender; CPI must confirm"', '"next":"PPI kept hike risk alive; Friday CPI is the decisive confirmation"', 1)
s = s.replace('"weekly":"Friday CPI is the deciding confirmation. Strong labor + sticky inflation + US2Y higher would validate the hike; soft core CPI + lower US2Y would revive the bearish-USD case."', '"weekly":"Thursday PPI was mixed: headline 0.4% m/m in-line, core 0.2% softer, but headline y/y accelerated to 5.4%. USD stays bullish / CPI-dependent; Friday CPI and US2Y reaction decide whether the hawkish repricing becomes durable."', 1)
s = s.replace('"why":"USD jumps from the bottom tier to #2 because inflation and Fed pricing changed materially after PCE and Jackson Hole. It is not #1 because the labor pillar is still weak; the Friday jobs report decides whether the repricing becomes a durable macro trend."', '"why":"USD remains #2 because inflation and Fed pricing have repriced materially and August labor was resilient. Today’s PPI keeps hike risk alive, but the mixed core/headline composition means Friday CPI is still required for a clean confirmation."', 1)

p.write_text(s)
print('Sep 10 releases, matching rules and G10 narrative applied')
