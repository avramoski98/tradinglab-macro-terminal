from pathlib import Path

p = Path('index.html')
s = p.read_text()

if "German Industrial Production · Jul" not in s:
    anchor = " {date:'2026-09-01T10:30:00+02:00',ccy:'GBP',event:'UK Manufacturing PMI · final',kind:'MANUFACTURING PMI',actual:'51.7',forecast:'51.5',previous:'51.9',result:'BEAT',score:1.25,highImpact:false,why:'Final manufacturing PMI was slightly stronger than expected; secondary positive GBP activity catalyst.'},"
    add = """
 {date:'2026-09-07T08:00:00+02:00',ccy:'EUR',event:'German Industrial Production · Jul',kind:'INDUSTRIAL PRODUCTION',actual:'-1.1% m/m',forecast:'0.1% m/m',previous:'0.0% m/m',result:'MISS',score:-2.0,highImpact:true,why:'German industrial production unexpectedly contracted, a clear negative activity surprise for EUR.'},
 {date:'2026-09-07T08:00:00+02:00',ccy:'GBP',event:'Lloyds House Price Index · Aug',kind:'HOUSING',actual:'-0.2% m/m',forecast:'0.2% m/m',previous:'-0.1% m/m',result:'MISS',score:-0.5,highImpact:false,why:'UK house prices missed consensus; low-impact GBP growth/housing negative.'},
 {date:'2026-09-07T10:30:00+02:00',ccy:'EUR',event:'Sentix Investor Confidence · Sep',kind:'SENTIMENT',actual:'5.1',forecast:'2.1',previous:'0.9',result:'BEAT',score:1.25,highImpact:false,why:'Investor confidence beat strongly and offset part of the German industrial weakness.'},
 {date:'2026-09-07T11:00:00+02:00',ccy:'EUR',event:'Euro Area Employment Change · Q2 final',kind:'EMPLOYMENT',actual:'0.1% q/q',forecast:'0.1% q/q',previous:'0.1% q/q',result:'NEUTRAL',score:0,highImpact:false,why:'Employment matched consensus and did not materially alter the EUR labor narrative.'},
 {date:'2026-09-07T11:00:00+02:00',ccy:'EUR',event:'Euro Area GDP · Q2 revised',kind:'GDP',actual:'0.6% q/q',forecast:'0.4% q/q',previous:'0.4% q/q',result:'BEAT',score:2.0,highImpact:true,why:'Revised euro-area GDP beat consensus, materially reinforcing the growth side of the EUR thesis.'},"""
    if anchor not in s:
        raise SystemExit('manual catalyst anchor missing')
    s = s.replace(anchor, anchor + add, 1)

if "test:/German Industrial Production/i" not in s:
    anchor = " {date:'2026-09-01',ccy:'GBP',test:/UK Manufacturing PMI/i,previous:'51.9',forecast:'51.5',actual:'51.7',verdict:'BEAT',detail:'BEAT +0.2 vs forecast'},"
    add = """
 {date:'2026-09-07',ccy:'EUR',test:/German Industrial Production/i,previous:'0.0% m/m',forecast:'0.1% m/m',actual:'-1.1% m/m',verdict:'MISS',detail:'MISS -1.2pp vs forecast'},
 {date:'2026-09-07',ccy:'GBP',test:/Lloyds HPI/i,previous:'-0.1% m/m',forecast:'0.2% m/m',actual:'-0.2% m/m',verdict:'MISS',detail:'MISS -0.4pp vs forecast'},
 {date:'2026-09-07',ccy:'EUR',test:/Sentix Investor Confidence/i,previous:'0.9',forecast:'2.1',actual:'5.1',verdict:'BEAT',detail:'BEAT +3.0 vs forecast'},
 {date:'2026-09-07',ccy:'EUR',test:/Final Employment Change/i,previous:'0.1% q/q',forecast:'0.1% q/q',actual:'0.1% q/q',verdict:'NEUTRAL',detail:'IN LINE with forecast'},
 {date:'2026-09-07',ccy:'EUR',test:/Revised GDP q\\/q/i,previous:'0.4% q/q',forecast:'0.4% q/q',actual:'0.6% q/q',verdict:'BEAT',detail:'BEAT +0.2pp vs forecast'},"""
    if anchor not in s:
        raise SystemExit('calendar override anchor missing')
    s = s.replace(anchor, anchor + add, 1)

p.write_text(s)
print('Sep 7 EUR/GBP releases added')
