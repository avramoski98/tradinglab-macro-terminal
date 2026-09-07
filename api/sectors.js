const SYMBOLS = [
  { id:'SPY', name:'S&P 500', ticker:'AMEX:SPY', benchmark:true },
  { id:'XLK', name:'Technology', ticker:'AMEX:XLK' },
  { id:'XLF', name:'Financials', ticker:'AMEX:XLF' },
  { id:'XLE', name:'Energy', ticker:'AMEX:XLE' },
  { id:'XLI', name:'Industrials', ticker:'AMEX:XLI' },
  { id:'XLY', name:'Consumer Discretionary', ticker:'AMEX:XLY' },
  { id:'XLP', name:'Consumer Staples', ticker:'AMEX:XLP' },
  { id:'XLV', name:'Health Care', ticker:'AMEX:XLV' },
  { id:'XLU', name:'Utilities', ticker:'AMEX:XLU' },
  { id:'XLB', name:'Materials', ticker:'AMEX:XLB' },
  { id:'XLRE', name:'Real Estate', ticker:'AMEX:XLRE' },
  { id:'XLC', name:'Communication Services', ticker:'AMEX:XLC' }
];

export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');
  try{
    const upstream=await fetch('https://scanner.tradingview.com/global/scan',{
      method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json','User-Agent':'TradingLabMacroTerminal/2.0'},
      body:JSON.stringify({symbols:{tickers:SYMBOLS.map(x=>x.ticker),query:{types:[]}},columns:['close','change','Perf.W','Perf.1M']})
    });
    if(!upstream.ok) throw new Error(`sector provider ${upstream.status}`);
    const payload=await upstream.json();
    const rows=new Map((payload.data||[]).map(r=>[r.s,r.d||[]]));
    const raw=SYMBOLS.map(s=>{const d=rows.get(s.ticker)||[];return {id:s.id,name:s.name,benchmark:!!s.benchmark,price:d[0],d1:d[1],w1:d[2],m1:d[3]};}).filter(x=>Number.isFinite(x.price));
    const spy=raw.find(x=>x.id==='SPY');
    if(!spy) throw new Error('SPY benchmark unavailable');
    const sectors=raw.filter(x=>!x.benchmark).map(x=>({...x,rel1d:Number.isFinite(x.d1)&&Number.isFinite(spy.d1)?x.d1-spy.d1:null,rel1w:Number.isFinite(x.w1)&&Number.isFinite(spy.w1)?x.w1-spy.w1:null,rel1m:Number.isFinite(x.m1)&&Number.isFinite(spy.m1)?x.m1-spy.m1:null}));
    return res.status(200).json({mode:'live',provider:'TradingView',updatedAt:new Date().toISOString(),benchmark:spy,sectors});
  }catch(error){res.setHeader('Cache-Control','no-store');return res.status(503).json({mode:'error',updatedAt:new Date().toISOString(),sectors:[],error:String(error?.message||error)});}
}
