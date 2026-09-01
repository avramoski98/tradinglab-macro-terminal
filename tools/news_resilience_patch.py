from pathlib import Path
import re

# ---- Browser: preserve last good FinancialJuice payload ----
p=Path('index.html')
s=p.read_text()

old="""function detectFJMacro(items){let seen={};try{seen=JSON.parse(localStorage.getItem('tl_fj_seen')||'{}')}catch(e){};let changed=false;for(const x of items||[]){if(!x.macro)continue;let key=x.guid||x.link||x.url||x.title;if(seen[key])continue;seen[key]=1;changed=true;let m=x.macro,body=`${m.ccy} ${m.event}: ${m.actual} vs ${m.forecast} · ${m.result} · live value ${Number(m.score)>0?'+':''}${Number(m.score||0).toFixed(1)}`;showToast(x.highImpact?'HIGH-IMPACT MACRO':'MACRO RELEASE',body,x.highImpact?'release-alert':'result-alert');browserNotify('TradingLab · Macro Catalyst',body,key)}if(changed)localStorage.setItem('tl_fj_seen',JSON.stringify(seen))}
async function loadNews(manual=false){try{let r=await fetch('/api/news',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);let d=await r.json();newsData={financialjuice:d.items||d.financialjuice||[],macroUpdates:d.macroUpdates||[],reuters:d.reuters||[],reutersConfigured:!!d.reutersConfigured};saveCalendarMacro(newsData.macroUpdates);newsMode=d.financialJuiceLive||d.mode==='live'?'live':'degraded';detectFJMacro(newsData.financialjuice);render()}catch(e){newsMode='error';if(manual)showToast('News feed error',String(e.message||e));newsDesk()}}
"""
new="""const NEWS_CACHE_KEY='tl_fj_last_good_v2';
function saveNewsCache(d){try{if(!(d.financialjuice||[]).length)return;localStorage.setItem(NEWS_CACHE_KEY,JSON.stringify({financialjuice:d.financialjuice||[],macroUpdates:d.macroUpdates||[],savedAt:new Date().toISOString()}))}catch(e){}}
function readNewsCache(){try{return JSON.parse(localStorage.getItem(NEWS_CACHE_KEY)||'null')}catch(e){return null}}
function detectFJMacro(items){let seen={};try{seen=JSON.parse(localStorage.getItem('tl_fj_seen')||'{}')}catch(e){};let changed=false;for(const x of items||[]){if(!x.macro)continue;let key=x.guid||x.link||x.url||x.title;if(seen[key])continue;seen[key]=1;changed=true;let m=x.macro,body=`${m.ccy} ${m.event}: ${m.actual} vs ${m.forecast} · ${m.result} · live value ${Number(m.score)>0?'+':''}${Number(m.score||0).toFixed(1)}`;showToast(x.highImpact?'HIGH-IMPACT MACRO':'MACRO RELEASE',body,x.highImpact?'release-alert':'result-alert');browserNotify('TradingLab · Macro Catalyst',body,key)}if(changed)localStorage.setItem('tl_fj_seen',JSON.stringify(seen))}
async function loadNews(manual=false){try{let r=await fetch('/api/news',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);let d=await r.json(),fj=d.items||d.financialjuice||[],mu=d.macroUpdates||[];if(!fj.length)throw new Error('Empty FinancialJuice feed');newsData={financialjuice:fj,macroUpdates:mu,reuters:d.reuters||[],reutersConfigured:!!d.reutersConfigured};saveNewsCache(newsData);saveCalendarMacro(newsData.macroUpdates);newsMode='live';detectFJMacro(newsData.financialjuice);render()}catch(e){let c=readNewsCache();if((!newsData.financialjuice||!newsData.financialjuice.length)&&c&&Array.isArray(c.financialjuice)&&c.financialjuice.length){newsData={...newsData,financialjuice:c.financialjuice,macroUpdates:Array.isArray(c.macroUpdates)?c.macroUpdates:[]}}newsMode=(newsData.financialjuice||[]).length?'cached':'error';if(manual)showToast('News feed retry',String(e.message||e));newsDesk()}}
"""
if old not in s:
    raise SystemExit('index loadNews target not found')
s=s.replace(old,new,1)
s=s.replace("<span class=\"tag ${newsMode==='live'?'green':'amber'}\">${newsMode==='live'?'LIVE':'CONNECTING'}</span>","<span class=\"tag ${newsMode==='live'?'green':newsMode==='cached'?'amber':'red'}\">${newsMode==='live'?'LIVE':newsMode==='cached'?'CACHED · RETRYING':'CONNECTING'}</span>",1)
p.write_text(s)

# ---- Server: never cache an empty/failed FinancialJuice response ----
p=Path('api/news.js')
s=p.read_text()
pattern=r"export default async function handler\(req,res\)\{[\s\S]*$"
new_handler="""export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=180');
  let items=[],reuters=[],errors=[];
  try{items=await fetchRSS(FJ_RSS,{Referer:'https://www.financialjuice.com/home'})}catch(e){errors.push('FinancialJuice: '+String(e.message||e))}
  if(!items.length){
    if(!errors.length)errors.push('FinancialJuice: empty upstream feed');
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({mode:'degraded',financialJuiceLive:false,generatedAt:new Date().toISOString(),items:[],financialjuice:[],macroUpdates:[],reuters:[],reutersConfigured:!!process.env.REUTERS_RSS_URL,errors});
  }
  const reutersUrl=process.env.REUTERS_RSS_URL,reutersToken=process.env.REUTERS_TOKEN;
  if(reutersUrl){try{reuters=await fetchRSS(reutersUrl,reutersToken?{Authorization:`Bearer ${reutersToken}`}:{})}catch(e){errors.push('Reuters: '+String(e.message||e))}}
  let macroUpdates=items.filter(x=>x.macro).map(x=>({...x.macro,headline:x.title,link:x.link}));
  return res.status(200).json({mode:'live',financialJuiceLive:true,generatedAt:new Date().toISOString(),items,financialjuice:items,macroUpdates,reuters,reutersConfigured:!!reutersUrl,errors});
}
"""
s,n=re.subn(pattern,lambda m:new_handler,s,count=1)
if n!=1:
    raise SystemExit('api/news handler target not found')
p.write_text(s)
print('FinancialJuice last-good cache enabled')
