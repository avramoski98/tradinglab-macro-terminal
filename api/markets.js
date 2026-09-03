const MARKET_SYMBOLS = [
  { id: 'DXY', ticker: 'TVC:DXY' },
  { id: 'US2Y', ticker: 'TVC:US02Y', yield: true },
  { id: 'US10Y', ticker: 'TVC:US10Y', yield: true },
  { id: 'VIX', ticker: 'CBOE:VIX' },
  { id: 'XAU', ticker: 'OANDA:XAUUSD' },
  { id: 'WTI', ticker: 'NYMEX:CL1!' }
];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');

  try {
    const upstream = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TradingLabMacroTerminal/2.0'
      },
      body: JSON.stringify({
        symbols: {
          tickers: MARKET_SYMBOLS.map(item => item.ticker),
          query: { types: [] }
        },
        columns: ['close', 'change', 'change_abs']
      })
    });

    if (!upstream.ok) throw new Error(`market provider ${upstream.status}`);

    const payload = await upstream.json();
    const rows = new Map((payload.data || []).map(row => [row.s, row.d || []]));
    const markets = MARKET_SYMBOLS.map(item => {
      const [price, changePercent, changeAbsolute] = rows.get(item.ticker) || [];
      if (![price, changePercent].every(Number.isFinite)) return null;
      return {
        id: item.id,
        price,
        changePercent,
        changeBp: item.yield && Number.isFinite(changeAbsolute) ? changeAbsolute * 100 : null
      };
    }).filter(Boolean);

    if (!markets.length) throw new Error('empty market response');

    return res.status(200).json({
      mode: 'live',
      provider: 'TradingView',
      updatedAt: new Date().toISOString(),
      markets
    });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      mode: 'error',
      updatedAt: new Date().toISOString(),
      markets: [],
      error: String(error?.message || error)
    });
  }
}
