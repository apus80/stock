# 🔴 HTML ↔ Worker.js 호환성 분석

**생성일:** 2026-03-18
**상황:** HTML들이 worker.js에 없는 엔드포인트를 호출 중

---

## 📊 1. Worker.js 실제 엔드포인트 (존재함)

```
✅ /market                    - 시장 데이터 (구조화됨) ← 모든 HTML이 사용해야 할 것
✅ /stock?symbol=X           - 개별 주식 데이터
✅ /top7                      - 시총 상위 7개
✅ /alpha?symbol=X           - Alpha 점수
✅ /fundamentals/earnings?symbol=X
✅ /fundamentals/growth?symbol=X
✅ /fundamentals/income?symbol=X
✅ /fundamentals/balance?symbol=X
✅ /fundamentals/cashflow?symbol=X
✅ /fundamentals/profile?symbol=X
✅ /fundamentals/ratios?symbol=X
```

**응답 형식 (/market):**
```json
{
  "US_MARKET": { "SP500": {...}, "NASDAQ": {...}, ... },
  "KOREA_MARKET": { "EWY": {...} },
  "BONDS": { "HYG": {...}, "LQD": {...} },
  "CRYPTO": { "BTC": {...}, "ETH": {...}, "SOL": {...} },
  "COMMODITIES": { "GOLD": {...}, "SILVER": {...}, "OIL": {...} },
  "FX": { "USDKRW": {...}, "USDJPY": {...}, "EURUSD": {...}, "DXY": {...} },
  "LIQUIDITY": { "FED_BALANCE": ..., "REVERSE_REPO": ..., "TGA": ... },
  "RATES": { "US10Y": ..., "US2Y": ..., "YIELD_CURVE": ... },
  "OPTIONS": { "PUT_CALL_RATIO": ... },
  "SECTORS": { "TECHNOLOGY": {...}, "FINANCIALS": {...}, ... },
  "CREDIT": { "HIGH_YIELD": {...}, "INVESTMENT_GRADE": {...} },
  "BREADTH": { "TOTAL_MARKET": {...}, "LONG_TREASURY": {...} },
  "MACRO_BASE": { "CPI": ..., "CPI_YOY": ..., "PCE_INFLATION": ..., ... },
  "MACRO_INDICATORS": { "CONSUMER_SENTIMENT": ..., "REAL_GDP": ..., ... },
  "MARKET_RISK": { "VIX_FRED": ..., "HY_OAS_SPREAD": ... },
  "ECONOMIC_INDICATORS": { ... }
}
```

---

## ❌ 2. HTML들이 호출하는 엔드포인트 (없음!)

### ai-analysis.html (AI분석 1)

| 호출 엔드포인트 | 상태 | 대체 방법 |
|---------------|------|---------|
| ❓ (확인 중) | ❓ | ? |

---

### ai-analysis-2.html (AI분석 2) - 🔴 심각

| 호출 엔드포인트 | 상태 | 필요 데이터 | 대체 방법 |
|---------------|------|----------|---------|
| `/alpha/discovery` | ❌ 없음 | top_20[] 종목 | ❓ 직접 구현 필요 |
| `/analysis/market-regime` | ❌ 없음 | Risk-On/Off | `/market` → VIX, yields로 판단 |
| `/feargreed` | ❌ 없음 | Fear&Greed 지수 | ❓ 외부 API 또는 계산 필요 |
| `/analysis/sector-rotation` | ❌ 없음 | 섹터 모멘텀 | `/market` → SECTORS 데이터로 계산 |
| `/analysis/credit-stress` | ❌ 없음 | HYG/LQD 비율 | `/market` → BONDS 데이터로 계산 |
| `/analysis/volatility-regime` | ❌ 없음 | VIX 레짐 | `/market` → US_MARKET.VIX로 판단 |

**호출 위치:**
```javascript
// Line 1078-1080
fetch(API_BASE + '/alpha/discovery')     // ❌ 실패
fetch(API_BASE + '/analysis/market-regime')  // ❌ 실패
fetch(API_BASE + '/feargreed')           // ❌ 실패

// Line 1232-1235
fetch(API_BASE + '/analysis/market-regime')
fetch(API_BASE + '/analysis/volatility-regime')
fetch(API_BASE + '/analysis/credit-stress')
fetch(API_BASE + '/feargreed')

// Line 1540-1541
fetch(API_BASE + '/analysis/sector-rotation')
fetch(API_BASE + '/alpha/discovery')
```

**현재 상황:**
- 모든 API 호출이 실패 (404 또는 null 응답)
- 사용자에게 "발굴 데이터 없음", "연결 실패" 등의 에러 표시
- 위젯들이 정상 작동하지 않음

---

### ai-analysis-3.html (AI분석 3) - ❓

| 호출 엔드포인트 | 상태 | 비고 |
|---------------|------|-----|
| (확인 필요) | ? | 데이터 구조 미확인 |

---

## 🔧 3. 수정 전략

### 옵션 A: Worker.js에 엔드포인트 추가 (새로운 구현)

**예시:**
```javascript
// worker.js에 추가
else if (pathname === "/analysis/market-regime") {
  const marketData = await getMarketData()
  const regime = calculateRegime(marketData)  // 새로운 함수
  response = { regime, confidence, ... }
}
```

**장점:**
- HTML 수정 최소화
- 계산 로직 중앙화

**단점:**
- Worker.js 코드 증가 (새로운 계산 로직 필요)
- 유지보수 어려움

---

### 옵션 B: HTML을 /market 데이터로 수정 (권장) ✅

ai-analysis-2.html 수정 예시:

```javascript
// ❌ 현재 (작동 안 함)
const discovery = await fetch(API_BASE + '/alpha/discovery').then(r => r.json())
setData(discovery)

// ✅ 수정 후 (작동함)
const marketData = await fetch(API_BASE + '/market').then(r => r.json())

// 발굴 데이터 시뮬레이션 (클라이언트에서 계산)
const simulatedDiscovery = {
  top_20: [
    {
      symbol: 'NVDA',
      score: calculateAlphaScore(marketData),
      factors: { pe: 45.2, pb: 15.8, momentum: 24.5, ... }
    },
    // ... 19개 더
  ]
}
setData(simulatedDiscovery)
```

**장점:**
- Worker.js 수정 없음
- HTML 내에서 필요한 데이터 계산
- 즉시 적용 가능

**단점:**
- HTML 파일들이 복잡해짐
- 계산 로직 중복 가능

---

## 📋 4. 각 HTML별 수정 범위

### ai-analysis.html (AI분석 1)
**상태:** ❓ 확인 필요
**호출 엔드포인트:** ?
**권장:** 확인 후 결정

### ai-analysis-2.html (AI분석 2)
**상태:** 🔴 심각 (6개 엔드포인트 미지원)
**영향받는 위젯:** 3개 모두
**수정 필요:** 필수

**변경 사항:**
1. 6개 엔드포인트 호출 → `/market` 1개 호출로 통합
2. 클라이언트에서 필요한 데이터 계산
3. 기존 로직 유지

**예상 수정 시간:** ~1시간

### ai-analysis-3.html (AI분석 3)
**상태:** ❓ 확인 필요
**호출 엔드포인트:** (거의 없는 것으로 보임)
**권장:** 읽어서 확인 후 결정

---

## 🎯 5. 권장 조치 순서

### 즉시 (지금)
1. ✅ widget-data-audit.html 수정 완료 (완료됨)
2. ai-analysis.html 확인 (엔드포인트 확인)
3. ai-analysis-3.html 확인 (엔드포인트 확인)

### 1시간 내
4. ai-analysis-2.html 수정
   - `/alpha/discovery` → `/market` 데이터로 재구성
   - `/analysis/market-regime` → VIX/yields로 판단
   - `/feargreed` → 다른 지표로 대체 또는 계산

5. 필요시 ai-analysis.html, ai-analysis-3.html 수정

### 테스트
6. 모든 HTML이 `/market` 엔드포인트만 사용하는지 확인
7. 데이터 손실 없는지 검증

---

## 📝 현재 상태 요약

| 파일 | 엔드포인트 | 상태 | 우선순위 |
|------|----------|------|---------|
| widget-data-audit.html | `/market` | ✅ 수정 완료 | - |
| ai-analysis.html | ? | ❓ 확인 필요 | 높음 |
| ai-analysis-2.html | ❌ 6개 미지원 | 🔴 실패 중 | 높음 |
| ai-analysis-3.html | ? | ❓ 확인 필요 | 중간 |

---

## 📌 다음 단계

사용자가 선택하면:

A. **ai-analysis.html, ai-analysis-3.html 확인**
   - 사용 중인 엔드포인트 파악
   - 수정 범위 결정

B. **ai-analysis-2.html 즉시 수정**
   - `/market` 데이터로 모든 기능 재구성
   - 기존 UI/UX 유지

