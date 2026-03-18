# 🔴 데이터 구조 불일치 분석 보고서

**생성일:** 2026-03-18
**목적:** worker.js 실제 구조 vs widget 예상 구조 비교

---

## 📊 1. Worker.js가 반환하는 실제 구조

### `/market` 엔드포인트 응답 (유일한 엔드포인트)

```javascript
// 실제 반환 구조
{
  // 🔴 단순 필드들 (구조 없음)
  "spy": 560.12,
  "spyChange": 0.45,
  "qqq": 480.34,
  "qqqChange": 0.67,
  "dia": 440.56,
  "diaChange": 0.23,
  "vix": 18.45,
  "vixChange": -2.10,

  // ... 30개 이상의 단순 필드들 ...

  // ✅ 구조화된 필드들 (일부만)
  "SECTORS": {
    "TECHNOLOGY": { "price": 230.12, "changePercentage": 0.56 },
    "FINANCIALS": { "price": 210.45, "changePercentage": 0.34 },
    // ... 8개 섹터
  },

  "MACRO_BASE": {
    "CPI": 314.12,
    "CPI_YOY": 3.2,
    "CORE_CPI_YOY": 2.8,
    // ... 8개 필드
  },

  "MACRO_INDICATORS": {...},
  "MARKET_RISK": {...},
  "CREDIT": {...},
  "BREADTH": {...}
}
```

---

## 🚨 2. 구조 불일치 테이블

| 위젯 기대 | worker.js 실제 | 상태 | 영향도 |
|---------|--------------|------|--------|
| `US_MARKET.SP500.price` | `spy` | ❌ 다름 | 높음 |
| `US_MARKET.NASDAQ.price` | `qqq` | ❌ 다름 | 높음 |
| `US_MARKET.DOW.price` | `dia` | ❌ 다름 | 높음 |
| `US_MARKET.VIX.price` | `vix` | ❌ 다름 | 높음 |
| `US_MARKET.SP500.changePercentage` | `spyChange` | ❌ 다름 | 높음 |
| `KOREA_MARKET.EWY.price` | `ewy` | ❌ 다름 | 중간 |
| `COMMODITIES.GOLD.price` | `gold` | ❌ 다름 | 중간 |
| `FX.USDJPY.price` | `usdjpy` | ❌ 다름 | 중간 |
| `FX.DXY.price` | `dxyPrice` | ❌ 다름 (필드명도 다름) | 중간 |
| `SECTORS.*` | `SECTORS.*` | ✅ 같음 | 0 |
| `MACRO_BASE.*` | `MACRO_BASE.*` | ✅ 같음 | 0 |
| `LIQUIDITY.FED_BALANCE` | `fed` | ❌ 다름 | 높음 |
| `RATES.US10Y` | `us10y` | ❌ 다름 | 높음 |
| `CREDIT.HYG.price` | `hyg` | ❌ 다름 | 중간 |

---

## 📍 3. AI분석별 영향도

### AI분석 1 (14개 위젯)
| 위젯 | 필드 수 | 구조화 여부 | 데이터 손실율 |
|------|--------|----------|----------|
| ai_1_1: Institutional Market Score | 4 | ❌ 0% | 75% |
| ai_1_2: Market Regime Engine | 3 | ❌ 0% | 66% |
| ai_1_3: Liquidity Pulse | 3 | ❌ 0% | 100% |
| ai_1_4: Yield Curve Monitor | 3 | ❌ 0% | 66% |
| ai_1_5: Inflation Pressure | 3 | ❌ 0% | 0% (MACRO_BASE 사용) |
| ai_1_6: Credit Stress | 3 | ❌ 0% | 66% |
| ai_1_7: Market Breadth | 3 | ❌ 0% | 100% |
| ai_1_8: Volatility Regime | 3 | ❌ 0% | 66% |
| ai_1_9: Sector Rotation | 3 | ✅ 100% | 0% |
| ai_1_10: Dollar Liquidity | 3 | ❌ 0% | 66% |
| ai_1_11: Crypto Risk | 3 | ❌ 0% | 66% |
| ai_1_12: Smart Money | 3 | ❌ 0% | 100% |
| ai_1_13: Stock Ranking | 4 | ❌ 0% | 100% |
| ai_1_14: Market Heatmap | 4 | ❌ 0% | 50% |

**총합: 45개 필드 중 약 35개 손실 (77.8%)**

---

## 🔴 4. 누락된 엔드포인트

### widget-data-audit.html에서 요청하지만 worker.js에 없는 것들

```
❌ /alpha/discovery        ← PE/PB 계산 필요 (상위 20개 종목)
❌ /fundamentals/ratios    ← PE/PB 비율 데이터
❌ /analysis/market-breadth ← 상승/하강 비율
❌ /analysis/market-regime  ← Risk-On/Off 판단
❌ /analysis/sector-rotation ← 섹터 모멘텀 정렬
❌ /analysis/volatility-regime ← VIX 레짐 분석
❌ /analysis/smart-money   ← ETF 거래량 분석
❌ /analysis/stock-ranking ← 종목 랭킹 엔진
❌ /analysis/crypto-sentiment ← Fear&Greed 인덱스
❌ /analysis/dollar-liquidity ← 상관계수 분석
❌ /analysis/market-heatmap ← 섹터별 강도 맵
```

**현재: 1개 엔드포인트 (`/market`) 만 있음**

---

## ✅ 5. 정상 작동하는 데이터

### 구조화되어 있고 올바르게 전달되는 것들

```javascript
// ✅ SECTORS - 구조 정상
{
  "SECTORS": {
    "TECHNOLOGY": { "price": 230.12, "changePercentage": 0.56 },
    "FINANCIALS": { "price": 210.45, "changePercentage": 0.34 },
    "ENERGY": { "price": 180.23, "changePercentage": -0.12 },
    "HEALTHCARE": { "price": 250.67, "changePercentage": 0.89 },
    "CONSUMER_DISCRETIONARY": { "price": 220.45, "changePercentage": 0.45 },
    "INDUSTRIALS": { "price": 190.34, "changePercentage": 0.23 },
    "UTILITIES": { "price": 170.12, "changePercentage": -0.05 },
    "REAL_ESTATE": { "price": 160.89, "changePercentage": 0.12 }
  }
}

// ✅ MACRO_BASE - 구조 정상
{
  "MACRO_BASE": {
    "CPI": 314.12,
    "CPI_YOY": 3.2,
    "CORE_CPI_YOY": 2.8,
    "PCE_INFLATION": 2.6,
    "FED_RATE": 4.33,
    "INFLATION_EXPECTATION": 2.30,
    "UNEMPLOYMENT": 4.10,
    "M2": 21500000,
    "REAL_RATES": 1.98
  }
}

// ✅ MACRO_INDICATORS - 구조 정상
{
  "MACRO_INDICATORS": {
    "CONSUMER_SENTIMENT": 64.7,
    "REAL_GDP": 23450.0,
    "INDUSTRIAL_PRODUCTION": 103.2,
    "NONFARM_PAYROLLS": 158400,
    "PCE_INFLATION": 2.6,
    "MFG_PMI": 50.2
  }
}

// ✅ MARKET_RISK - 구조 정상
{
  "MARKET_RISK": {
    "VIX_FRED": 18.45,
    "HY_OAS_SPREAD": 345.50
  }
}

// ✅ CREDIT - 구조 정상
{
  "CREDIT": {
    "HIGH_YIELD": { "price": 87.45, "changePercentage": -0.23 },
    "INVESTMENT_GRADE": { "price": 92.15, "changePercentage": 0.12 }
  }
}

// ✅ BREADTH - 구조 정상
{
  "BREADTH": {
    "TOTAL_MARKET": { "price": 420.12, "changePercentage": 0.34 },
    "LONG_TREASURY": { "price": 95.23, "changePercentage": -0.15 }
  }
}
```

---

## 🔧 6. 수정 방안

### 옵션 A: Worker.js 구조 재구성 (권장)

```javascript
// 변경 전 (현재)
{
  "spy": 560.12,
  "spyChange": 0.45,
  "qqq": 480.34,
  "qqqChange": 0.67
}

// 변경 후 (예상)
{
  "US_MARKET": {
    "SP500": { "price": 560.12, "changePercentage": 0.45 },
    "NASDAQ": { "price": 480.34, "changePercentage": 0.67 },
    "DOW": { "price": 440.56, "changePercentage": 0.23 },
    "VIX": { "price": 18.45, "changePercentage": -2.10 },
    "SOX": { "price": 210.34, "changePercentage": 1.23 },
    "RUSSELL2000": { "price": 220.45, "changePercentage": 0.89 }
  },
  "COMMODITIES": {
    "GOLD": { "price": 2900, "changePercentage": 0.32 },
    "SILVER": { "price": 32.45, "changePercentage": 0.15 },
    "OIL": { "price": 71.23, "changePercentage": -1.20 }
  },
  "FX": {
    "USDJPY": { "price": 149.50, "changePercentage": 0.05 },
    "EURUSD": { "price": 1.0823, "changePercentage": -0.10 },
    "USDKRW": { "price": 1320.45, "changePercentage": 0.23 },
    "DXY": { "price": 104.32, "changePercentage": 0.08 }
  },
  "KOREA_MARKET": {
    "EWY": { "price": 123.45, "changePercentage": -0.12 }
  },
  "CRYPTO": {
    "BTC": { "price": 42500, "changePercentage": 3.2 },
    "ETH": { "price": 2300, "changePercentage": 2.1 },
    "SOL": { "price": 95.5, "changePercentage": 1.8 }
  },
  "LIQUIDITY": {
    "FED_BALANCE": 7234567,      // raw millions
    "REVERSE_REPO": 123456,       // raw millions
    "TGA": 567890                 // raw millions
  },
  "RATES": {
    "US10Y": 4.28,
    "US2Y": 4.15,
    "YIELD_CURVE": 0.130
  },
  "SECTORS": {...},
  "CREDIT": {...},
  "BREADTH": {...},
  "MACRO_BASE": {...},
  "MACRO_INDICATORS": {...},
  "MARKET_RISK": {...}
}
```

### 수정 범위 (worker.js에서)
- **함수:** `getMarketData()` (1217줄)
- **영향:** 반환 객체 구조만 변경
  - `spy` → `US_MARKET.SP500.price`
  - `spyChange` → `US_MARKET.SP500.changePercentage`
  - `fed` → `LIQUIDITY.FED_BALANCE`
  - 등등 (약 30개 필드)
- **위험도:** **낮음** (호출 코드만 수정하면 됨)
- **시간:** ~30분

---

### 옵션 B: widget-data-audit.html을 현재 구조에 맞게 수정

❌ **권장하지 않음** - AI분석 위젯들도 모두 리팩토링 필요

---

## 📈 7. 데이터 손실 요약

| 카테고리 | 총 필드 | 정상 | 손실 | 손실율 |
|---------|--------|------|------|--------|
| US 주식 | 6 | 0 | 6 | 100% |
| 채권 | 2 | 0 | 2 | 100% |
| 광범위 | 2 | 0 | 2 | 100% |
| 섹터 | 8 | 8 | 0 | 0% |
| 한국 | 1 | 0 | 1 | 100% |
| 암호 | 3 | 0 | 3 | 100% |
| 상품 | 3 | 0 | 3 | 100% |
| FX | 4 | 0 | 4 | 100% |
| 유동성 | 3 | 0 | 3 | 100% |
| 금리 | 3 | 0 | 3 | 100% |
| 경제지표 | 9 | 9 | 0 | 0% |
| **총합** | **44** | **17** | **27** | **61.4%** |

---

## 🎯 8. 권장사항

### 즉시 조치 (필수)
1. **worker.js `/market` 엔드포인트 구조 개선**
   - 현재 30개 단순 필드 → `US_MARKET`, `COMMODITIES`, `FX`, `LIQUIDITY`, `RATES` 등으로 구조화
   - CLAUDE.md의 "Worker 응답 구조" 참고

2. **index.html 호출 코드 수정**
   - `data.spy` → `data.US_MARKET.SP500.price`
   - `data.fed` → `data.LIQUIDITY.FED_BALANCE`

### 중기 조치 (1주일)
3. **AI분석 위젯들 업데이트**
   - ai-analysis-1.html, ai-analysis-2.html, ai-analysis-3.html에서 구조 재참조
   - 계산 로직은 유지, 데이터 경로만 변경

### 장기 조치 (2주일)
4. **부족한 엔드포인트 구현**
   - `/alpha/discovery` → 종목 발굴 엔진 (FMP ratios 활용)
   - `/analysis/*` → 각 분석 엔드포인트

---

## 📝 결론

**현재 상태:** 🔴 **심각한 구조 불일치**
- worker.js는 30개의 단순 필드를 반환
- widget-data-audit.html은 구조화된 객체를 기대
- **61.4%의 데이터가 예상된 위치에 없음**

**해결책:** 옵션 A (worker.js 구조 개선)
- 위험도 낮음, 효율성 높음
- 모든 위젯과 대시보드가 자동으로 정상 작동
- **약 2시간 소요**

