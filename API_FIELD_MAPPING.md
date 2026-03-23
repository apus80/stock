# AIInvestFlow API 필드 매핑 레퍼런스
> 실제 API 응답 기반 검증 완료 (2026-03-22)
> Base URL: `https://fmp-proxy.aiinvestflow.workers.dev`

---

## ⚠️ 공통 주의사항

- 모든 응답은 `{ timestamp, dataType, ...실제데이터 }` 구조
- **symbol 필요 엔드포인트**: 응답이 `{ timestamp, dataType, symbol, data: { ...필드 } }` 래핑 구조 → 반드시 `.data.필드명` 으로 접근
- **symbol 불필요 엔드포인트**: 응답이 `{ ...필드 }` flat 구조 → 바로 `.필드명` 으로 접근
- `null` vs `undefined` 구분 중요: FMP에서 데이터 없을 때 `None`(파이썬)/`null`(JSON)로 반환
- `OPTIONS.PUT_CALL_RATIO` 는 현재 항상 `null`

---

## 1. /market

**구조**: flat (래핑 없음)

```
KOREA_MARKET.EWY.price                          number
KOREA_MARKET.EWY.changePercentage               number

US_MARKET.SP500.price                           number
US_MARKET.SP500.changePercentage                number
US_MARKET.SP500.volume                          number
US_MARKET.NASDAQ.price                          number
US_MARKET.NASDAQ.changePercentage               number
US_MARKET.NASDAQ.volume                         number
US_MARKET.DOW.price                             number
US_MARKET.DOW.changePercentage                  number
US_MARKET.SOX.price                             number
US_MARKET.SOX.changePercentage                  number
US_MARKET.RUSSELL2000.price                     number
US_MARKET.RUSSELL2000.changePercentage          number
US_MARKET.RUSSELL2000.volume                    number
US_MARKET.VIX.price                             number
US_MARKET.VIX.changePercentage                  number

BONDS.HYG.price                                 number
BONDS.HYG.change                                number   ← changePercentage 아님! change
BONDS.LQD.price                                 number
BONDS.LQD.change                                number   ← changePercentage 아님! change

CRYPTO.BTC.price                                number
CRYPTO.BTC.changePercentage                     number
CRYPTO.ETH.price                                number
CRYPTO.ETH.changePercentage                     number
CRYPTO.SOL.price                                number
CRYPTO.SOL.changePercentage                     number

COMMODITIES.GOLD.price                          number
COMMODITIES.GOLD.changePercentage               number
COMMODITIES.SILVER.price                        number
COMMODITIES.SILVER.changePercentage             number
COMMODITIES.OIL.price                           number
COMMODITIES.OIL.changePercentage                number

FX.USDKRW.price                                 number
FX.USDKRW.changePercentage                      number
FX.USDJPY.price                                 number
FX.USDJPY.changePercentage                      number
FX.EURUSD.price                                 number
FX.EURUSD.changePercentage                      number
FX.DXY.price                                    number
FX.DXY.changePercentage                         null (현재 미제공)

LIQUIDITY.FED_BALANCE                           number  (단위: millions, 예: 6655939)
LIQUIDITY.REVERSE_REPO                          number  (단위: billions, 예: 0.822)
LIQUIDITY.TGA                                   number  (단위: millions, 예: 853052)

RATES.US10Y                                     number
RATES.US2Y                                      number
RATES.YIELD_CURVE                               number  (10Y-2Y spread)

OPTIONS.PUT_CALL_RATIO                          null    (현재 미제공)

SECTORS.TECHNOLOGY.price                        number
SECTORS.TECHNOLOGY.changePercentage             number
SECTORS.FINANCIALS.price                        number
SECTORS.FINANCIALS.changePercentage             number
SECTORS.ENERGY.price                            number
SECTORS.ENERGY.changePercentage                 number
SECTORS.HEALTHCARE.price                        number
SECTORS.HEALTHCARE.changePercentage             number
SECTORS.CONSUMER_DISCRETIONARY.price            number
SECTORS.CONSUMER_DISCRETIONARY.changePercentage number
SECTORS.INDUSTRIALS.price                       number
SECTORS.INDUSTRIALS.changePercentage            number
SECTORS.UTILITIES.price                         number
SECTORS.UTILITIES.changePercentage              number
SECTORS.REAL_ESTATE.price                       number
SECTORS.REAL_ESTATE.changePercentage            number

CREDIT.HIGH_YIELD.price                         number
CREDIT.HIGH_YIELD.changePercentage              number
CREDIT.INVESTMENT_GRADE.price                   number
CREDIT.INVESTMENT_GRADE.changePercentage        number

BREADTH.TOTAL_MARKET.price                      number
BREADTH.TOTAL_MARKET.changePercentage           number
BREADTH.LONG_TREASURY.price                     number
BREADTH.LONG_TREASURY.changePercentage          number

MACRO_BASE.CPI                                  number  (지수값, 예: 327.46)
MACRO_BASE.CPI_YOY                              number  (%, 예: 2.434)
MACRO_BASE.CORE_CPI_YOY                         number
MACRO_BASE.PCE_INFLATION                        number  (지수값)
MACRO_BASE.FED_RATE                             number  (실효금리, 예: 3.64)
MACRO_BASE.INFLATION_EXPECTATION                number  (%, 예: 2.38)
MACRO_BASE.UNEMPLOYMENT                         number  (%, 예: 4.4)
MACRO_BASE.M2                                   number  (millions, 예: 22442100)
MACRO_BASE.REAL_RATES                           number

MACRO_INDICATORS.CONSUMER_SENTIMENT             number
MACRO_INDICATORS.REAL_GDP                       number
MACRO_INDICATORS.INDUSTRIAL_PRODUCTION          number
MACRO_INDICATORS.NONFARM_PAYROLLS               number
MACRO_INDICATORS.PCE_INFLATION                  number
MACRO_INDICATORS.MFG_PMI                        null (현재 미제공)

ECONOMIC_INDICATORS.fedfunds.current            number
ECONOMIC_INDICATORS.fedfunds.prev               number
ECONOMIC_INDICATORS.fedfunds.change             number
ECONOMIC_INDICATORS.cpi.current                 number  (CPI YoY %)
ECONOMIC_INDICATORS.core_cpi.current            number
ECONOMIC_INDICATORS.core_pce.current            number  ← 주의: PCE 지수값(~128), YoY% 아님
ECONOMIC_INDICATORS.payrolls.current            number
ECONOMIC_INDICATORS.unemployment.current        number
ECONOMIC_INDICATORS.us10y.current               number
ECONOMIC_INDICATORS.us2y.current                number
ECONOMIC_INDICATORS.sentiment.current           number
ECONOMIC_INDICATORS.pmi.current                 null (현재 미제공)

MACRO_INDEX.RATES.FED_UPPER                     null
MACRO_INDEX.RATES.FED_LOWER                     null
MACRO_INDEX.RATES.EFFR                          null
MACRO_INDEX.RATES.US10Y                         number
MACRO_INDEX.RATES.US2Y                          number
MACRO_INDEX.RATES.REAL_RATE_10Y                 null
MACRO_INDEX.RATES.MORTGAGE30                    null
MACRO_INDEX.INFLATION.CPI_YOY                   number
MACRO_INDEX.INFLATION.CORE_CPI_YOY              number
MACRO_INDEX.INFLATION.CORE_PCE_YOY              null
MACRO_INDEX.INFLATION.INFLATION_EXPECTATION_1Y  null
MACRO_INDEX.ECONOMY.REAL_GDP                    number
MACRO_INDEX.ECONOMY.UNEMPLOYMENT                number
MACRO_INDEX.ECONOMY.PAYEMS_CHG                  null
MACRO_INDEX.ECONOMY.INDUSTRIAL_PRODUCTION       number
MACRO_INDEX.ECONOMY.MFG_PRODUCTION              null
MACRO_INDEX.ECONOMY.HOUSING_STARTS              null
MACRO_INDEX.ECONOMY.CONSUMER_SENTIMENT          number
MACRO_INDEX.LIQUIDITY.FED_BALANCE               number  (단위: T, 예: 6.655939)  ← /market의 millions와 다름!
MACRO_INDEX.LIQUIDITY.M2_YOY                    null
MACRO_INDEX.LIQUIDITY.DOLLAR_INDEX              null
MACRO_INDEX.LIQUIDITY.REVERSE_REPO              number  (단위: B)
MACRO_INDEX.LIQUIDITY.TGA                       number  (단위: T, 예: 0.853)
MACRO_INDEX.RISK.YIELD_CURVE                    null
MACRO_INDEX.RISK.SAHM_RULE                      null
MACRO_INDEX.RISK.HY_SPREAD                      number
MACRO_INDEX.RISK.CORP_PROFITS_YOY               null
```

---

## 2. /top7

**구조**: `{ data: [ {rank, symbol, price, changePercentage, volume, marketCap}, ... ] }`

```
data[0].rank                                    number
data[0].symbol                                  string
data[0].price                                   number
data[0].changePercentage                        number
data[0].volume                                  number
data[0].marketCap                               number
```

---

## 3. /feargreed

**구조**: flat

```
score                                           number  (0~100)
rating                                          string  (예: "Extreme Fear")
```

---

## 4. /macro

**구조**: flat (래핑 없음, 키명 주의!)

```
fedBal                                          number  (단위: millions, 예: 6655939)  ← FED_BALANCE 아님!
m2                                              number  (단위: billions 환산값, 예: 22442.1)
reverseRepo                                     number  (단위: billions, 예: 0.822)
```

---

## 5. /macroindex

**구조**: `{ SERIES_ID: { value, change, dates: [], values: [] }, ... }`

```
DFEDTARU.value                                  number
DFEDTARL.value                                  number
EFFR.value                                      number
DGS10.value                                     number
DGS2.value                                      number
REAINTRATREARAT10Y.value                        number
MORTGAGE30US.value                              number
CPIAUCSL.value                                  number  (YoY %, 예: 2.434)
CPILFESL.value                                  number  (Core CPI YoY %)  ← PCEPILFE 아님!
PCEPILFE.value                                  number  (Core PCE YoY %, 예: 3.0557)
MICH.value                                      number  (기대인플레, 예: 4)
GDP.value                                       number  (명목GDP billions, 예: 31442)
UNRATE.value                                    number
PAYEMS.value                                    number  (전월비 변화량, 예: -92)  ← 수준값 아님!
INDPRO.value                                    number
IPMAN.value                                     number
HOUST.value                                     number
UMCSENT.value                                   number
WALCL.value                                     number  (단위: T, 예: 6.6559)
```

---

## 6. /stock?symbol=SYM

**구조**: `{ data: { symbol, price, changePercentage, change, volume, timestamp, marketCap } }`

```
data.symbol                                     string
data.price                                      number
data.changePercentage                           number
data.change                                     number
data.volume                                     number
data.marketCap                                  number
```

---

## 7. /alpha?symbol=SYM

**구조**: `{ data: { symbol, explosiveScore, factors:{...}, metrics:{...}, profile:{...} } }`

```
data.symbol                                     string
data.explosiveScore                             number
data.factors.price                              number
data.factors.pe                                 number
data.factors.pb                                 number
data.factors.floatShares                        null (현재 미제공)
data.factors.marketCap                          number
data.factors.revenueGrowth                      number (소수, 예: 0.654 = 65.4%)
data.factors.earningsGrowth                     number (소수)
data.factors.analystScore                       number
data.factors.insiderActivity                    number
data.metrics.momentum                           number
data.metrics.volume                             number
data.profile.company                            string  ← .name 아님! company
data.profile.sector                             string
data.profile.industry                           null (현재 미제공)
```

---

## 8. /alpha/discovery

**구조**: `{ top_20: [...], all_stocks: [...], analyzed, universe_size, execution_time_sec }`

```
top_20[0].symbol                                string
top_20[0].price                                 number
top_20[0].volume                                number
top_20[0].momentum                              number  (%, 예: -0.39)
top_20[0].ma50trend                             number  (%, 예: -5.03)
top_20[0].str52w                                number  (%, 예: 66)
top_20[0].volSurge                              null or number
top_20[0].pe                                    number  (0이면 미제공)
top_20[0].score                                 number
analyzed                                        number
universe_size                                   number
```

---

## 9. /alpha/alpha-scanner

**구조**: `/alpha/discovery`와 동일

```
top_20[0].symbol                                string
top_20[0].score                                 number
top_20[0].momentum                              number
top_20[0].ma50trend                             number
top_20[0].str52w                                number
top_20[0].volSurge                              null or number
top_20[0].pe                                    number
analyzed                                        number
universe_size                                   number
```

---

## 10. /alpha/breakout (POST)

**구조**: `{ timestamp, dataType, universe_size, analyzed, execution_time_sec, top_15: [] }`

```
top_15[0].breakoutScore                         number
top_15[0].signals.highProximity                 number
top_15[0].signals.volumeRatio                   number
top_15[0].signals.momentum                      number
top_15[0].signals.ma50Above                     boolean
top_15[0].signals.goldenCross                   boolean
```

⚠️ `analyzed: 0` / `top_15: []` 인 경우 있음 (실시간 데이터 부족 시)

---

## 11. /analysis/catalyst-surge?symbol=SYM

**구조**: flat (data 래핑 없음)

```
symbol                                          string
css                                             number  (0~100)
css_raw                                         number
grade                                           string  (예: "❌ AVOID")
breakdown.catalyst                              number
breakdown.technical                             number
breakdown.smartMoney                            number
detail.technical.rsi                            number
detail.technical.atr_pct                        number
detail.technical.volumeRatio                    number
detail.technical.isBreakout                     boolean
detail.technical.total                          number
detail.smartMoney.total                         number
detail.catalyst.epsSurprise                     number
detail.catalyst.revGrowth                       number (소수)
detail.catalyst.fcfYield                        number (소수)
detail.catalyst.de                              number
detail.catalyst.total                           number
```

---

## 12. /analysis/catalyst-surge-top5

**구조**: 배열 `[ {symbol, css, css_raw, grade, breakdown:{...}, isBreakout}, ... ]`

```
[0].symbol                                      string
[0].css                                         number
[0].css_raw                                     number
[0].grade                                       string
[0].breakdown.catalyst                          number
[0].breakdown.technical                         number
[0].breakdown.smartMoney                        number
[0].isBreakout                                  boolean
```

⚠️ `detail` 필드 없음 (top5는 breakdown만, 상세 없음)

---

## 13. Analysis 엔드포인트 공통 응답 필드

### /analysis/institutional-score
```
score                                           number
signal                                          string
components                                      array
interpretation                                  string
details.fed                                     number  (T 단위)
details.vix                                     number
details.hyg_lqd_ratio                           string (수치이지만 string으로 반환됨)
details.yield_curve                             number
```

### /analysis/market-regime
```
regime                                          string  ("Risk-On" | "Neutral" | "Risk-Off")
confidence                                      number
signal                                          string
badgeClass                                      string
recommendation                                  string
factors                                         array
details.spy                                     number
details.vix                                     number
details.spy_change                              number
```

### /analysis/liquidity-pulse
```
score                                           number
signal                                          string
components                                      array
interpretation                                  string
details.fed_balance                             number  (T 단위)
details.reverse_repo                            number
```

### /analysis/yield-curve-monitor
```
spread                                          null or number  ← 현재 null 반환 중
inverted                                        boolean
signal                                          string
recession_probability                           number
recommendation                                  string
details.us10y                                   null (현재)
details.us2y                                    null (현재)
```

### /analysis/credit-stress
```
stress_level                                    string
signal                                          string
spread                                          string (수치이지만 string으로 반환됨)
metrics                                         array
recommendation                                  string
```

### /analysis/market-breadth
```
score                                           number
signal                                          string
components                                      array
interpretation                                  string
details.spy_change                              number
details.qqq_change                              number
```

### /analysis/volatility-regime
```
vix                                             number
regime                                          string  ("Low" | "Medium" | "High")
state                                           string  ← regime와 동일값
confidence                                      number
signal                                          string
badgeClass                                      string
factors                                         array
recommendation                                  string
```

### /analysis/sector-rotation
```
top_performers                                  array [{name, change}]
weakest                                         array [{name, change}]
all_sectors                                     array [{name, change}]  ← 위젯에서 사용
items                                           array [{name, value, unit}]
rankings                                        array [{rank, name, w1, m1, y1}]
```

### /analysis/dollar-liquidity
```
dxy                                             number  ← 실제 DXY가 아닌 계산값일 수 있음
signal                                          string
impact                                          string
metrics                                         array
recommendation                                  string
```

### /analysis/crypto-sentiment
```
score                                           number
sentiment_score                                 number  ← score와 동일값
signal                                          string
components                                      array
interpretation                                  string
details.btc                                     number
details.eth                                     number
details.btc_change                              number
details.eth_change                              number
recommendation                                  string
```

### /analysis/smart-money
```
signal                                          string  ("축적" | "분산")
regime                                          string  ("Accumulation" | "Distribution")
state                                           string  ← signal과 동일
confidence                                      number
status                                          string
badgeClass                                      string
factors                                         array
details.spy_volume                              number
details.qqq_volume                              number
recommendation                                  string
```

### /analysis/stock-ranking
```
ranking                                         array [{rank, symbol, price, change, score}]
items                                           array [{name, value, unit}]
rankings                                        array [{rank, name, price, w1, m1, y1, score}]
```

### /analysis/market-heatmap
```
assets                                          array [{name, change, color}]
categories                                      array [{name, 1d, 1w, 1m, 3m, 1y}]
```

### /analysis/real-rate-monitor
```
policy                                          string  ("긴축" | "완화")
signal                                          string
metrics                                         array
interpretation                                  string
recommendation                                  string
```

### /analysis/fed-policy-impact
```
policy_stance                                   string  ("완화" | "긴축")
signal                                          string
components                                      array
interpretation                                  string
impact                                          string
```

### /analysis/labor-market-health
```
score                                           number
trend                                           string
signal                                          string
metrics                                         array
interpretation                                  string
wage_pressure                                   string
```

### /analysis/macro-momentum
```
score                                           number
signal                                          string
components                                      array
regime                                          string
recommendation                                  string
```

---

## 14. Fundamentals (모두 `data` 래핑 구조)

### /fundamentals/earnings?symbol=SYM
```
data.epsActual                                  number
data.epsEstimated                               number
data.revenueActual                              number
data.revenueEstimated                           number
data.reportDate                                 string
```

### /fundamentals/growth?symbol=SYM
```
data.revenueGrowth                              number (소수, 예: 0.654 = 65.4%)
data.netIncomeGrowth                            number (소수)
data.epsGrowth                                  number (소수)
```

### /fundamentals/income?symbol=SYM
```
data.revenue                                    number
data.grossProfit                                number
data.operatingIncome                            number
data.netIncome                                  number
data.eps                                        number
data.ebitda                                     number
data.researchAndDevelopmentExpenses             number
data.sellingGeneralAndAdministrativeExpenses    number
data.incomeBeforeTax                            number
data.weightedAverageShsOut                      number
```

### /fundamentals/balance?symbol=SYM
```
data.cashAndCashEquivalents                     number
data.totalAssets                                number
data.totalCurrentAssets                         number
data.totalLiabilities                           number
data.totalCurrentLiabilities                    number
data.totalStockholdersEquity                    number
data.longTermDebt                               number
data.shortTermDebt                              number
data.inventory                                  number
data.accountPayables                            number
data.netDebt                                    number
data.totalDebt                                  number
```

### /fundamentals/cashflow?symbol=SYM
```
data.operatingCashFlow                          number
data.freeCashFlow                               number
data.capitalExpenditure                         number (음수)
data.netCashProvidedByOperatingActivities       number
data.netCashProvidedByInvestingActivities       number (음수)
data.netCashProvidedByFinancingActivities       number (음수)
data.netDividendsPaid                           number (음수)
data.commonStockRepurchased                     number (음수)
data.stockBasedCompensation                     number
data.netChangeInCash                            number
```

### /fundamentals/ratios?symbol=SYM
```
⚠️ 이중 래핑 주의: { data: { data: { ...필드 } } }

data.data.priceToEarningsRatio                  number  ← pe 아님!
data.data.priceToBookRatio                      number  ← pb 아님!
data.data.pe                                    null (현재 미제공)
data.data.pb                                    null (현재 미제공)
data.data.divYield                              number
```

### /fundamentals/profile?symbol=SYM
```
data.sector                                     string
data.industry                                   string
data.companyName                                string
data.website                                    string
data.description                                string
```

### /fundamentals/shares?symbol=SYM
```
data.floatShares                                number
```

---

## 15. /?series=SERIES_ID (FRED 단일 시리즈)

**구조**: flat `{ timestamp, dataType, series, value }`

```
value                                           number  ← res.data.value 로 접근
series                                          string
```

**31개 시리즈 목록 및 단위**:
```
WALCL        Fed Balance (T)
RRPONTSYD    Reverse Repo (B)
DGS10        10Y국채 (%)
DGS2         2Y국채 (%)
CPIAUCSL     CPI YoY (%)
UNRATE       실업률 (%)
UMCSENT      소비자심리 (index)
GDPC1        실질GDP (B)
INDPRO       산업생산 (index)
PAYEMS       비농업고용 (K, 전월비)
PCEPILFE     근원PCE YoY (%)
WTREGEN      TGA (B)
M2SL         M2 (B)
T10YIE       기대인플레 (%)
FEDFUNDS     Fed금리 (%)
PCEPI        PCE지수 (index)
VIXCLS       VIX
BAMLH0A0HYM2 HY OAS (%)
NAPM         ISM PMI
DFEDTARU     Fed상단 (%)
DFEDTARL     Fed하단 (%)
EFFR         실효금리 (%)
REAINTRATREARAT10Y 실질금리10Y (%)
MORTGAGE30US 모기지30Y (%)
MICH         미시간기대인플레 (%)
IPMAN        제조업생산 (index)
HOUST        주택착공 (K)
DTWEXAFEGS   달러인덱스
T10Y2Y       장단기금리차 (%)
SAHMREALTIME 샴법칙
CP           기업이익
```

---

## /stable/ratios (fetchAllMetricz 내부 사용) — FMP 직접 엔드포인트

> 배열 응답 → `[0]` 인덱스 사용 (최신 연간 데이터)

```
[0].grossProfitMargin                           number
[0].ebitdaMargin                                number
[0].operatingProfitMargin                       number  ← operatingProfitMarginTTM 아님!
[0].netProfitMargin                             number  ← netProfitMarginTTM 아님!
[0].currentRatio                                number
[0].quickRatio                                  number
[0].priceToEarningsRatio                        number  ← peRatio / pe 아님!
[0].priceToBookRatio                            number  ← pb / priceToBookRatioTTM 아님!
[0].priceToSalesRatio                           number  ← ps / priceToSalesRatioTTM 아님!
[0].priceToFreeCashFlowRatio                    number
[0].debtToEquityRatio                           number  ← debtEquityRatio 아님!
[0].debtToAssetsRatio                           number
[0].dividendYield                               number
[0].dividendYieldPercentage                     number
[0].dividendPayoutRatio                         number  ← payoutRatio 아님!
[0].enterpriseValueMultiple                     number  ← enterpriseValueOverEBITDA 아님!
[0].freeCashFlowPerShare                        number
[0].bookValuePerShare                           number
[0].revenuePerShare                             number
```

---

## 🔴 자주 혼동되는 포인트 요약

| 혼동 항목 | 잘못된 접근 | 올바른 접근 |
|---|---|---|
| BONDS 변화율 | `BONDS.HYG.changePercentage` | `BONDS.HYG.change` |
| FED Balance 단위 | LIQUIDITY = millions (6655939) | MACRO_INDEX.LIQUIDITY = T (6.655) |
| alpha profile 회사명 | `data.profile.name` | `data.profile.company` |
| ratios 이중래핑 | `data.pe` | `data.data.priceToEarningsRatio` |
| pe/pb null | `data.pe`, `data.pb` | 현재 null → `data.data.priceToEarningsRatio` 사용 |
| catalyst-surge-top5 detail | `[0].detail.technical.rsi` | ❌ top5에는 detail 없음, breakdown만 |
| FRED 응답 | `res.data.observations[0].value` | `res.data.value` (flat) |
| discovery volSurge | 항상 number | null 가능 → null 체크 필수 |
| yield-curve details | `details.us10y` | 현재 null 반환 중 |
| macro /macro 키명 | `fedBalance`, `FED_BALANCE` | `fedBal` |
| alpha industry | `data.profile.industry` | 현재 null |
| alpha floatShares | `data.factors.floatShares` | 현재 null |
| /stable/ratios payoutRatio | `payoutRatio` | `dividendPayoutRatio` |
| /stable/ratios PE 필드 | `peRatio`, `pe` | `priceToEarningsRatio` |
| /stable/ratios EV/EBITDA | `enterpriseValueOverEBITDA` | `enterpriseValueMultiple` |
| /stable/ratios 마진 | `operatingProfitMarginTTM` | `operatingProfitMargin` |
