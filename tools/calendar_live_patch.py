from pathlib import Path

p = Path('index.html')
s = p.read_text()

# Keep the existing live calendar/history implementation intact. This patch is
# deliberately idempotent: older automation used to rewrite the entire calendar
# block and could re-introduce stale hard-coded releases.
s = s.replace(
    "Updated 1 Sep 2026 · 17:52 · Week of 31 Aug–4 Sep",
    "Updated 1 Sep 2026 · 17:52 Skopje · Week of 31 Aug–4 Sep"
)
s = s.replace(
    "$('#lastSync').textContent='Last sync: '+new Date().toLocaleTimeString();",
    "$('#lastSync').textContent='Last sync: '+new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Skopje',hour12:false})+' Skopje';"
)
s = s.replace(
    "new Date().toLocaleString([], {dateStyle:'medium',timeStyle:'medium'})",
    "new Date().toLocaleString('en-GB',{timeZone:'Europe/Skopje',dateStyle:'medium',timeStyle:'medium'})+' · Skopje/Belgrade'"
)

needle = "newsData={financialjuice:fj,macroUpdates:mu,reuters:d.reuters||[],reutersConfigured:!!d.reutersConfigured};"
if needle in s and "saveNewsCache(newsData);saveCalendarMacro(newsData.macroUpdates);" not in s:
    s = s.replace(needle, needle + "saveCalendarMacro(newsData.macroUpdates);", 1)

p.write_text(s)
print('Calendar automation kept live and idempotent; no stale override block rewrite')
