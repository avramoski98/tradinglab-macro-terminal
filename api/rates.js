const BANKS = [
  {
    id: 'FED', ccy: 'USD', name: 'Federal Reserve', nextMeeting: '16 Sep 2026',
    current: '3.50–3.75%', currentRate: 3.625, holdRate: '3.50–3.75%', hikeRate: '3.75–4.00%', cutRate: '3.25–3.50%',
    url: 'https://centralbank.watch/federal-reserve/',
    latest: { hike: 57.4, hold: 42.7, cut: 0.0 }, previous: { hike: 55.6, hold: 44.4, cut: 0.0 }
  },
  {
    id: 'ECB', ccy: 'EUR', name: 'European Central Bank', nextMeeting: '29 Oct 2026',
    current: '2.50%', currentRate: 2.50, holdRate: '2.50%', hikeRate: '2.75%', cutRate: '2.25%',
    url: 'https://centralbank.watch/european-central-bank/',
    latest: { hike: 51.0, hold: 49.0, cut: 0.0 }, previous: { hike: 51.0, hold: 49.0, cut: 0.0 }
  },
  {
    id: 'BOJ', ccy: 'JPY', name: 'Bank of Japan', nextMeeting: '17 Sep 2026',
    current: '1.00%', currentRate: 1.00, holdRate: '1.00%', hikeRate: '1.25%', cutRate: '0.75%',
    url: 'https://centralbank.watch/bank-of-japan/',
    latest: { hike: 64.1, hold: 35.9, cut: 0.0 }, previous: { hike: 62.9, hold: 37.2, cut: 0.0 }
  },
  {
    id: 'BOE', ccy: 'GBP', name: 'Bank of England', nextMeeting: '17 Sep 2026',
    current: '3.75%', currentRate: 3.75, holdRate: '3.75%', hikeRate: '4.00%', cutRate: '3.50%',
    url: 'https://centralbank.watch/bank-of-england/',
    latest: { hike: 10.3, hold: 89.7, cut: 0.0 }, previous: { hike: 10.3, hold: 89.7, cut: 0.0 }
  },
  {
    id: 'BOC', ccy: 'CAD', name: 'Bank of Canada', nextMeeting: '28 Oct 2026',
    current: '2.25%', currentRate: 2.25, holdRate: '2.25%', hikeRate: '2.50%', cutRate: '2.00%',
    url: 'https://rateprobability.com/boc',
    latest: { hike: 43.0, hold: 57.0, cut: 0.0 }, previous: { hike: 43.0, hold: 57.0, cut: 0.0 }
  },
  {
    id: 'RBA', ccy: 'AUD', name: 'Reserve Bank of Australia', nextMeeting: '29 Sep 2026',
    current: '4.35%', currentRate: 4.35, holdRate: '4.35%', hikeRate: '4.60%', cutRate: '4.10%',
    url: 'https://centralbank.watch/reserve-bank-of-australia/',
    latest: { hike: 66.0, hold: 34.0, cut: 0.0 }, previous: { hike: 62.0, hold: 38.0, cut: 0.0 }
  },
  {
    id: 'RBNZ', ccy: 'NZD', name: 'Reserve Bank of New Zealand', nextMeeting: '28 Oct 2026',
    current: '2.75%', currentRate: 2.75, holdRate: '2.75%', hikeRate: '3.00%', cutRate: '2.50%',
    url: 'https://centralbank.watch/reserve-bank-of-new-zealand/',
    latest: { hike: 0.0, hold: 88.1, cut: 11.8 }, previous: { hike: 0.0, hold: 96.5, cut: 3.5 }
  },
  {
    id: 'SNB', ccy: 'CHF', name: 'Swiss National Bank', nextMeeting: '24 Sep 2026',
    current: '0.00%', currentRate: 0.00, holdRate: '0.00%', hikeRate: '0.25%', cutRate: '-0.25%',
    url: 'https://centralbank.watch/swiss-national-bank/',
    latest: { hike: 1.0, hold: 99.0, cut: 0.0 }, previous: { hike: 1.0, hold: 99.0, cut: 0.0 }
  }
];

function cleanText(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberAfter(text, pattern) {
  const m = text.match(pattern);
  return m ? Number(m[1]) : NaN;
}

function parseProbabilities(text, fallback) {
  let hike = numberAfter(text, /Rate Hike\s*([0-9]+(?:\.[0-9]+)?)%/i);
  let hold = numberAfter(text, /No Change\s*([0-9]+(?:\.[0-9]+)?)%/i);
  let cut = numberAfter(text, /Rate Cut\s*([0-9]+(?:\.[0-9]+)?)%/i);

  if (![hike, hold, cut].every(Number.isFinite)) {
    const direct = text.match(/(?:next meeting pricing|current market-implied probability of)\s*(?:25bp\s*)?([0-9]+(?:\.[0-9]+)?)%?\s*(HIKE|CUT|NO CHANGE|HOLD)/i);
    if (direct) {
      const p = Number(direct[1]);
      const side = direct[2].toUpperCase();
      if (side.includes('HIKE')) return { hike: p, hold: Math.max(0, 100 - p), cut: 0 };
      if (side.includes('CUT')) return { hike: 0, hold: Math.max(0, 100 - p), cut: p };
      return { hike: 0, hold: p, cut: Math.max(0, 100 - p) };
    }
    return fallback;
  }
  return { hike, hold, cut };
}

function rowsFor(bank, probs, previous) {
  return [
    { rate: bank.cutRate, direction: 'cut', latest: probs.cut, previous: previous.cut },
    { rate: bank.holdRate, direction: 'hold', latest: probs.hold, previous: previous.hold, current: true },
    { rate: bank.hikeRate, direction: 'hike', latest: probs.hike, previous: previous.hike }
  ];
}

async function fetchBank(bank) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  try {
    const r = await fetch(bank.url, {
      headers: { 'User-Agent': 'TradingLabMacroTerminal/2.0', 'Accept': 'text/html,application/xhtml+xml' },
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = cleanText(await r.text());
    const staleEcb=bank.id==='ECB'&&(/September 10, 2026/i.test(text)||/Current Rate:\s*2\.25%/i.test(text));
    return { ...bank, latest: staleEcb?bank.latest:parseProbabilities(text, bank.latest), live: !staleEcb };
  } catch (_) {
    return { ...bank, live: false };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
  const banks = await Promise.all(BANKS.map(fetchBank));
  const cards = banks.map(bank => ({
    id: bank.id,
    ccy: bank.ccy,
    name: bank.name,
    nextMeeting: bank.nextMeeting,
    current: bank.current,
    source: bank.url.includes('rateprobability.com') ? 'RateProbability' : 'CentralBank.Watch',
    live: bank.live,
    probabilities: bank.latest,
    previousProbabilities: bank.previous,
    rows: rowsFor(bank, bank.latest, bank.previous)
  }));

  return res.status(200).json({
    mode: cards.some(x => x.live) ? 'live' : 'fallback',
    snapshot: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Skopje', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
    updatedAt: new Date().toISOString(),
    previousReference: 'Previous stored/reference market snapshot',
    cards
  });
}
