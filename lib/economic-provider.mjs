export const COUNTRIES = {USD:'United States',EUR:'Euro Area',GBP:'United Kingdom',JPY:'Japan',CHF:'Switzerland',CAD:'Canada',AUD:'Australia',NZD:'New Zealand',SEK:'Sweden',NOK:'Norway'};
export function numeric(value) {
  if(value==null||String(value).trim()==='')return null;
  const m=String(value).replace(/,/g,'').trim().match(/^([-+]?\d+(?:\.\d+)?)\s*([KMBT])?\s*%?$/i);
  return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[m[2]?.toUpperCase()]||1):null;
}
export function utc(value){if(!value)return null;const v=String(value),d=new Date(/(?:Z|[+-]\d\d:\d\d)$/i.test(v)?v:v+'Z');return Number.isFinite(+d)?d.toISOString():null;}
export function normalizeRelease(x) {
 const date=utc(x.Date);if(!date)return null;
 const actual=numeric(x.Actual),forecast=numeric(x.Forecast),previous=numeric(x.Previous),priorBeforeRevision=numeric(x.Revised);
 return {id:String(x.CalendarId??x.CalendarID??[x.Country,x.Event,date].join('|')),country:x.Country,event:x.Event||x.Category,category:x.Category||x.Event,releaseDate:date,reference:x.Reference||null,referenceDate:utc(x.ReferenceDate),actual,forecast,previous,priorBeforeRevision,rawActual:x.Actual??null,rawForecast:x.Forecast??null,rawPrevious:x.Previous??null,rawPriorBeforeRevision:x.Revised??null,unit:x.Unit||'',source:x.Source||'Trading Economics',sourceUrl:x.SourceURL||null,sourceUpdatedAt:utc(x.LastUpdate),importance:Number(x.Importance)||1,frequency:/q\/q|quarter|gdp growth rate/i.test(x.Event||'')?'quarterly':/claims/i.test(x.Event||'')?'weekly':'monthly',surprise:actual===null||forecast===null?null:actual-forecast};
}
export async function fetchEconomicCalendar(countries,from,to,key) {
 const url='https://api.tradingeconomics.com/calendar/country/'+countries.map(encodeURIComponent).join(',')+'/'+from+'/'+to+'?c='+encodeURIComponent(key)+'&f=json';
 const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Economic provider returned HTTP '+response.status);
 const raw=await response.json();if(!Array.isArray(raw))throw new Error('Invalid economic provider response');
 return raw.map(normalizeRelease).filter(Boolean).sort((a,b)=>a.releaseDate.localeCompare(b.releaseDate));
}
