from pathlib import Path

p=Path('index.html')
s=p.read_text()

repls={
'"rate":"2.50%","lastDecision":"Hike · Jul","cb":"HAWKISH","cbTone":"green","next":"2 Sep: +25bp to 2.75% expected"':'"rate":"2.75%","lastDecision":"Hike +25bp · 2 Sep","cb":"HAWKISH / DATA-DEPENDENT","cbTone":"green","next":"28 Oct · further hike remains possible but path is not pre-determined"',
'"weekly":"RBNZ on Wednesday is the binary event. A 25bp hike is expected; the FX reaction depends on guidance. A dovish hike can become sell-the-news because labor is weak."':'"weekly":"RBNZ delivered +25bp to 2.75%. The Bank still sees possible further tightening, but stressed that the path is not pre-determined and medium-term inflation indicators remain consistent with a return to target. NZD stays bullish, but weak labour keeps conviction below AUD/JPY."',
'"invalidate":"No hike / dovish hike + explicit concern about labor slack and growth."':'"invalidate":"RBNZ shifts from gradual tightening to a clear pause/easing bias + labour slack worsens materially."',
'"why":"NZD is bullish mainly because inflation is high and the RBNZ is expected to tighten again. The 5.6% unemployment rate prevents this from being a high-conviction broad-macro long."':'"why":"NZD remains bullish because headline inflation is high and the RBNZ has already lifted the OCR to 2.75%, with further tightening still possible. The 5.6% unemployment rate and explicitly data-dependent guidance keep this below the top tier."',
'"lastDecision":"Hold · 15 Jul","cb":"NEUTRAL","cbTone":"blue","next":"Hold remains base case"':'"lastDecision":"Hold · 2 Sep","cb":"NEUTRAL","cbTone":"blue","next":"28 Oct · hold remains base case; labour/trade risks dominate"',
'"weekly":"CAD now carries a labor downside flag. Treat oil and BoC rhetoric as potential offsets, not automatic bullish confirmation."':'"weekly":"BoC held 2.25% on 2 Sep. The subsequent -41.7k August jobs print materially weakened the labour pillar, while trade tensions remain a downside risk. Oil can offset tactically, but CAD conviction is lower than the base growth data alone suggest."',
'"why":"CAD has one of the better real-economy combinations in G10: stronger growth and a large July employment gain. The reason it is below AUD/JPY is that the BoC has little need to tighten with core inflation near target."':'"why":"CAD still has a resilient growth backdrop, but the -41.7k August jobs shock and a neutral BoC at 2.25% materially reduce conviction. It stays mid-table rather than joining the top macro currencies."',
'"weekly":"Wednesday Q2 GDP is the key test. Sticky inflation keeps the RBA hawkish, but another weak growth print would make AUD a stagflation/policy trade rather than a broad-macro long."':'"weekly":"Q2 GDP rose 0.4% q/q and 2.1% y/y: positive but subdued. Sticky underlying inflation keeps the RBA hawkish, while weak labour and softer September consumer sentiment prevent a clean broad-macro upgrade."',
'"next":"Further hike risk remains"':'"next":"Further hike risk remains · growth/labour confirmation still needed"',
'"weekly":"Watch Monday activity data and Wednesday BoJ Takata. With USDJPY near intervention-sensitive levels, policy language and FX intervention risk can dominate normal macro correlations."':'"weekly":"Japan Q2 GDP was revised to +0.4% q/q and BOJ officials have reinforced the case for further tightening. A September hike to 1.25% is heavily expected; policy language and intervention/repatriation risk can still dominate normal macro correlations."',
'"weekly":"Services PMI is secondary. The bigger issue is whether UK activity can stay resilient while labor weakens and markets reduce BoE hike expectations."':'"weekly":"August services PMI stayed expansionary at 52.5 and RICS improved slightly, but Bailey pushed back on the idea that hikes are inevitable. Friday UK GDP is the next decisive GBP growth test; labour remains the weak pillar."',
}

for old,new in repls.items():
    if old in s:
        s=s.replace(old,new,1)
        print('updated:',old[:55])
    else:
        print('not found/already updated:',old[:55])

old_hero="""<div class=\"weekhero\"><div class=\"kicker\">WEEK OF 7–11 SEP 2026</div><h2>ECB + US Inflation Week · Guidance → CPI → 2Y Confirmation</h2><div class=\"mini\" style=\"font-size:12px\">EUR starts with the cleanest broad macro. USD has repriced sharply higher after PCE + Warsh but still needs Friday labor confirmation. US labor has now materially strengthened the Fed-hike case, but CPI is the deciding confirmation. ECB is Thursday's main EUR catalyst; JPY remains supported by BoJ normalization while CAD labor weakened sharply.</div></div>"""
new_hero="""<div class=\"weekhero\"><div class=\"kicker\">WEEK OF 7–11 SEP 2026 · UPDATED 10 SEP</div><h2>Post-ECB / PPI · Friday CPI + UK GDP are next</h2><div class=\"mini\" style=\"font-size:12px\">EUR remains the cleanest G10 macro after the ECB delivered +25bp and retained tightening optionality. USD stays #2 and bullish, but Thursday PPI was mixed enough that Friday CPI and the US2Y reaction remain the decisive confirmation. JPY keeps a strong normalization story; CAD conviction is lower after the August jobs shock; NZD's 2.75% hike is now fully reflected.</div></div>"""
if old_hero in s:
    s=s.replace(old_hero,new_hero,1)
    print('overview hero updated')
else:
    print('overview hero pattern not found')

old_hierarchy="""<div class=\"card s4\"><h3>This Week's Hierarchy</h3><div class=\"call\"><b>1. USD labor</b> · Friday CPI confirms or rejects whether the stronger August labor report can justify a September Fed hike.<br><br><b>2. EUR inflation</b> · Thursday ECB is largely priced; guidance and projections decide the EUR reaction.<br><br><b>3. RBNZ</b> · Wednesday guidance matters more than the expected hike.<br><br><b>4. AUD GDP</b> · separates broad strength from stagflation.<br><br><b>5. BoC</b> · Wednesday hold is expected; guidance decides whether strong GDP/jobs matter for policy.<br><br><b>6. JPY policy / intervention</b> · BoJ + FX risk can override data.</div></div>"""
new_hierarchy="""<div class=\"card s4\"><h3>From Here · Priority</h3><div class=\"call\"><b>1. USD CPI · Friday</b> · core composition + US2Y decide whether the September Fed-hike repricing is validated.<br><br><b>2. UK GDP · Friday</b> · the cleanest near-term test for GBP while labour weakens and Bailey stays cautious.<br><br><b>3. EUR post-ECB follow-through</b> · watch front-end rates and whether markets keep further-hike optionality priced.<br><br><b>4. JPY / BoJ</b> · September hike expectations remain strong; policy/intervention risk can dominate spot FX.<br><br><b>5. CAD labour + trade</b> · weak August jobs reduce confidence despite resilient growth.<br><br><b>6. AUD / NZD policy divergence</b> · both remain inflation-supported, but growth/labour quality determines relative strength.</div></div>"""
if old_hierarchy in s:
    s=s.replace(old_hierarchy,new_hierarchy,1)
    print('overview hierarchy updated')
else:
    print('overview hierarchy pattern not found')

p.write_text(s)
