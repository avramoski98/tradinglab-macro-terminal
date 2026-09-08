from pathlib import Path

p = Path('index.html')
s = p.read_text()

old_de = '["2026-09-07","08:00","EUR","Germany Industrial Production · Jul","—","—","—","MED","Checks whether German activity is stabilising ahead of the ECB.","Better activity supports EUR breadth; weak data matters only if rates/guidance soften too."]'
new_de = '["2026-09-07","08:00","EUR","Germany Industrial Production · Jul","0.0% m/m","+0.1% m/m","-1.1% m/m","MED","July industrial production fell unexpectedly; autos were the main drag.","MISS -1.2pp vs forecast · negative EUR activity catalyst, but ECB/rates remain the higher-weight driver."]'
if old_de in s:
    s = s.replace(old_de, new_de, 1)

old_uk = '["2026-09-07","10:30","GBP","UK Construction PMI · Aug","—","—","—","MED","Secondary UK activity check before Friday GDP.","Use as confirmation only; Friday GDP and labor/inflation matter more."]'
new_uk = '["2026-09-04","10:30","GBP","UK Construction PMI · Aug","44.7","45.5","44.3","MED","Construction remained in contraction for a 20th month, led by weak housebuilding.","MISS -1.2 vs forecast · secondary GBP negative; GDP and labor/inflation remain higher-weight."]'
if old_uk in s:
    s = s.replace(old_uk, new_uk, 1)

# Ensure the released Germany row matches its calendar label as well as German wording.
s = s.replace("test:/German Industrial Production/i", "test:/German(?:y)? Industrial Production/i")

p.write_text(s)
print('Sep 7 calendar pending rows corrected')
