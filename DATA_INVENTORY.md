# 📊 InvestFlow 데이터 인벤토리 (전체)

## 🎯 개요
Worker에서 수집 가능한 **모든 시장 데이터**를 FMP, FRED, Yahoo로 구분하여 정리

---

## 📌 실시간 API 호출 (Raw Data)

### 🏢 **FMP API** (Financial Modeling Prep)
**엔드포인트**: `/stable/quote?symbol=X`

#### 📈 US 주식지수
- **SPY** (S&P 500)
  - price, changePercentage
- **QQQ** (NASDAQ 100)
  - price, changePercentage
- **DIA** (Dow Jones 30)
  - price, changePercentage
- **SOXX** (Semiconductor Index)
  - price, changePercentage
- **IWM** (Russell 2000)
  - price, changePercentage
- **^VIX** (Volatility Index)
  - price, changePercentage

#### 💰 채권 & 광범위 지표
- **HYG** (High Yield Bond ETF)
  - price, changePercentage
- **LQD** (Investment Grade Bond ETF)
  - price, changePercentage
- **VTI** (Total US Stock Market ETF)
  - price, changePercentage
- **TLT** (Long Treasury Bond ETF)
  - price, changePercentage

#### 🏭 섹터 ETF (8개)
- **XLK** (Technology)
  - price, changePercentage
- **XLF** (Financials)
  - price, changePercentage
- **XLE** (Energy)
  - price, changePercentage
- **XLV** (Healthcare)
  - price, changePercentage
- **XLY** (Consumer Discretionary)
  - price, changePercentage
- **XLI** (Industrials)
  - price, changePercentage
- **XLU** (Utilities)
  - price, changePercentage
- **XLRE** (Real Estate)
  - price, changePercentage

#### 🇰🇷 한국 시장
- **EWY** (Korea ETF - iShares MSCI South Korea)
  - price, changePercentage

#### 🪙 암호화폐 (Binance)
- **BTCUSD** (Bitcoin)
  - price, changePercentage
- **ETHUSD** (Ethereum)
  - price, changePercentage
- **SOLUSD** (Solana)
  - price, changePercentage

#### 🏅 원자재 (Commodities)
- **GCUSD** (Gold)
  - price, changePercentage
- **SIUSD** (Silver)
  - price, changePercentage
- **BZUSD** (Brent Crude Oil)
  - price, changePercentage

#### 💱 외환 (FX)
- **USDKRW** (USD/KRW - 원/달러 환율)
  - price, changePercentage
- **USDJPY** (USD/JPY - 엔/달러 환율)
  - price, changePercentage
- **EURUSD** (EUR/USD - 유로/달러 환율)
  - price, changePercentage

---

### 🏛️ **FRED API** (Federal Reserve Economic Data)
**엔드포인트**: `/fred/series/observations?series_id=X&limit=1`

#### 📊 유동성 지표 (일일)
- **WALCL** (Fed Balance Sheet - 연방준비 총자산)
  - 단위: Millions USD
  - 설명: Fed의 유동성 공급 규모

- **RRPONTSYD** (Reverse Repo - 역레포)
  - 단위: Millions USD
  - 설명: 시장에 공급된 단기 유동성

- **WTREGEN** (TGA - Treasury General Account)
  - 단위: Millions USD
  - 설명: 재무부 일반 계정 잔액

#### 📈 수익률 & 금리 (일일)
- **DGS10** (10-Year Treasury Yield)
  - 단위: % (percent)
  - 설명: 10년물 국채 수익률

- **DGS2** (2-Year Treasury Yield)
  - 단위: % (percent)
  - 설명: 2년물 국채 수익률

- **FEDFUNDS** (Effective Federal Funds Rate)
  - 단위: % (percent)
  - 설명: 연방기금 유효 기준금리

#### 💹 물가 & 인플레이션 (월간)
- **CPIAUCSL** (Consumer Price Index All Urban)
  - 단위: Index Level (또는 pc1로 YoY%)
  - 설명: 소비자 물가지수
  - 추가: CPIAUCSL units=pc1 → CPI_YOY (%)

- **CPILFESL** (Core CPI - 식료품/에너지 제외)
  - 단위: pc1 (YoY%)
  - 설명: 핵심 물가지수 (전년동기대비)

- **PCEPI** (Personal Consumption Expenditures Price Index)
  - 단위: Index Level
  - 설명: PCE 인플레이션 지수

- **PCEPILFE** (Core PCE - 식료품/에너지 제외)
  - 단위: % (YoY)
  - 설명: 핵심 PCE 인플레이션

- **T10YIE** (10-Year Inflation Expectation)
  - 단위: % (percent)
  - 설명: 10년 기대인플레이션

#### 💼 노동시장 (월간)
- **UNRATE** (Unemployment Rate)
  - 단위: % (percent)
  - 설명: 실업률

- **PAYEMS** (Nonfarm Payroll)
  - 단위: Thousands
  - 설명: 비농업 고용(천명)

- **UMCSENT** (Consumer Sentiment Index)
  - 단위: Index (1966=100)
  - 설명: 소비자 심리지수

#### 📊 경제 성장 (월간)
- **GDPC1** (Real Gross Domestic Product)
  - 단위: Billions USD (Chained 2012 Dollars)
  - 설명: 실질 GDP

- **INDPRO** (Industrial Production Index)
  - 단위: Index (2017=100)
  - 설명: 산업생산지수

#### ⚠️ 시장 리스크 (일일)
- **VIXCLS** (VIX - Volatility Index from FRED)
  - 단위: Index
  - 설명: 변동성 지수

- **BAMLH0A0HYM2** (High Yield OAS Spread)
  - 단위: % (percent)
  - 설명: 하이일드 채권 스프레드

#### 📌 M2 통화량 (월간)
- **M2SL** (M2 Money Stock)
  - 단위: Billions USD
  - 설명: M2 통화량 (확대된 화폐공급)
  - 변환: × 1000 → Millions (index.html에서 / 1,000,000 → T)

---

### 🌐 **Yahoo Finance API**
**출처**: Yahoo Finance

#### 🏛️ 시장 구조 지표
- **^VVIX** (Volatility of VIX)
  - price, changePercentage
  - 설명: 변동성의 변동성 (VIX 변동성 측정)

- **^MOVE** (MOVE Index - Bond Market Volatility)
  - price, changePercentage
  - 설명: 채권시장 변동성 지수

- **^NYA** (NYSE Composite)
  - price, changePercentage
  - 설명: 뉴욕증권거래소 광폭도

---

## 🧮 계산되는 데이터 (Derived Data)

### 📍 /market 응답 구조

#### **기본 계산 지표**
```
yieldCurve = DGS10 (10Y) - DGS2 (2Y)
  설명: 수익률 곡선 (역전 신호)

REAL_RATES = DGS10 - T10YIE (10년 기대인플레이션)
  설명: 실질금리 (명목금리 - 기대인플레이션)
```

#### **FRED 값 정규화**
```
Fed Balance (WALCL)
  Raw: Millions USD
  Display: ÷ 1,000,000 → Trillions

Reverse Repo (RRPONTSYD)
  Raw: Millions USD
  Display: ÷ 1,000 → Billions

TGA (WTREGEN)
  Raw: Millions USD
  Display: ÷ 1,000,000 → Trillions

M2 (M2SL)
  Raw: Billions USD
  Stored: × 1,000 → Millions (for index.html)
  Display: ÷ 1,000,000 → Trillions
```

### 📊 /analysis 엔드포인트 (고급 분석)

#### 1️⃣ **Real Rate Monitor** (/analysis/real-rate-monitor)
```
구성요소:
- Fed Rate (FEDFUNDS)
- Inflation Expectation (T10YIE)
- Real Rate (Fed Rate - Inflation Expectation)

반환값:
{
  "dataType": "real_rate_monitor",
  "signal": "실질금리 판단",
  "metrics": [
    { "name": "Fed 기준금리", "value": X, "unit": "%" },
    { "name": "기대인플레이션", "value": X, "unit": "%" },
    { "name": "실질금리", "value": X, "unit": "%" }
  ],
  "interpretation": "경제 상황 해석",
  "recommendation": "투자 권고"
}
```

#### 2️⃣ **Fed Policy Impact** (/analysis/fed-policy-impact)
```
구성요소:
- Fed Balance (WALCL → T$)
- M2 Money Supply (M2SL → T$)
- Fed Rate (FEDFUNDS)

반환값:
{
  "dataType": "fed_policy_impact",
  "policy_stance": "긴축/완화",
  "signal": "정책 신호",
  "components": [
    { "name": "Fed Balance", "value": X, "unit": "T$" },
    { "name": "M2 Money Supply", "value": X, "unit": "T$" },
    { "name": "Fed Rate", "value": X, "unit": "%" }
  ],
  "interpretation": "연준 정책 해석",
  "impact": "시장 영향도"
}
```

#### 3️⃣ **Labor Market Health** (/analysis/labor-market-health)
```
구성요소:
- Unemployment Rate (UNRATE)
- Nonfarm Payroll (PAYEMS → K단위)
- Consumer Sentiment (UMCSENT)

반환값:
{
  "dataType": "labor_market_health",
  "score": 80,
  "trend": "개선",
  "signal": "💼 강함",
  "metrics": [
    { "name": "실업률", "value": X, "unit": "%" },
    { "name": "비농업 고용", "value": X, "unit": "천명" },
    { "name": "소비자심리", "value": X, "unit": "idx" }
  ],
  "interpretation": "노동시장 분석",
  "wage_pressure": "임금압박 여부"
}
```

#### 4️⃣ **Macro Momentum** (/analysis/macro-momentum)
```
구성요소:
- Real GDP (GDPC1)
- Industrial Production (INDPRO)
- CPI YoY (CPIAUCSL units=pc1)
- Inflation Expectation (T10YIE)

반환값:
{
  "dataType": "macro_momentum",
  "score": 80,
  "signal": "강한 성장",
  "components": [
    { "name": "경제 활력도", "value": X, "unit": "idx" },
    { "name": "산업생산", "value": X, "unit": "idx" },
    { "name": "CPI YoY", "value": X, "unit": "%" },
    { "name": "기대인플레이션", "value": X, "unit": "%" }
  ],
  "regime": "확장국면",
  "recommendation": "성장주 선호",
  "details": { ... }
}
```

#### 5️⃣ **Institutional Market Score** (/analysis/institutional-score)
```
구성요소:
- Liquidity Score (Fed Balance 기반)
- Volatility Score (VIX 기반)
- Credit Score (HYG/LQD 비율)
- Breadth Score (VTI/TLT)
- Macro Score (Yield Curve)

반환값:
{
  "dataType": "institutional_score",
  "score": 75,
  "signal": "강한 강세",
  "components": [
    { "name": "유동성", "value": 18, "unit": "pt" },
    { "name": "변동성", "value": 18, "unit": "pt" },
    { "name": "신용", "value": 15, "unit": "pt" },
    { "name": "시장너비", "value": 18, "unit": "pt" },
    { "name": "매크로", "value": 18, "unit": "pt" }
  ],
  "interpretation": "기관 투자자 적극 매수 신호"
}
```

#### 6️⃣ **Market Regime** (/analysis/market-regime)
```
구성요소:
- Trend Score (SPY 기반)
- Risk Score (VIX 기반)
- SPY Direction (SPY changePercentage)

반환값:
{
  "dataType": "market_regime",
  "regime": "Risk-On",
  "confidence": 75,
  "signal": "공격 모드",
  "factors": [
    { "name": "추세 점수", "status": "강세", "strength": 70 },
    { "name": "리스크 점수", "status": "낮음", "strength": 80 },
    { "name": "SPY 방향", "status": "상승", "strength": 45 }
  ]
}
```

#### 7️⃣ **Liquidity Pulse** (/analysis/liquidity-pulse)
```
구성요소:
- Fed Balance (WALCL)
- Reverse Repo (RRPONTSYD)

반환값:
{
  "dataType": "liquidity_pulse",
  "score": 85,
  "signal": "풍부함",
  "components": [
    { "name": "Fed 잔액", "value": X, "unit": "T$" },
    { "name": "역레포(RRP)", "value": X, "unit": "B$" }
  ],
  "interpretation": "유동성 풍부 → 위험자산 선호"
}
```

#### 8️⃣ **Yield Curve Monitor** (/analysis/yield-curve-monitor)
```
구성요소:
- 10-Year Yield (DGS10)
- 2-Year Yield (DGS2)
- Spread (10Y - 2Y)
- Inversion Status

반환값:
{
  "dataType": "yield_curve",
  "spread": "0.13",
  "inverted": false,
  "signal": "정상",
  "recession_probability": 20,
  "recommendation": "공격적 포지셔닝",
  "metrics": [
    { "name": "10년물", "value": 4.28, "unit": "%" },
    { "name": "2년물", "value": 4.15, "unit": "%" },
    { "name": "스프레드", "value": 0.130, "unit": "%" },
    { "name": "경기침체 확률", "value": 20, "unit": "%" }
  ]
}
```

---

## 📍 개별 종목 분석 (/alpha?symbol=SYMBOL)

### 🔍 **9가지 인디케이터 기반 점수**

#### 데이터 소스
```
1. Price Trend (from FMP Quote)
   - 52주 최고가 대비 현재 가격
   - 200일 이동평균 추정

2. Momentum (from FMP Quote)
   - 최근 가격 변동률
   - 추세 방향성

3. Valuation (from FMP Ratios)
   - P/E Ratio
   - P/B Ratio
   - PEG Ratio

4. Growth (from FMP Growth)
   - Revenue Growth (%)
   - Earnings Growth (%)
   - EPS Growth (%)

5. Profitability (from FMP Ratios)
   - Gross Margin
   - Operating Margin
   - Net Profit Margin

6. Financial Health (from FMP Balance Sheet)
   - Debt/Equity Ratio
   - Current Ratio
   - Quick Ratio

7. Dividend Yield (from FMP Dividend)
   - Current Dividend Yield
   - Payout Ratio
   - 5-Year Growth Rate

8. Insider Activity (from FMP Insider Trading)
   - Insider Buy/Sell Ratio
   - Recent Transactions

9. Analyst Sentiment (from FMP Ratings)
   - Average Rating
   - Price Target vs Current
   - Recommendation Distribution
```

### 📊 **반환 데이터 구조**
```json
{
  "symbol": "AAPL",
  "dataType": "alpha_score",
  "score": 78,
  "trend": "상승",
  "signal": "🎯 Buy",
  "indicators": [
    {
      "name": "Price Trend",
      "score": 85,
      "weight": 15,
      "status": "강함",
      "detail": "52주 최고가 근처"
    },
    {
      "name": "Momentum",
      "score": 72,
      "weight": 15,
      "status": "양호",
      "detail": "상승 추세"
    },
    {
      "name": "Valuation",
      "score": 68,
      "weight": 15,
      "status": "적정",
      "detail": "P/E: 28.5, Sector Avg: 32"
    },
    {
      "name": "Growth",
      "score": 82,
      "weight": 20,
      "status": "강함",
      "detail": "Revenue Growth: 8.2%"
    },
    {
      "name": "Profitability",
      "score": 90,
      "weight": 15,
      "status": "매우강함",
      "detail": "Net Margin: 28.5%"
    },
    {
      "name": "Financial Health",
      "score": 75,
      "weight": 10,
      "status": "양호",
      "detail": "Debt/Equity: 0.95"
    },
    {
      "name": "Dividend Yield",
      "score": 65,
      "weight": 5,
      "status": "낮음",
      "detail": "Yield: 0.42%"
    },
    {
      "name": "Insider Activity",
      "score": 71,
      "weight": 5,
      "status": "양호",
      "detail": "Buy/Sell Ratio: 1.2"
    },
    {
      "name": "Analyst Sentiment",
      "score": 80,
      "weight": 5,
      "status": "긍정적",
      "detail": "Avg: Buy, Target: $195"
    }
  ],
  "recommendation": "Buy - 성장성과 수익성 동시 우수",
  "risk_level": "중간",
  "catalysts": ["Q4 실적 기대", "AI 수익화", "주가 회수"]
}
```

---

## 🔗 Alpha Discovery (/alpha/discovery?count=20)

### 📌 Top 20 스톡 스크리닝
```
출력: 20개 종목 × 9개 인디케이터 점수
각 종목별로 위의 /alpha?symbol= 구조와 동일

추가 반환값:
- rank: 순위 (1~20)
- score: 종합 점수 (0~100)
- symbol: 종목 코드
- sector: 섹터
- signal: 매수/보유/매도
- screened_at: 스크리닝 시간
```

---

## 📋 전체 /market 응답 체크리스트

### ✅ FMP API (18개 항목)
- [ ] SPY (S&P 500) - price, changePercentage
- [ ] QQQ (NASDAQ) - price, changePercentage
- [ ] DIA (Dow) - price, changePercentage
- [ ] SOXX (Semiconductor) - price, changePercentage
- [ ] IWM (Russell 2000) - price, changePercentage
- [ ] ^VIX (Volatility) - price, changePercentage
- [ ] HYG (High Yield Bond) - price, changePercentage
- [ ] LQD (Investment Grade Bond) - price, changePercentage
- [ ] VTI (Total Market) - price, changePercentage
- [ ] TLT (Long Treasury) - price, changePercentage
- [ ] EWY (Korea ETF) - price, changePercentage
- [ ] BTCUSD (Bitcoin) - price, changePercentage
- [ ] ETHUSD (Ethereum) - price, changePercentage
- [ ] SOLUSD (Solana) - price, changePercentage
- [ ] GCUSD (Gold) - price, changePercentage
- [ ] SIUSD (Silver) - price, changePercentage
- [ ] BZUSD (Brent Oil) - price, changePercentage
- [ ] USDKRW, USDJPY, EURUSD (FX) - 3개

### ✅ FMP API - 섹터 ETF (8개)
- [ ] XLK (Technology) - price, changePercentage
- [ ] XLF (Financials) - price, changePercentage
- [ ] XLE (Energy) - price, changePercentage
- [ ] XLV (Healthcare) - price, changePercentage
- [ ] XLY (Consumer Discretionary) - price, changePercentage
- [ ] XLI (Industrials) - price, changePercentage
- [ ] XLU (Utilities) - price, changePercentage
- [ ] XLRE (Real Estate) - price, changePercentage

### ✅ FRED API (15개 + 계산)
- [ ] WALCL (Fed Balance) - millions
- [ ] RRPONTSYD (Reverse Repo) - millions
- [ ] DGS10 (10Y Yield) - %
- [ ] DGS2 (2Y Yield) - %
- [ ] CPIAUCSL (CPI Index) - index
- [ ] CPIAUCSL pc1 (CPI YoY) - %
- [ ] CPILFESL pc1 (Core CPI YoY) - %
- [ ] UNRATE (Unemployment) - %
- [ ] UMCSENT (Sentiment) - index
- [ ] GDPC1 (Real GDP) - billions
- [ ] INDPRO (Industrial Production) - index
- [ ] PAYEMS (Nonfarm Payroll) - thousands
- [ ] PCEPILFE (Core PCE) - %
- [ ] WTREGEN (TGA) - millions
- [ ] M2SL (M2 Money) - billions
- [ ] T10YIE (Inflation Expectation) - %
- [ ] FEDFUNDS (Fed Rate) - %
- [ ] PCEPI (PCE Inflation) - index
- [ ] VIXCLS (VIX from FRED) - index
- [ ] BAMLH0A0HYM2 (HY OAS) - %
- [ ] **Calculated**: yieldCurve = 10Y - 2Y
- [ ] **Calculated**: REAL_RATES = 10Y - Inflation Expectation

### ✅ Yahoo Finance (3개)
- [ ] ^VVIX (Volatility of VIX) - price, changePercentage
- [ ] ^MOVE (Bond Vol) - price, changePercentage
- [ ] ^NYA (NYSE Composite) - price, changePercentage

### ✅ 분석 엔드포인트 (6개)
- [ ] /analysis/institutional-score
- [ ] /analysis/market-regime
- [ ] /analysis/liquidity-pulse
- [ ] /analysis/yield-curve-monitor
- [ ] /analysis/sector-rotation
- [ ] /analysis/volatility-regime

### ✅ 고급 분석 (4개)
- [ ] /analysis/real-rate-monitor
- [ ] /analysis/fed-policy-impact
- [ ] /analysis/labor-market-health
- [ ] /analysis/macro-momentum

### ✅ 개별 종목 (무제한)
- [ ] /alpha?symbol=SYMBOL (9개 인디케이터)
- [ ] /alpha/discovery?count=20 (Top 20)

---

## 🎯 데이터 수집 요약

| 카테고리 | 소스 | 항목수 | 업데이트 |
|---------|------|-------|--------|
| US 주식지수 | FMP | 6개 | 실시간 |
| 채권 & 광범위 | FMP | 4개 | 실시간 |
| 섹터 ETF | FMP | 8개 | 실시간 |
| 한국 시장 | FMP | 1개 | 실시간 |
| 암호화폐 | FMP | 3개 | 실시간 |
| 원자재 | FMP | 3개 | 실시간 |
| 외환 | FMP | 3개 | 실시간 |
| 유동성 지표 | FRED | 3개 | 일일 |
| 금리 & 수익률 | FRED | 3개 | 일일 |
| 물가 & 인플레 | FRED | 5개 | 월간 |
| 노동시장 | FRED | 3개 | 월간 |
| 경제 성장 | FRED | 2개 | 월간 |
| 시장 리스크 | FRED | 2개 | 일일 |
| M2 통화량 | FRED | 1개 | 월간 |
| Yahoo Market Structure | Yahoo | 3개 | 실시간 |
| **합계** | **3개 API** | **51개 항목** | - |

---

## 🚀 사용 예시

### 시장분석 위젯
```javascript
// 실시간 시장 상태 확인
const market = await fetch('/market').then(r => r.json());
console.log('SPY:', market.spy);
console.log('VIX:', market.vix);
console.log('Fed Balance:', market.fed);
console.log('Yield Curve:', market.yieldCurve);

// 제도권 투자자 점수
const inst = await fetch('/analysis/institutional-score').then(r => r.json());
console.log('기관 점수:', inst.score);
console.log('신호:', inst.signal);

// 시장 체제
const regime = await fetch('/analysis/market-regime').then(r => r.json());
console.log('현재 체제:', regime.regime);
console.log('신뢰도:', regime.confidence);
```

### 개별 종목 발굴
```javascript
// 단일 종목 분석
const alpha = await fetch('/alpha?symbol=AAPL').then(r => r.json());
console.log('AAPL 종합점수:', alpha.score);
console.log('신호:', alpha.signal);

// Top 20 스톡
const top20 = await fetch('/alpha/discovery?count=20').then(r => r.json());
top20.forEach((stock, i) => {
  console.log(`${i+1}. ${stock.symbol}: ${stock.score} (${stock.signal})`);
});
```

---

## 📌 주의사항

1. **FRED 데이터 단위**
   - WALCL, WTREGEN: Millions USD (index.html에서 ÷1,000,000 → T)
   - RRPONTSYD: 이미 Billions (index.html에서 ÷1,000 → B)
   - M2SL: Billions (worker에서 ×1000 → millions로 저장)

2. **FMP API 엔드포인트**
   - 반드시 `/stable/quote` 사용 (batch-quote는 유료)
   - 응답: Array 또는 Object (첫 번째 요소 사용)

3. **FRED 캐싱**
   - 월간 데이터는 자주 갱신 안 함
   - 실시간 데이터는 60초 캐시 적용

4. **Yahoo Finance**
   - 추가 인증 불필요 (공개 API)
   - 심볼: ^VVIX, ^MOVE, ^NYA

---

**마지막 업데이트**: 2026-03-15
**Worker 버전**: v2.0 (Real Rate Monitor, Fed Policy Impact, Labor Market Health, Macro Momentum 추가)
