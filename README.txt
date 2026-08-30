TradingLab Royal Live Macro Terminal — 30 Aug 2026

Vercel environment variables:
- TRADING_ECONOMICS_KEY : enables structured live G10 calendar / Actual-Forecast-Previous updates
- REUTERS_RSS_URL       : licensed Reuters Connect/LSEG RSS feed URL
- REUTERS_TOKEN         : optional bearer token if required by your Reuters feed

Live layers:
- FinanceJuice official RSS: refresh ~60s
- Structured macro calendar: refresh ~30s when provider key is connected
- Browser reminders: 15m and 1m before HIGH/VERY HIGH/EXTREME events
- New-release alert: fires when Actual appears or a FinanceJuice Actual/Forecast/Previous macro headline arrives

Browser reminders require the terminal to remain open. True closed-browser push requires a Web Push/PWA backend.


Institutional monitor upgrade (30 Aug): Bloomberg-inspired dense market tape + compact G10 monitor. Market tape values are labeled 28 Aug snapshots unless a live market-price provider is added.
