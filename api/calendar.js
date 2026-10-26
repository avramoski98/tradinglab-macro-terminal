
// Source-confirmed releases, added without inventing market consensus.
const VERIFIED_AT='2026-10-24T00:23:53.521Z';
const VERIFIED=[
 // Remaining 5 Oct overdue events: official ANZ release and independently corroborated secondary releases.
 // Keep primary/secondary provenance distinct. No invented consensus figures.
 {day:'2026-10-05',time:'01:00',ccy:'NZD',match:/^ANZ Commodity Prices m\/m(?: ·.*)?$/i,event:'ANZ World Commodity Price Index m/m · Sep',actual:'+0.6%',previous:'-0.4%',forecast:'—',importance:'MED',source:'ANZ New Zealand · Commodity Price Index October 2026 (September reference)',url:'https://www.anz.co.nz/about-us/economic-markets-research/commodity-price-index/',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T06:05:00Z',force:true},
 // Melbourne Institute confirms publication; numeric monthly change corroborated by economic archives.
 {day:'2026-10-05',time:'01:00',ccy:'AUD',match:/^MI Inflation Gauge m\/m(?: ·.*)?$/i,event:'MI Inflation Gauge m/m · Sep',actual:'+0.3%',previous:'+0.5%',forecast:'—',importance:'MED',source:'TradingEconomics reporting Melbourne Institute Sep 2026 Inflation Gauge; original institute confirms 5 Oct release',url:'https://tradingeconomics.com/australia/mi-inflation-gauge-mom',status:'verified-secondary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T06:05:00Z',force:true},
 {day:'2026-10-05',time:'08:15',ccy:'EUR',match:/^Spanish Services PMI(?: ·.*)?$/i,event:'Spain Services PMI · Sep (S&P Global)',actual:'58.3',previous:'57.8',forecast:'—',importance:'MED',source:'Reuters reporting S&P Global Spain Services PMI, 5 Oct 2026',url:'https://www.investing.com/news/economic-indicators/spain-services-growth-accelerates-despite-cost-surge-pmi-shows-4931146',status:'verified-secondary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T06:05:00Z',force:true},
 // UK previous is August final 52.5; September flash 51.7 is not the previous monthly reading.
 {day:'2026-10-05',time:'09:30',ccy:'GBP',match:/^Final Services PMI(?: ·.*)?$/i,event:'Final Services PMI · Sep (S&P Global UK)',actual:'52.1',previous:'52.5',forecast:'—',importance:'MED',source:'CME Econoday / S&P Global final UK Services PMI, 5 Oct 2026',url:'https://www.cmegroup.com/education/events/econoday/674638',status:'verified-secondary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T06:05:00Z',force:true},
 // US previous is August final 56.5; September flash estimate 58.7 is not the previous monthly reading.
 {day:'2026-10-05',time:'15:45',ccy:'USD',match:/^Final Services PMI(?: ·.*)?$/i,event:'Final Services PMI · Sep (S&P Global US)',actual:'58.8',previous:'56.5',forecast:'—',importance:'MED',source:'S&P Global final September 2026 US Services PMI reported by TheStreet and TradingEconomics',url:'https://tradingeconomics.com/united-states/services-pmi/news/589603',status:'verified-secondary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T06:05:00Z',force:true},

 // Official qualitative speech: no numeric actual; publication independently verified.
 {day:'2026-10-05',time:'08:45',ccy:'EUR',match:/^German Buba President Nagel Speaks(?: ·.*)?$/i,event:'Bundesbank President Nagel · Global Precious Metals Conference',actual:'Published',previous:'—',forecast:'—',label:'Official publication',importance:'HIGH',source:'Deutsche Bundesbank · Joachim Nagel keynote, Sorrento, 5 Oct 2026',url:'https://www.bundesbank.de/en/press/speeches/shifting-ground-how-geopolitics-is-reshaping-growth-monetary-policy-and-the-role-of-gold-as-a-reserve-asset-1010452',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-25T05:50:00Z',force:true},

 // 25 Oct audit: independently verified 5–6 Oct releases previously left OVERDUE.
 // Sentix primary survey report confirms a 2.4-point fall from September's 5.1 to 2.7.
 // Consensus forecasts are not source-verified and are deliberately suppressed.
 {day:'2026-10-05',time:'09:30',ccy:'EUR',match:/^Sentix Investor Confidence(?: ·.*)?$/i,event:'Sentix Investor Confidence · Oct (Euro Area)',actual:'2.7',previous:'5.1',forecast:'—',importance:'MED',source:'sentix · October 2026 Economic News, 4 Oct 2026',url:'https://www.sentix.de/index.php/sentix-Economic-News/weltwirtschaft-trotzt-bislang-den-steigenden-zinsen.html',status:'verified-primary',sourcePublishedAt:'2026-10-04',releaseTimeVerified:false,verifiedAt:'2026-10-25T05:40:00Z',force:true},
 // Statistics Canada Daily: August 2026 merchandise trade, seasonally adjusted CAD.
 {day:'2026-10-06',time:'14:30',ccy:'CAD',match:/^Trade Balance(?: ·.*)?$/i,event:'Trade Balance · Aug (merchandise, SA)',actual:'C$4.2B',previous:'C$0.787B',forecast:'—',importance:'MED',source:'Statistics Canada · Canadian international merchandise trade, 6 Oct 2026',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261006/dq261006a-eng.pdf',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:true,verifiedAt:'2026-10-25T05:40:00Z',force:true},
 // Ivey Business School September 2026 seasonally adjusted PMI, 6 Oct release.
 {day:'2026-10-06',time:'16:00',ccy:'CAD',match:/^Ivey PMI(?: ·.*)?$/i,event:'Ivey PMI · Sep (seasonally adjusted)',actual:'58.2',previous:'64.3',forecast:'—',importance:'MED',source:'Ivey Business School · Ivey PMI September 2026',url:'https://iveypmi.uwo.ca/historic-data/',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:true,verifiedAt:'2026-10-25T05:40:00Z',force:true},
 // S&P Global UK Construction PMI: verified through Reuters report of S&P release.
 // Not tagged primary because the original 2026 S&P press release was not retrieved.
 {day:'2026-10-06',time:'10:30',ccy:'GBP',match:/^Construction PMI(?: ·.*)?$/i,event:'Construction PMI · Sep (S&P Global)',actual:'46.1',previous:'44.3',forecast:'—',importance:'MED',source:'Reuters reporting S&P Global UK Construction PMI, 6 Oct 2026',url:'https://www.reuters.com/world/uk/uk-construction-activity-falls-slowest-pace-since-january-2026-10-06/',status:'verified-secondary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:false,verifiedAt:'2026-10-25T05:40:00Z',force:true},

 // September 2026 ISM Services report published 5 Oct 2026: primary-source values.
 // Clear provider-unverified forecasts rather than carrying forward stale consensus.
 {day:'2026-10-05',time:'16:00',ccy:'USD',match:/^ISM (?:Services|Non-Manufacturing)(?: PMI| Index)(?: ·.*)?$/i,event:'ISM Services PMI · Sep',actual:'54.9',previous:'55.4',forecast:'—',importance:'HIGH',source:'Institute for Supply Management · September 2026 Services PMI report, 5 Oct 2026',url:'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/services/september/',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:true,verifiedAt:'2026-10-25T02:43:00Z',force:true},
 {day:'2026-10-05',time:'16:00',ccy:'USD',match:/^ISM (?:Services|Non-Manufacturing) (?:Prices Paid|Prices Index|Prices)(?: ·.*)?$/i,event:'ISM Services Prices Paid · Sep',actual:'74.0',previous:'72.6',forecast:'—',importance:'HIGH',source:'Institute for Supply Management · September 2026 Services PMI report, 5 Oct 2026',url:'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/services/september/',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:true,verifiedAt:'2026-10-25T02:43:00Z',force:true},
 {day:'2026-10-05',time:'16:00',ccy:'USD',match:/^ISM (?:Services|Non-Manufacturing) Employment(?: Index)?(?: ·.*)?$/i,event:'ISM Services Employment Index · Sep',actual:'50.1',previous:'47.8',forecast:'—',importance:'MED',source:'Institute for Supply Management · September 2026 Services PMI report, 5 Oct 2026',url:'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/services/september/',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:true,verifiedAt:'2026-10-25T02:43:00Z',force:true},
 // SNB foreign currency reserves for Sep 2026: CHF 770.476bn (Aug revised CHF 770.074bn).
 // Release on 7 Oct corroborated by ForexFactory, MetaTrader and TradingEconomics.
 // SNB publication calendar confirms an SDDS update on 7 Oct, but the exact figure
 // was not independently extracted from the SNB primary data cube: SECONDARY, not PRIMARY.
 // Keep the market consensus blank rather than reusing the stale fallback.
 {day:'2026-10-07',time:'09:00',ccy:'CHF',match:/^Foreign Currency Reserves(?: ·.*)?$/i,event:'Foreign Currency Reserves · Sep (CHF bn)',actual:'CHF 770.476B',previous:'CHF 770.074B',forecast:'—',importance:'MED',source:'MetaTrader / TradingEconomics reporting SNB Sep 2026 reserves',url:'https://www.metatrader.com/en/economic-calendar/switzerland/foreign-currency-reserves',status:'verified-secondary',sourcePublishedAt:'2026-10-07',releaseTimeVerified:false,verifiedAt:'2026-10-24T23:24:00Z',force:true},
 // October 6 NZIER QSBO: use the seasonally adjusted net balance consistently (40 vs 14), not the unadjusted 43 vs 8.
 // Official NZIER release was 10:00 NZDT on Oct 6 = 01:00 Europe/Skopje on Oct 6.
 {day:'2026-10-06',matchDays:['2026-10-05','2026-10-06'],time:'01:00',dateOverride:'2026-10-06T01:00:00+02:00',ccy:'NZD',match:/^NZIER Business Confidence(?: ·.*)?$/i,event:'NZIER Business Confidence · Q3 (seasonally adjusted)',actual:'+40%',previous:'+14%',forecast:'—',importance:'MED',source:'NZIER · Quarterly Survey of Business Opinion, 6 Oct 2026',url:'https://www.nzier.org.nz/news/nziers-qsbo-shows-a-further-lift-in-business-confidence-despite-soft-activity',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:true,verifiedAt:'2026-10-24T21:15:00Z',force:true},
 // September RICS housing price balance: -32 net balance points, not a 32% house-price decline.
 {day:'2026-10-08',time:'01:00',ccy:'GBP',match:/^RICS Housing Price Balance(?: ·.*)?$/i,event:'RICS Housing Price Balance · Sep (net balance)',actual:'-32%',previous:'-28%',forecast:'—',importance:'MED',source:'RICS · UK Residential Market Survey September 2026',url:'https://www.rics.org/news-insights/uk-residential-survey-september-2026',status:'verified-primary',sourcePublishedAt:'2026-10-08',releaseTimeVerified:false,verifiedAt:'2026-10-24T21:15:00Z',force:true},
 // Official Japan releases previously left OVERDUE: publication confirmed by original authority.
 // BOJ speech is a qualitative publication, not a numerical economic result.
 {day:'2026-10-06',time:'08:35',ccy:'JPY',match:/^BOJ Gov Ueda Speaks$/i,event:'BOJ Governor Ueda Remarks · National Securities Convention',actual:'Published',previous:'—',forecast:'—',label:'Official publication',importance:'HIGH',source:'Bank of Japan · Governor Ueda address, 6 Oct 2026',url:'https://www.boj.or.jp/about/press/koen_2026/ko261006a.htm',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:false,verifiedAt:'2026-10-24T23:00:00Z',force:true},
 // September Economy Watchers current DI, seasonally adjusted: 47.0, August 46.4.
 // Market forecast from the calendar was not independently verified and is intentionally cleared.
 {day:'2026-10-08',time:'07:00',ccy:'JPY',match:/^Eco Watchers Survey: Current$/i,event:'Economy Watchers Survey · Sep Current DI (seasonally adjusted)',actual:'47.0',previous:'46.4',forecast:'—',importance:'MED',source:'Japan Cabinet Office · Economy Watchers Survey, 8 Oct 2026',url:'https://www5.cao.go.jp/keizai3/2026/1008watcher/bassui.html',status:'verified-primary',sourcePublishedAt:'2026-10-08',releaseTimeVerified:false,verifiedAt:'2026-10-24T23:00:00Z',force:true},
 // Official Oct 5–6 releases previously left OVERDUE by the calendar feed. Forecasts are not independently verified.
 {day:'2026-10-05',time:'06:00',ccy:'JPY',match:/^Consumer Confidence(?: ·.*)?$/i,event:'Consumer Confidence · Sep (seasonally adjusted)',actual:'35.4',previous:'35.5',importance:'HIGH',source:'Cabinet Office of Japan · Consumer Confidence Survey, 5 Oct 2026',url:'https://www.esri.cao.go.jp/en/stat/shouhi/shouhi-e.html',status:'verified-primary',sourcePublishedAt:'2026-10-05',releaseTimeVerified:false,verifiedAt:'2026-10-24T18:15:00Z',force:true},
 {day:'2026-10-06',time:'10:00',ccy:'CHF',match:/^Unemployment Rate(?: ·.*)?$/i,event:'Unemployment Rate · Sep (seasonally adjusted)',actual:'3.1%',previous:'3.1%',importance:'MED',source:'Swiss SECO · Labour Market Situation, 6 Oct 2026',url:'https://www.skb.admin.ch/fr/newnsb/Cdju9-o8WGML',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:false,verifiedAt:'2026-10-24T18:15:00Z',force:true},
 {day:'2026-10-06',time:'14:30',ccy:'USD',match:/^Trade Balance(?: ·.*)?$/i,event:'Trade Balance · Aug (goods and services, SA)',actual:'-$105.6B',previous:'-$92.8B',importance:'MED',source:'U.S. Census Bureau / BEA · International Trade, 6 Oct 2026',url:'https://www.census.gov/foreign-trade/Press-Release/ft900/ft900_2608.pdf',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:false,verifiedAt:'2026-10-24T18:15:00Z',force:true},
 // October 6 and 8 overdue releases, verified against national statistical authorities.
 {day:'2026-10-06',time:'08:45',ccy:'EUR',match:/^France Industrial Output m\/m(?: ·.*)?$/i,event:'France Industrial Output m/m · Aug (total industry, SA)',actual:'-0.3%',previous:'-0.6%',importance:'MED',source:'INSEE · Industrial production index, 6 Oct 2026',url:'https://www.insee.fr/en/statistiques/9068858',status:'verified-primary',sourcePublishedAt:'2026-10-06',releaseTimeVerified:false,verifiedAt:'2026-10-24T20:05:00Z',force:true},
 {day:'2026-10-08',time:'01:50',ccy:'JPY',match:/^Current Account(?: ·.*)?$/i,event:'Current Account · Aug (unadjusted, preliminary)',actual:'¥4.062T',previous:'¥2.989T',forecast:'—',importance:'MED',source:'Japan Ministry of Finance · August 2026 Balance of Payments, 8 Oct 2026',url:'https://www.mof.go.jp/policy/international_policy/reference/balance_of_payments/preliminary/pg202608.htm',status:'verified-primary',sourcePublishedAt:'2026-10-08',releaseTimeVerified:false,verifiedAt:'2026-10-24T20:05:00Z',force:true},
 // Census Bureau final August wholesale inventories, released 8 Oct (not the 30 Sep advance estimate).
 {day:'2026-10-08',time:'16:00',ccy:'USD',match:/^Wholesale Inventories m\/m(?: ·.*)?$/i,event:'Wholesale Inventories · Aug (final, seasonally adjusted) m/m',actual:'+0.5%',previous:'+1.4%',forecast:'—',importance:'MED',source:'U.S. Census Bureau · Monthly Wholesale Trade, 8 Oct 2026',url:'https://www.census.gov/wholesale/current/index.html',status:'verified-primary',sourcePublishedAt:'2026-10-08',releaseTimeVerified:false,verifiedAt:'2026-10-24T20:42:00Z',force:true},
 // Qualitative publications: official release verified; not numeric economic actuals or consensus.
 {day:'2026-10-07',time:'20:00',ccy:'USD',match:/^FOMC Meeting Minutes$/i,event:'FOMC Meeting Minutes · Sep 15–16',actual:'Published',label:'Official publication',importance:'HIGH',source:'Federal Reserve Board · 7 Oct 2026',url:'https://www.federalreserve.gov/newsevents/pressreleases/monetary20261007a.htm',status:'verified-primary',sourcePublishedAt:'2026-10-07T18:00:00Z',releaseTimeVerified:true,verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-08',time:'13:30',ccy:'EUR',match:/^ECB Monetary Policy Meeting Accounts$/i,event:'ECB Monetary Policy Accounts · Sep 9–10',actual:'Published',label:'Official publication',importance:'HIGH',source:'European Central Bank · 8 Oct 2026',url:'https://www.ecb.europa.eu/press/accounts/2026/html/ecb.mg261008~a10153d090.en.html',status:'verified-primary',sourcePublishedAt:'2026-10-08',releaseTimeVerified:false,verifiedAt:VERIFIED_AT,force:true},
 // October 23 flash PMI actuals: secondary-verified; consensus remains provider-unverified.
 {day:'2026-10-23',time:'15:45',ccy:'USD',match:/^Flash Manufacturing PMI(?: ·.*)?$/i,event:'Flash Manufacturing PMI · Oct (S&P Global)',actual:'56.0',previous:'55.9',importance:'HIGH',source:'Reuters / S&P Global flash US PMI, 23 Oct 2026',url:'https://www.reuters.com/business/us-business-activity-cools-october-strong-demand-fueling-price-pressures-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'15:45',ccy:'USD',match:/^Flash Services PMI(?: ·.*)?$/i,event:'Flash Services PMI · Oct (S&P Global)',actual:'57.9',previous:'58.8',importance:'HIGH',source:'Reuters / S&P Global flash US PMI, 23 Oct 2026',url:'https://www.reuters.com/business/us-business-activity-cools-october-strong-demand-fueling-price-pressures-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'10:00',ccy:'EUR',match:/^Flash Manufacturing PMI(?: ·.*)?$/i,event:'Flash Manufacturing PMI · Oct (S&P Global)',actual:'52.4',previous:'52.9',importance:'HIGH',source:'Reuters / S&P Global flash Eurozone PMI, 23 Oct 2026',url:'https://www.reuters.com/world/europe/euro-zone-growth-slows-4-month-low-amid-rising-costs-french-turmoil-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'10:00',ccy:'EUR',match:/^Flash Services PMI(?: ·.*)?$/i,event:'Flash Services PMI · Oct (S&P Global)',actual:'51.7',previous:'53.0',importance:'HIGH',source:'Reuters / S&P Global flash Eurozone PMI, 23 Oct 2026',url:'https://www.reuters.com/world/europe/euro-zone-growth-slows-4-month-low-amid-rising-costs-french-turmoil-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'10:30',ccy:'GBP',match:/^Flash Manufacturing PMI(?: ·.*)?$/i,event:'Flash Manufacturing PMI · Oct (S&P Global)',actual:'52.8',previous:'51.9',importance:'HIGH',source:'Reuters / S&P Global flash UK PMI, 23 Oct 2026',url:'https://www.reuters.com/world/uk/uk-businesses-report-strongest-month-since-february-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'10:30',ccy:'GBP',match:/^Flash Services PMI(?: ·.*)?$/i,event:'Flash Services PMI · Oct (S&P Global)',actual:'53.1',previous:'52.1',importance:'HIGH',source:'Reuters / S&P Global flash UK PMI, 23 Oct 2026',url:'https://www.reuters.com/world/uk/uk-businesses-report-strongest-month-since-february-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'09:30',ccy:'EUR',match:/^German Flash Manufacturing PMI(?: ·.*)?$/i,event:'German Flash Manufacturing PMI · Oct (S&P Global)',actual:'54.2',previous:'53.9',importance:'HIGH',source:'Reuters / S&P Global flash Germany PMI, 23 Oct 2026',url:'https://www.reuters.com/world/europe/german-business-activity-growth-softens-october-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'09:30',ccy:'EUR',match:/^German Flash Services PMI(?: ·.*)?$/i,event:'German Flash Services PMI · Oct (S&P Global)',actual:'51.7',previous:'52.9',importance:'HIGH',source:'Reuters / S&P Global flash Germany PMI, 23 Oct 2026',url:'https://www.reuters.com/world/europe/german-business-activity-growth-softens-october-pmi-shows-2026-10-23/',status:'verified-secondary',verifiedAt:VERIFIED_AT,force:true},
 {day:'2026-10-23',time:'08:00',ccy:'GBP',match:/^Retail Sales m\/m(?: ·.*)?$/i,event:'Retail Sales m/m · Sep (volume SA incl fuel)',actual:'-0.4%',previous:'+0.7%',importance:'HIGH',source:'UK Office for National Statistics · Retail sales September 2026, 23 Oct',url:'https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/september2026',status:'verified-primary',verifiedAt:'2026-10-23T23:34:00Z',force:true},
 {day:'2026-10-22',time:'10:00',ccy:'NOK',match:/^Unemployment Rate.*Sep|^LFS Unemployment.*Sep/i,event:'LFS unemployment trend · Sep',actual:'4.6%',previous:'4.6%',importance:'HIGH',source:'Statistics Norway (SSB) · Labour Force Survey, 22 Oct 2026',url:'https://www.ssb.no/arbeid-og-lonn/sysselsetting/statistikk/arbeidskraftundersokelsen/artikler/arbeidsledigheten-pa-4-6-prosent-i-september',status:'verified-primary',verifiedAt:'2026-10-23T17:45:00Z',force:true},
 {day:'2026-10-23',time:'14:30',ccy:'CAD',match:/^Core Retail Sales m\/m$/i,event:'Core Retail Sales m/m · Aug (ex autos & gasoline)',actual:'1.1%',importance:'HIGH',source:'Statistics Canada · The Daily, Retail trade August 2026, 23 Oct',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261023/dq261023a-eng.htm',status:'verified-primary',verifiedAt:'2026-10-25T06:58:33.196Z',force:true},
 {day:'2026-10-23',time:'14:30',ccy:'CAD',match:/^Retail Sales m\/m$/i,event:'Retail Sales m/m · Aug',actual:'1.2%',importance:'HIGH',source:'Statistics Canada · The Daily, Retail trade August 2026, 23 Oct',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261023/dq261023a-eng.htm',status:'verified-primary',verifiedAt:'2026-10-25T06:58:33.196Z',force:true},
 {day:'2026-10-23',time:'16:00',ccy:'USD',match:/Revised UoM Consumer Sentiment|UoM Consumer Sentiment|Michigan Consumer Sentiment/i,event:'Revised UoM Consumer Sentiment · Oct',actual:'48.0',previous:'46.3',importance:'HIGH',source:'FinancialJuice reporting University of Michigan final survey',url:'https://www.financialjuice.com/News/9818952/University-Michigan-Sentiment-Final-Actual-48-Forecast-463-Previous-463.aspx?xy=rss',status:'verified-secondary',verifiedAt:'2026-10-23T14:00:01Z',force:true},
 {day:'2026-10-23',time:'16:00',ccy:'USD',match:/Revised UoM Inflation Expectations|UoM 1-Yr Inflation Expectations/i,event:'Revised UoM 1-Yr Inflation Expectations · Oct',actual:'4.7%',previous:'4.7%',importance:'MED',source:'FinancialJuice reporting University of Michigan final survey',url:'https://www.financialjuice.com/News/9818953/University-Michigan-1-Yr-Inflation-Final-Actual-47-Forecast-47-Previous-47.aspx?xy=rss',status:'verified-secondary',verifiedAt:'2026-10-23T14:00:01Z',force:true},
 {day:'2026-10-19',time:'14:30',ccy:'CAD',match:/^Median CPI y\/y|^CPI[- ]median/i,event:'Median CPI y/y · Sep',actual:'1.9%',previous:'2.0%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.pdf',status:'verified-primary',verifiedAt:'2026-10-23T13:45:00Z',force:true},
 {day:'2026-10-19',time:'14:30',ccy:'CAD',match:/^Trimmed CPI y\/y|^CPI[- ]trim/i,event:'Trimmed CPI y/y · Sep',actual:'1.8%',previous:'1.9%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.pdf',status:'verified-primary',verifiedAt:'2026-10-23T13:45:00Z',force:true},
 {day:'2026-10-23',time:'01:30',ccy:'JPY',match:/^National CPI y\/y|^Headline CPI y\/y|^CPI y\/y/i,event:'National CPI y/y · Sep (2025-base)',actual:'2.1%',previous:'1.9%',importance:'HIGH',source:'Statistics Bureau of Japan',url:'https://www.stat.go.jp/data/cpi/sokuhou/tsuki/pdf/zenkoku.pdf',status:'verified-primary',verifiedAt:'2026-10-23T08:30:00Z',force:true},
 {day:'2026-10-23',time:'01:30',ccy:'JPY',match:/^National Core CPI|^Core CPI excluding fresh food y\/y/i,event:'National Core CPI ex fresh food y/y · Sep',actual:'2.1%',previous:'1.7%',importance:'HIGH',source:'Statistics Bureau of Japan',url:'https://www.stat.go.jp/data/cpi/sokuhou/tsuki/pdf/zenkoku.pdf',status:'verified-primary',verifiedAt:'2026-10-23T08:30:00Z',force:true},
 {day:'2026-10-23',time:'01:30',ccy:'JPY',match:/^Core-Core CPI|^Core CPI excluding fresh food and energy y\/y/i,event:'National CPI ex fresh food & energy y/y · Sep',actual:'2.4%',previous:'1.9%',importance:'HIGH',source:'Statistics Bureau of Japan',url:'https://www.stat.go.jp/data/cpi/sokuhou/tsuki/pdf/zenkoku.pdf',status:'verified-primary',verifiedAt:'2026-10-23T08:30:00Z',force:true},
 {day:'2026-10-19',time:'14:30',ccy:'CAD',match:/^CPI m\/m/i,event:'CPI m/m · Sep (not seasonally adjusted)',actual:'+0.1%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:56:00Z',force:true},
 {day:'2026-10-19',time:'14:30',ccy:'CAD',match:/^CPI y\/y/i,event:'CPI y/y · Sep',actual:'3.1%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:56:00Z',force:true},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/^Unemployment Rate|^LFS Unemployment/i,event:'Unemployment Rate (LFS 3M) · Jun–Aug',actual:'4.7%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/october2026',status:'verified-primary',verifiedAt:'2026-10-23T07:56:00Z',force:true},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/^Average Weekly Earnings|^Regular Pay/i,event:'Average Weekly Earnings (regular) y/y · Jun–Aug',actual:'3.7%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/october2026',status:'verified-primary',verifiedAt:'2026-10-23T07:56:00Z',force:true},
 {day:'2026-10-14',time:'14:30',ccy:'USD',match:/Consumer Price Index|^CPI/i,event:'Consumer Price Index · Sep (headline m/m)',actual:'+0.6%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/cpi_10142026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-14',time:'14:30',ccy:'USD',match:/^Headline CPI y\/y/i,event:'Headline CPI y/y · Sep',actual:'3.7%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/cpi_10142026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-15',time:'14:30',ccy:'USD',match:/Producer Price Index|^PPI/i,event:'Producer Price Index · Sep (final demand m/m)',actual:'+1.3%',importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ppi_10152026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-16',time:'14:30',ccy:'USD',match:/Import and Export Price Indexes|^Import Price/i,event:'Import Price Index m/m · Sep',actual:'+1.1%',importance:'MED',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ximpim_10162026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-16',time:'14:30',ccy:'USD',match:/^Export Price Index/i,event:'Export Price Index m/m · Sep',actual:'+2.2%',importance:'MED',source:'U.S. BLS',url:'https://www.bls.gov/news.release/archives/ximpim_10162026.htm',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-15',time:'02:30',ccy:'AUD',match:/Labour Force|Unemployment Rate/i,event:'Labour Force · Sep (unemployment rate)',actual:'4.7%',importance:'HIGH',source:'Australian Bureau of Statistics',url:'https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/sep-2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'08:00',ccy:'GBP',match:/^CPI y\/y|Consumer Price Index/i,event:'CPI y/y · Sep',actual:'3.5%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'08:00',ccy:'GBP',match:/^Core CPI y\/y/i,event:'Core CPI y/y · Sep',actual:'2.8%',importance:'HIGH',source:'UK ONS',url:'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'23:45',ccy:'NZD',match:/^CPI q\/q|^Quarterly CPI q\/q/i,event:'Quarterly CPI q/q · Q3',actual:'0.7%',importance:'HIGH',source:'Stats NZ',url:'https://www.stats.govt.nz/information-releases/consumers-price-index-september-2026-quarter/',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-21',time:'23:45',ccy:'NZD',match:/^CPI y\/y|^Quarterly CPI y\/y/i,event:'Quarterly CPI y/y · Q3',actual:'3.7%',importance:'HIGH',source:'Stats NZ',url:'https://www.stats.govt.nz/information-releases/consumers-price-index-september-2026-quarter/',status:'verified-primary',verifiedAt:'2026-10-23T07:46:00Z',force:true},
 {day:'2026-10-20',time:'08:00',ccy:'EUR',match:/German PPI m\/m/i,event:'German PPI m/m · Sep',actual:'+1.9%',importance:'HIGH',source:'Destatis',url:'https://www.destatis.de/EN/Press/2026/10/PE26_373_61241.html',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/Average Earnings Index 3m\/y/i,event:'Average Earnings Index 3m/y · Jun–Aug',actual:'3.7%',importance:'HIGH',source:'ONS · total earnings incl. bonuses',url:'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/october2026',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'08:00',ccy:'GBP',match:/^Unemployment Rate$/i,event:'Unemployment Rate · Jun–Aug',actual:'4.7%',importance:'HIGH',source:'ONS',url:'https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'11:00',ccy:'EUR',match:/German ZEW Economic Sentiment/i,event:'German ZEW Economic Sentiment · Oct',actual:'28.1',previous:'34.7',importance:'HIGH',source:'ZEW',url:'https://www.zew.de/en/press/latest-press-releases/declining-economic-expectations',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-20',time:'11:00',ccy:'EUR',match:/^ZEW Economic Sentiment$/i,event:'Euro Area ZEW Economic Sentiment · Oct',actual:'18.5',previous:'25.8',importance:'MED',source:'ZEW',url:'https://www.zew.de/en/press/latest-press-releases/declining-economic-expectations',status:'verified-primary',verifiedAt:'2026-10-20T14:10:00Z'},
 {day:'2026-10-05',time:'10:00',ccy:'EUR',match:/PPI m\/m|Industrial Producer Prices m\/m/i,event:'Euro Area PPI m/m · Aug',actual:'1.9%',previous:'1.6%',importance:'HIGH',source:'Eurostat',url:'https://ec.europa.eu/eurostat/en/web/products-euro-indicators/w/4-05102026-ap',status:'verified-primary',force:true},
 {day:'2026-10-06',time:'08:00',ccy:'EUR',match:/German Factory Orders|New Orders in Manufacturing/i,event:'German Factory Orders m/m · Aug',actual:'-10.6%',previous:'3.2%',importance:'HIGH',source:'Destatis',url:'https://www.destatis.de/EN/Press/2026/10/PE26_354_421.html',status:'verified-primary',force:true},
 {day:'2026-10-08',time:'08:00',ccy:'EUR',match:/German Trade Balance/i,event:'German Trade Balance · Aug',actual:'19.5B',previous:'21.6B',importance:'MED',source:'Destatis / Reuters',url:'https://www.reuters.com/world/china/german-exports-unexpectedly-fall-august-2026-10-08/',status:'verified-secondary'},
 {day:'2026-10-08',time:'14:30',ccy:'USD',match:/Unemployment Claims|Initial Jobless Claims/i,event:'Initial Jobless Claims · week ending 3 Oct',actual:'197K',previous:'199K',importance:'HIGH',source:'U.S. Department of Labor / AP',url:'https://apnews.com/article/7d52b48a5f41e60630d96c7a1711774c',status:'verified-secondary'},
 {day:'2026-10-09',time:'01:30',ccy:'JPY',match:/Household Spending/i,event:'Household Spending y/y · Aug',actual:'-3.1%',previous:'-3.6%',importance:'MED',source:'Statistics Bureau of Japan',url:'https://www.stat.go.jp/data/kakei/sokuhou/tsuki/index.html',status:'verified-primary'},
 {day:'2026-10-09',time:'08:00',ccy:'NOK',match:/^(?:CPI y\/y|Inflation Rate y\/y)/i,event:'CPI y/y · Sep',actual:'3.4%',previous:'3.3%',importance:'HIGH',source:'Statistics Norway',url:'https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen/artikler/cpi-up-3.4-per-cent-last-12-months-0926',status:'verified-primary'},
 {day:'2026-10-09',time:'08:00',ccy:'NOK',match:/CPI-ATE|Core CPI/i,event:'Core CPI-ATE y/y · Sep',actual:'3.0%',previous:'3.0%',importance:'HIGH',source:'Statistics Norway',url:'https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen/artikler/cpi-up-3.4-per-cent-last-12-months-0926',status:'verified-primary'},
 {day:'2026-10-09',time:'10:00',ccy:'EUR',match:/Italian Industrial Production m\/m/i,event:'Italian Industrial Production m/m · Aug',actual:'-1.3%',importance:'MED',source:'Istat',url:'https://www.istat.it/comunicato-stampa/produzione-industriale-agosto-2026/',status:'verified-primary'},
 {day:'2026-10-09',time:'14:30',ccy:'CAD',match:/^Employment Change$/i,event:'Employment Change · Sep',actual:'-68.3K',previous:'-41.7K',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261009/dq261009a-eng.htm',status:'verified-primary'},
 {day:'2026-10-09',time:'14:30',ccy:'CAD',match:/^Unemployment Rate$/i,event:'Unemployment Rate · Sep',actual:'6.5%',previous:'6.4%',importance:'HIGH',source:'Statistics Canada',url:'https://www150.statcan.gc.ca/n1/daily-quotidien/261009/dq261009a-eng.htm',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/Prelim UoM Consumer Sentiment/i,event:'Prelim UoM Consumer Sentiment · Oct',actual:'46.3',previous:'48.1',importance:'HIGH',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/Prelim UoM (?:1-Yr )?Inflation Expectations/i,event:'Prelim UoM 1-Yr Inflation Expectations · Oct',actual:'4.7%',previous:'4.6%',importance:'MED',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'},
 {day:'2026-10-09',time:'16:00',ccy:'USD',match:/UoM 5-Yr Inflation Expectations/i,event:'Prelim UoM 5-Yr Inflation Expectations · Oct',actual:'3.5%',previous:'3.4%',importance:'MED',source:'University of Michigan',url:'https://www.sca.isr.umich.edu/',status:'verified-primary'}
];
const OFFICIAL_UPCOMING=[
 // Verified publisher schedules for 26–28 Oct 2026. US remains on EDT until 1 Nov; Skopje switched to CET on 25 Oct.
 // 26 Oct 10:30 CET = 10:30 Europe/Skopje.
 {date:'2026-10-26T10:30:00+01:00',ccy:'EUR',event:'German Ifo Business Climate · Oct',match:/Ifo Business Climate|German Ifo|GE Ifo/i,importance:'HIGH',source:'ifo Institute · official release schedule 26 Oct 2026 10:30 CET',url:'https://www.ifo.de/umfrage/ifo-geschaeftsklima-deutschland'},
 // 27 Oct 08:30 EDT = 13:30 CET; 10:00 EDT = 15:00 CET.
 {date:'2026-10-27T13:30:00+01:00',ccy:'USD',event:'Durable Goods Orders m/m · Sep',match:/Durable Goods(?: Orders)?|Core Durable Goods/i,importance:'HIGH',source:'U.S. Census Bureau · advance durable goods 27 Oct 2026 08:30 EDT',url:'https://www.census.gov/economic-indicators/calendar-listview.html'},
 {date:'2026-10-27T15:00:00+01:00',ccy:'USD',event:'New Home Sales · Sep',match:/New Home Sales|New Residential Sales/i,importance:'HIGH',source:'U.S. Census Bureau · new residential sales 27 Oct 2026 10:00 EDT',url:'https://www.census.gov/construction/soc/schedule.html'},
 // 28 Oct 08:30 EDT = 13:30 CET.
 {date:'2026-10-28T13:30:00+01:00',ccy:'USD',event:'Advance Goods Trade Balance · Sep',match:/Advance (?:Goods )?Trade Balance|Advance Economic Indicators/i,importance:'HIGH',source:'U.S. Census Bureau · advance economic indicators 28 Oct 2026 08:30 EDT',url:'https://www.census.gov/econ/indicators/release_schedule.html'},
 // UK Parliament (23 Oct notice): Budget statement Wed 28 Oct about 12:30 GMT = 13:30 CET in Skopje. Exact start depends on PMQs.
 {date:'2026-10-28T13:30:00+01:00',ccy:'GBP',event:'UK Budget Statement & OBR Forecast · 2026',match:/Annual Budget Release|Budget Statement|Autumn Budget|UK Budget/i,importance:'EXTREME',approximate:true,source:'UK Parliament · Budget Statement 28 Oct 2026 approximately 12:30 GMT; OBR forecast and Treasury documents after speech',url:'https://www.parliament.uk/business/news/2026/october-2026/budget-statement-wednesday-28-october/'},
 // ABS and BEA official release schedules verified on 25 Oct 2026; do not invent forecasts or actuals.
 // 28 Oct 11:30 AEDT = 28 Oct 01:30 CET.
 {date:'2026-10-28T01:30:00+01:00',ccy:'AUD',event:'CPI y/y · Sep (ABS Australia)',match:/^(?:CPI y\/y|Monthly CPI|Consumer Price Index|Australia CPI)(?: ·.*)?$/i,importance:'HIGH',source:'Australian Bureau of Statistics · CPI 28 Oct 2026 11:30 AEDT',url:'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia'},
 // ABS official calendar: September-quarter import/export prices (29 Oct) and producer prices (30 Oct), both 11:30 AEDT = 01:30 CET.
 // These are scheduled publications only: never infer actuals, forecasts, or a policy surprise.
 {date:'2026-10-29T01:30:00+01:00',ccy:'AUD',event:'International Trade Price Indexes · Sep quarter (ABS Australia)',match:/International Trade Price Indexes|Import Price Index|Export Price Index/i,importance:'MED',source:'Australian Bureau of Statistics · release calendar 29 Oct 2026 11:30 AEDT',url:'https://www.abs.gov.au/release-calendar/future-releases/202610/rcc_economy'},
 {date:'2026-10-30T01:30:00+01:00',ccy:'AUD',event:'Producer Price Indexes · Sep quarter (ABS Australia)',match:/Producer Price Indexes|Producer Price Index|PPI q\/q/i,importance:'MED',source:'Australian Bureau of Statistics · release calendar 30 Oct 2026 11:30 AEDT',url:'https://www.abs.gov.au/release-calendar/future-releases/202610/rcc_economy'},
 // 29 Oct 08:30 EDT = 29 Oct 13:30 CET.
 {date:'2026-10-29T13:30:00+01:00',ccy:'USD',event:'Advance GDP q/q · Q3 (annualized, BEA)',match:/^(?:Advance GDP q\/q|GDP.*Advance|Gross Domestic Product.*Advance)(?: ·.*)?$/i,importance:'HIGH',source:'U.S. Bureau of Economic Analysis · Q3 GDP advance 29 Oct 2026 08:30 ET',url:'https://www.bea.gov/news/schedule'},
 {date:'2026-10-29T13:30:00+01:00',ccy:'USD',event:'Core PCE Price Index m/m · Sep (BEA)',match:/^(?:Core PCE Price Index m\/m|Core PCE|PCE Price Index excluding food and energy)(?: ·.*)?$/i,importance:'HIGH',source:'U.S. Bureau of Economic Analysis · Personal Income and Outlays Sep 2026, 29 Oct 08:30 ET',url:'https://www.bea.gov/news/schedule'},
 {date:'2026-10-28T02:00:00+01:00',ccy:'NZD',event:'RBNZ Official Cash Rate Decision',match:/RBNZ|Official Cash Rate|OCR Decision/i,importance:'EXTREME',source:'Reserve Bank of New Zealand',url:'https://www.rbnz.govt.nz/monetary-policy/about-monetary-policy/the-official-cash-rate'},
 {date:'2026-10-28T14:45:00+01:00',ccy:'CAD',event:'Bank of Canada Rate Decision & Monetary Policy Report',match:/BoC|Bank of Canada.*Rate|Overnight Rate/i,importance:'EXTREME',source:'Bank of Canada',url:'https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/'},
 {date:'2026-10-28T19:00:00+01:00',ccy:'USD',event:'FOMC Rate Decision',match:/FOMC.*Rate|Federal Funds Rate|Fed Rate Decision/i,importance:'EXTREME',source:'Federal Reserve',url:'https://www.federalreserve.gov/newsevents/2026-october.htm'},
 {date:'2026-10-28T19:30:00+01:00',ccy:'USD',event:'FOMC Chair Press Conference',match:/Fed.*Press Conference|FOMC.*Press Conference/i,importance:'HIGH',source:'Federal Reserve',url:'https://www.federalreserve.gov/newsevents/2026-october.htm'},
 {date:'2026-10-29T14:15:00+01:00',ccy:'EUR',event:'ECB Rate Decision',match:/ECB.*Rate|Main Refinancing Rate|Deposit Facility Rate/i,importance:'EXTREME',source:'European Central Bank',url:'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
 {date:'2026-10-29T14:45:00+01:00',ccy:'EUR',event:'ECB Press Conference',match:/ECB.*Press Conference|Lagarde.*Press Conference/i,importance:'HIGH',source:'European Central Bank',url:'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html'},
 {date:'2026-10-30T07:30:00+01:00',ccy:'JPY',event:'BoJ Governor Ueda Press Conference (rate decision & Outlook Report time TBA)',match:/BoJ.*Press Conference|Ueda.*Press Conference/i,importance:'HIGH',source:'Bank of Japan official calendar',url:'https://www.boj.or.jp/about/calendar/index.htm'},
 {date:'2026-10-30T13:30:00+01:00',ccy:'USD',event:'Employment Cost Index · Q3',match:/Employment Cost Index/i,importance:'HIGH',source:'U.S. BLS',url:'https://www.bls.gov/schedule/2026/home.htm'}
];
const rank={LOW:1,MED:2,HIGH:3,EXTREME:4};
export function applyVerifiedReleaseOverlay(payload){
 if(!Array.isArray(payload?.events))return payload;
 const rows=payload.events.map(e=>({...e}));
 const activeDates=new Set(rows.map(e=>String(e.date||'').slice(0,10)));
 for(const o of VERIFIED){
  const matchDays=o.matchDays||[o.day];
  let i=rows.findIndex(e=>e.currency===o.ccy&&matchDays.includes(String(e.date||'').slice(0,10))&&o.match.test(String(e.event||'')));
  const base=i>=0?rows[i]:null;
  if(!base&&!matchDays.some(day=>activeDates.has(day))&&!o.force)continue;
  const record={
   ...(base||{}),date:o.dateOverride||base?.date||o.day+'T'+o.time+':00+02:00',
   sourceDate:o.dateOverride||base?.sourceDate||o.day+'T'+o.time+':00+02:00',
   timeZone:'Europe/Skopje',country:o.ccy,currency:o.ccy,event:o.event,
   actual:o.actual,previous:o.previous??base?.previous??'—',
   forecast:o.forecast??base?.forecast??'—',
   importance:rank[base?.importance]>rank[o.importance]?base.importance:o.importance,
   label:o.label||'Verified actual',impact:'Neutral',releaseState:'released',
   source:o.source,sourceUrl:o.url,verificationStatus:o.status,
   actualVerifiedAt:o.verifiedAt||VERIFIED_AT,lastUpdate:o.sourcePublishedAt||o.verifiedAt||VERIFIED_AT,
   releaseTimeVerified:o.releaseTimeVerified??base?.releaseTimeVerified??null,
   forecastVerificationStatus:'provider-unverified'
  };
  if(i>=0)rows[i]=record;else rows.push(record);
 }
 for(const o of OFFICIAL_UPCOMING){
  const matching=rows.findIndex(e=>e.currency===o.ccy&&String(e.date||'').slice(0,10)===o.date.slice(0,10)&&o.match.test(String(e.event||'')));
  if(matching>=0){
   // ForexFactory has shown 06:30 CET for the BoJ 15:30 JST press conference;
   // 15:30 JST is 07:30 CET after the 25 Oct DST change. Override the feed time.
   if(o.approximate===true){
    // Official day is confirmed; approximate UK Budget start must never appear as an exact release timestamp.
    rows[matching]={...rows[matching],date:o.date,sourceDate:o.date,timeZone:'Europe/Skopje',
     event:o.event,importance:o.importance,source:o.source,sourceUrl:o.url,
     verificationStatus:'official-schedule',releaseTimeVerified:false,label:'Scheduled · approximate time',
     forecastVerificationStatus:'provider-unverified'};
   }
   if(o.ccy==='JPY'&&/Press Conference/i.test(o.event)){
    rows[matching]={...rows[matching],date:o.date,sourceDate:o.date,timeZone:'Europe/Skopje',
     event:o.event,importance:o.importance,source:o.source,sourceUrl:o.url,
     verificationStatus:'official-schedule',releaseTimeVerified:true};
   }
   continue;
  }
  const upcoming=Date.parse(o.date)>Date.now();
  rows.push({date:o.date,sourceDate:o.date,timeZone:'Europe/Skopje',country:o.ccy,currency:o.ccy,event:o.event,
   importance:o.importance,previous:'—',forecast:'—',actual:'—',label:upcoming?(o.approximate?'Scheduled · approximate time':'Scheduled · official'):'OVERDUE · unverified',
   impact:'Neutral',releaseState:upcoming?'scheduled':'overdue',source:o.source,sourceUrl:o.url,
   verificationStatus:'official-schedule',releaseTimeVerified:o.approximate?false:null,lastUpdate:null,forecastVerificationStatus:'provider-unverified'});
 }
 // The fallback archive can contain the same release under a different title.
 // Prefer a source-verified overlay over the manually inherited duplicate.
 // Explicit aliases avoid merging genuinely distinct metrics (e.g. CPI y/y vs core CPI).
 const manualDuplicateAliases=[
  ['AUD',/^TD-MI Inflation Gauge m\/m/i,/^MI Inflation Gauge m\/m/i],
  ['EUR',/^Bundesbank President Nagel Speaks$/i,/^Bundesbank President Nagel ·/i],
  ['GBP',/^UK Final Services PMI/i,/^Final Services PMI · Sep \(S&P Global UK\)/i],
  ['USD',/^S&P Global Services PMI · Sep final/i,/^Final Services PMI · Sep \(S&P Global US\)/i],
  ['EUR',/^French Industrial Production m\/m/i,/^France Industrial Output m\/m/i],
  ['CHF',/^Swiss Unemployment Rate · Sep/i,/^Unemployment Rate · Sep \(seasonally adjusted\)/i],
  ['GBP',/^UK Construction PMI · Sep/i,/^Construction PMI · Sep \(S&P Global\)/i],
  ['CAD',/^Canada Trade Balance · Aug/i,/^Trade Balance · Aug \(merchandise, SA\)/i],
  ['USD',/^US Trade Balance · Aug/i,/^Trade Balance · Aug \(goods and services, SA\)/i]
 ];
 const verifiedRows=rows.filter(e=>/^verified-(primary|secondary)$/.test(e.verificationStatus||''));
 const uniqueRows=rows.filter(e=>{
  if(e.verificationStatus!=='manual-archive')return true;
  return !manualDuplicateAliases.some(([currency,legacy,verified])=>
   e.currency===currency&&legacy.test(String(e.event||''))&&
   verifiedRows.some(v=>v.currency===currency&&v.date===e.date&&verified.test(String(v.event||'')))
  );
 });
 uniqueRows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return {...payload,events:uniqueRows,
  overdue:uniqueRows.filter(e=>e.releaseState==='overdue').length,
  checking:uniqueRows.filter(e=>e.releaseState==='checking').length,
  provider:(payload.provider||'Calendar')+' + official Oct 8–9 release overlay',
  releaseOverlayVerifiedAt:VERIFIED_AT};
}
export default async function handler(req,res){
 const {default:legacyHandler}=await import('../lib/calendar-legacy.mjs');
 const proxy={
  setHeader:(...args)=>res.setHeader(...args),
  status(code){res.status(code);return this;},
  json(payload){return res.json(applyVerifiedReleaseOverlay(payload));}
 };
 return legacyHandler(req,proxy);
}
