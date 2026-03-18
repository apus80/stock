# 🔄 HTML ↔ Worker.js 호환성 정정 분석

**수정일:** 2026-03-18 (재분석)
**상황:** ✅ 실제로 **모든 엔드포인트가 worker.js에 존재합니다!**

---

## 🎯 핵심 발견

### ✅ Worker.js 엔드포인트 완전 목록 (모두 존재함!)

**18개 분석 엔드포인트:**
```
✅ /analysis/institutional-score
✅ /analysis/market-regime           ← ai-analysis-2에서 사용
✅ /analysis/liquidity-pulse
✅ /analysis/yield-curve-monitor
✅ /analysis/inflation-pressure
✅ /analysis/credit-stress           ← ai-analysis-2에서 사용
✅ /analysis/market-breadth
✅ /analysis/volatility-regime       ← ai-analysis-2에서 사용
✅ /analysis/sector-rotation         ← ai-analysis-2에서 사용
✅ /analysis/dollar-liquidity
✅ /analysis/crypto-sentiment
✅ /analysis/smart-money
✅ /analysis/stock-ranking
✅ /analysis/market-heatmap
(+ 더 있을 수 있음)
```

**발견 엔드포인트:**
```
✅ /market                           (구조화된 시장 데이터)
✅ /alpha?symbol=X                  (Alpha 점수)
✅ /alpha/discovery                 (→ runAlphaDiscovery() 함수)
✅ /feargreed                        (Fear & Greed Index)
✅ /stock?symbol=X                  (개별 주식)
✅ /top7                             (시총 상위 7개)
```

**재무 데이터 엔드포인트:**
```
✅ /fundamentals/earnings?symbol=X
✅ /fundamentals/growth?symbol=X
✅ /fundamentals/income?symbol=X
✅ /fundamentals/balance?symbol=X
✅ /fundamentals/cashflow?symbol=X
✅ /fundamentals/ratios?symbol=X
✅ /fundamentals/profile?symbol=X
✅ /fundamentals/shares?symbol=X
```

---

## 📋 ai-analysis-2.html 호출 분석

### ✅ 호출하는 엔드포인트 (모두 있음)

| 엔드포인트 | 위치 | 응답 구조 | 상태 |
|-----------|------|---------|------|
| `/alpha/discovery` | 1078줄 | `{ top_20: [...], analyzed, universe_size, ... }` | ✅ 있음 |
| `/analysis/market-regime` | 1079줄 | `{ regime, signal, components, ... }` | ✅ 있음 |
| `/feargreed` | 1080줄 | `{ score, rating, timestamp, source }` | ✅ 있음 |
| `/analysis/sector-rotation` | 1540줄 | `{ ... }` | ✅ 있음 |
| `/analysis/credit-stress` | 1234줄 | `{ hyg_price, lqd_price, ratio, ... }` | ✅ 있음 |
| `/analysis/volatility-regime` | 1233줄 | `{ vix, regime, confidence, ... }` | ✅ 있음 |

---

## 🔴 실제 문제: 응답 구조 불일치

### ai-analysis-2.html의 기대 구조

```javascript
// 1092줄
if (discovery?.top_20) {  // ← top_20 필드 기대
    setData(discovery)
} else {
    setError('발굴 데이터 없음')  // ← 여기서 에러 발생
}

// 1090줄
const fg = fgRaw && fgRaw.score !== undefined ? fgRaw : null
```

**필요한 필드:**
- `discovery.top_20` ✅ worker.js 2067줄에서 반환함
- `fgRaw.score` ✅ worker.js 3187줄에서 반환함

### Worker.js 실제 응답 (runAlphaDiscovery)

```javascript
// worker.js 2061-2068줄
return {
    timestamp: new Date().toISOString(),
    dataType: "alpha_discovery",
    universe_size: universe.length,
    analyzed: results.length,
    execution_time_sec: parseFloat(elapsedTime),
    top_20: top20  // ✅ 필드 있음!
}
```

**응답 구조: ✅ 일치함!**

---

## 🤔 그러면 왜 데이터를 못 받을까?

### 가능성 1️⃣: API 호출 실패
```
- Timeout 오류
- Network error
- CORS 문제
- 400/500 에러
```

### 가능성 2️⃣: API 느림
```javascript
// api-analysis-2.html 1075줄
const counter = setInterval(() => setElapsed(e => e + 1), 1000)
const results = await Promise.allSettled([...])  // ← 3개 동시 호출
// 만약 하나라도 실패 → null 반환
```

**문제:**
- `/alpha/discovery`는 최대 90개 종목 분석 (느림)
- `/analysis/market-regime`도 계산 필요 (느림)
- Timeout 발생 가능성 높음

### 가능성 3️⃣: Discovery 데이터 부족
```javascript
// worker.js 2011줄
const universe = singleSymbol ? [singleSymbol] : await getHedgeFundUniverse()

// 2018줄
for (let i = 0; i < Math.min(universe.length, singleSymbol ? 1 : 90); i++)
```

**문제:**
- `getHedgeFundUniverse()`가 빈 배열을 반환하면 `top_20: []`
- ai-analysis-2.html에서 `if (discovery?.top_20)` → `[]` (falsy!)
- "발굴 데이터 없음" 에러 표시

---

## 🔧 진짜 해결책

### 1️⃣ ai-analysis-2.html 수정 (즉시)

```javascript
// ❌ 현재 (1092줄)
if (discovery?.top_20) {
    setData(discovery)
} else {
    setError('발굴 데이터 없음')
}

// ✅ 수정
if (discovery?.top_20 && Array.isArray(discovery.top_20) && discovery.top_20.length > 0) {
    setData(discovery)
} else if (discovery?.top_20 && discovery.top_20.length === 0) {
    setError('분석 완료했지만 해당 종목 없음')
} else {
    setError(`API 연결 실패: ${discovery?.error || '알 수 없음'}`)
}
```

### 2️⃣ Timeout 증가 (worker 호출 시)

```javascript
// ai-analysis-2.html 1078줄
const results = await Promise.allSettled([
    fetch(API_BASE + '/alpha/discovery').then(r => r.json()),  // ← 최대 30초 걸릴 수 있음
    fetch(API_BASE + '/analysis/market-regime').then(r => r.json()),
    fetch(API_BASE + '/feargreed').then(r => r.json())
])

// ✅ 수정: Timeout 추가
const timeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
])

const results = await Promise.allSettled([
    timeout(fetch(API_BASE + '/alpha/discovery').then(r => r.json()), 30000),
    timeout(fetch(API_BASE + '/analysis/market-regime').then(r => r.json()), 10000),
    timeout(fetch(API_BASE + '/feargreed').then(r => r.json()), 5000)
])
```

### 3️⃣ Fallback 데이터 제공

```javascript
// ai-analysis-2.html 1093줄
if (discovery?.top_20) {
    setData(discovery)
} else {
    // Fallback: /market 데이터로 기본 정보 표시
    const market = await fetch(API_BASE + '/market').then(r => r.json())
    setData({
        top_20: [],
        source: 'market_data',
        note: '상세 발굴 중...'
    })
}
```

---

## 📊 최종 상태

| 항목 | 상태 | 원인 | 해결책 |
|------|------|------|-------|
| **엔드포인트 존재** | ✅ 모두 있음 | - | - |
| **응답 구조** | ✅ 일치함 | - | - |
| **데이터 로드 실패** | ❓ 원인 미파악 | Timeout / 데이터 부족 | 에러 처리 개선 + Timeout 증가 |

---

## 🎯 권장 조치

### 즉시 (지금)
1. ai-analysis-2.html의 에러 처리 개선
2. Discovery timeout 증가
3. Fallback 데이터 추가

### 1시간 내
4. ai-analysis.html 확인
5. ai-analysis-3.html 확인
6. 각 HTML의 응답 구조 재검증

### 테스트
7. 브라우저 DevTools에서 실제 API 응답 확인
8. Network 탭에서 Timeout 여부 확인
9. Console 탭에서 에러 메시지 확인

---

## 📝 핵심 결론

✅ **Worker.js는 정상입니다!**
❌ **ai-analysis-2.html의 에러 처리가 부족합니다!**

- 엔드포인트: 모두 있음
- 응답 구조: 일치함
- 문제: 느린 API 호출 또는 데이터 부족에 대한 처리 미흡

