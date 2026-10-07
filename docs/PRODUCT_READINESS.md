# TradingLab Terminal — product readiness audit

Inspected production and main branch on 7 October 2026. Original commit: 0e32dc2.

## Verified defects and shipped work

- Economic calendar was serving a fixed-week fallback, not a working live release provider.
- Production has no configured environment variables, including TRADING_ECONOMICS_KEY.
- Rates API returned 0/10 live banks because bold Markdown around numbers broke parsing.
- `/api/health` returned `ok: true` without checking providers. Deep health now reports data readiness separately from process liveness. Scheduled smoke tests fail on unavailable feeds and overdue numeric releases.
- Static overrides were assigned a new `lastUpdate` on each request. Their source timestamp is now unknown, not the check time.
- Two monthly observations could be counted as quarterly coverage. Frequency inference was corrected.
- JSON null probabilities were coerced to zero. Missing values now stay missing. Old browser snapshots use a new storage namespace; failed feeds cannot display old prices as current.
- New `/economic-data.html`: category sidebar, currency and period selection, exact series selector, result bars, consensus markers, previous-period revision markers, accessible per-release details, source links, ledger and CSV export.
- `/api/economic` uses a server-only provider key and explicit unavailable responses. Existing observations are retained separately as an unaudited archive, not silently used as live data.
- Calendar supports a connected Trading Economics provider for all G10, retaining reference dates and real source update timestamps. Numeric surprise and market interpretation remain separate concepts.

## Data contracts

`releaseDate`: publication time, UTC; `reference`/`referenceDate`: period covered.
`checkedAt`: request check time; `sourceUpdatedAt`: source's update time; never substitute one for another.
`Actual`: current release; `Forecast`: survey consensus; `Previous`: previous period after revision; `Revised`: previous period before revision. Revised is NOT the current observation's revised actual.

Each economic series is selected by its exact event name so GDP q/q, GDP y/y, preliminary/final releases, national and Euro Area series are not silently mixed. For the archive, unavailable consensus and release dates stay null. Archive series require a full source audit before commercial use.

## Current launch blockers

1. Connect a supported economic data subscription with permission for the intended public/commercial use. Configure TRADING_ECONOMICS_KEY in Vercel production, directly in the dashboard; never commit or paste secrets in chat. Test entitlements for all G10 and one-year release histories.
2. Provision a durable database and provider ingestion path. Current economic endpoint queries the provider on demand; its memory cache is only an optimization, not persistent history or a 24/7 collector. Closed-browser ingestion, idempotent writes, revisions, provider cursor recovery and shared snapshots are not implemented yet.
3. Audit the 207 inherited observations and the hard-coded macro rankings, central bank rates, meeting dates, calendar overrides and weekly narrative. These are not verified automatically by the new page.
4. Rates still use a third-party HTML/Markdown adapter. Parsing is now tested, timestamped and fails visibly. This does not constitute a contractual real-time market-data service; unsupported banks stay unavailable.
5. Market and news sources need availability/redistribution review and supported contracts before selling access. No market-data or news license was procured in this change.
6. Build public-product access, subscription/billing if needed, account isolation, uptime objectives, alert routing and a measured reliability soak. No paid integrations have been purchased.

## Required acceptance evidence for public launch

- Every advertised series has the advertised historical coverage with release dates, units, source URLs and reference periods.
- Actual values and revisions agree with official releases. Consensus is clearly distinguished from provider models.
- No live badges on archived values. No invented probabilities or forced currency conclusions.
- Shared persistent history survives cold starts, browser changes and deployments.
- Provider outage, missing consensus, revised release, timezone/DST changes and duplicate IDs are tested.
- Mobile and desktop interactions, keyboard navigation, exports and signed-in flows verified.
- Live data readiness remains healthy through a measured monitoring period; HTTP health alone is insufficient.

This release is a tested research interface and reliability correction. It is not yet a fully automatic commercial terminal or a Bloomberg-equivalent service.

## Verification

`node --test tests/data-quality.test.mjs`

`/api/health`: liveness. `/api/health?deep=1`: readiness by service.

Provider schema: https://docs.tradingeconomics.com/economic_calendar/schema/
Historical calendar: https://docs.tradingeconomics.com/economic_calendar/point-in-time/
