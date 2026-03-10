# InvestFlow 개발 가이드

## 📋 데이터 처리 규칙

### ❌ 금지 사항

1. **하드코딩된 값 사용 금지**
   ```javascript
   // ❌ 나쁜 예
   const kospi = 2850; // 고정된 값
   const spyPrice = 423.5;

   // ✅ 좋은 예
   const kospi = await fetchKOSPI(); // API에서 실시간 호출
   const spyPrice = marketData.spy; // 데이터베이스/API 값
   ```

2. **API 없이 임의의 숫자 입력 금지**
   - 모든 시장 데이터는 데이터 소스에서 가져와야 함
   - 테스트용 임시 값도 명확히 표시 필요

### ✅ 필수 사항

1. **값이 없을 때는 "-" 표시**
   ```javascript
   // API에서 값을 받지 못했을 때
   const kospi = apiData?.kospi || null;

   // HTML/Dashboard에서 표시
   imdSetValue('kospi', kospi || '-', 0);
   ```

2. **실시간 데이터 호출 구조**
   ```javascript
   // 주기적으로 데이터 소스에서 가져올 것
   ├─ 초기 로드: DOMContentLoaded 시 한 번
   ├─ 정기 갱신: setInterval()로 일정 주기마다
   └─ 에러 처리: null/undefined 값은 "-"로 표시
   ```

3. **데이터 소스 명시**
   ```javascript
   // ✅ 데이터 소스를 코드에 주석으로 표기
   async function getMarketData() {
     // 출처: FMP API (financialmodelingprep.com)
     const spy = await getQuote("SPY");

     // 출처: FRED API (Federal Reserve)
     const fed = await fredGet("WALCL");

     // 출처: Yahoo Finance
     const kospi = await yahooQuote("^KS11");
   }
   ```

---

## 🔗 FMP API 엔드포인트 (중요!)

### ⚠️ MUST USE: `/stable/batch-quote` (STABLE)

**FMP API 엔드포인트 종류:**
```
❌ /api/v3/quote/{symbol}           ← 사용 금지! (작동 안함)
❌ /api/v4/quote/{symbol}           ← 사용 금지!
❌ /api/stock/{symbol}/quote        ← 사용 금지! (null 반환)
✅ /stable/batch-quote?symbols=X    ← 필수 사용! (확인된 작동 버전)
```

**예시:**
```javascript
// ❌ 절대 금지
const url = `https://financialmodelingprep.com/api/v3/quote/${sym}?apikey=${FMP}`

// ✅ 필수
const url = `https://financialmodelingprep.com/stable/batch-quote?symbols=${sym}&apikey=${FMP}`
```

**이유:**
- v3, v4, /api/stock/{sym}/quote: 응답이 null 또는 작동 안함
- `/stable/batch-quote`: 가장 안정적, 응답 데이터 정상 (검증됨)

---

## 📊 현재 데이터 소스

| 데이터 | 심볼 | 소스 | 주기 | Worker 필드 | API 엔드포인트 |
|--------|------|------|------|-------------|---------|
| S&P500 (SPY), NASDAQ (QQQ), DOW (DIA) | SPY, QQQ, DIA | FMP API | 실시간 | `US_MARKET.SP500` 등 | `/stable/batch-quote?symbols=X` |
| VIX, SOX (SOXX), Russell2000 (IWM) | ^VIX, SOXX, IWM | FMP API | 실시간 | `US_MARKET.VIX` 등 | `/stable/batch-quote?symbols=X` |
| 한국 ETF (EWY) | EWY | FMP API | 실시간 | `KOREA_MARKET.EWY` | `/stable/batch-quote?symbols=X` |
| 금, 은, 원유 (WTI) | GCUSD, SIUSD, CLUSD | FMP API | 실시간 | `COMMODITIES.GOLD` 등 | `/stable/batch-quote?symbols=X` |
| USD/JPY, EUR/USD, 달러인덱스 | USDJPY, EURUSD, DX | FMP API | 실시간 | `FX.USDJPY` 등 | `/stable/batch-quote?symbols=X` |
| 섹터 ETF (XLK/XLF/XLE/XLV/XLY/XLI/XLU/XLRE) | XLK~XLRE | FMP API | 실시간 | `SECTORS.TECHNOLOGY` 등 | `/stable/batch-quote?symbols=X` |
| HYG (하이일드), LQD (투자등급), VTI, TLT | HYG, LQD, VTI, TLT | FMP API | 실시간 | `CREDIT`, `BREADTH` | `/stable/batch-quote?symbols=X` |
| 연방준비 잔액 (Fed Balance) | WALCL | FRED API | 일일 | `LIQUIDITY.FED_BALANCE` (raw millions) | `/fred/series/observations` |
| 역레포 (Reverse Repo) | RRPONTSYD | FRED API | 일일 | `LIQUIDITY.REVERSE_REPO` (raw millions) | `/fred/series/observations` |
| 재무부 일반 계정 (TGA) | WTREGEN | FRED API | 일일 | `LIQUIDITY.TGA` (raw millions) | `/fred/series/observations` |
| 10년물, 2년물 수익률 | DGS10, DGS2 | FRED API | 일일 | `RATES.US10Y`, `RATES.US2Y` (%) | `/fred/series/observations` |
| M2 통화량 | M2SL | FRED API | 월간 | `MACRO_BASE.M2` (billions×1000=millions) | `/fred/series/observations` |
| 10년 기대인플레이션 | T10YIE | FRED API | 일일 | `MACRO_BASE.INFLATION_EXPECTATION` (%) | `/fred/series/observations` |
| CPI, 실업률 | CPIAUCSL, UNRATE | FRED API | 월간 | `MACRO_BASE.CPI`, `MACRO_BASE.UNEMPLOYMENT` | `/fred/series/observations` |
| 실질 GDP, 산업생산, 비농업 고용 | GDPC1, INDPRO, PAYEMS | FRED API | 월간 | `MACRO_INDICATORS.*` | `/fred/series/observations` |
| 소비자심리, PCE 인플레이션 | UMCSENT, PCEPILFE | FRED API | 월간 | `MACRO_INDICATORS.*` | `/fred/series/observations` |

---

## 🔄 데이터 흐름

```
[API 호출]
    ↓
[응답 확인 - null 체크]
    ↓
[포맷팅 - toFixed, 단위 변환]
    ↓
[Dashboard 표시]
    ├─ 값 있음 → 숫자 + 단위 표시
    └─ 값 없음 → "-" 표시
    ↓
[주기적 갱신 - setInterval]
    ↓
[다시 [API 호출]로]
```

---

## 🚨 흔한 실수

### 1. 센트 단위 변환 문제
```javascript
// FMP API는 센트 단위로 반환 (한국 지수)
// 285000 = 2850.00 (지수 단위)

// ✅ 올바른 처리
price: marketData.kospi ? Math.round(marketData.kospi * 100) : null
```

### 2. 포맷팅 누락
```javascript
// ❌ 나쁜 예
response.spy = data.spy; // 16.235234234 (소숫점 너무 많음)

// ✅ 좋은 예
response.spy = data.spy ? parseFloat(data.spy.toFixed(2)) : null; // 16.24
```

### 3. 에러 처리 누락
```javascript
// ❌ API 실패 시 crash
const data = await getQuote("SPY"); // null 반환 가능
imdSetValue('sp500', data.price, 2); // Error!

// ✅ null 체크
const data = await getQuote("SPY");
if (data?.price) {
  imdSetValue('sp500', data.price, 2);
} else {
  imdSetValue('sp500', '-', 2); // 기본값
}
```

---

## 💾 캐싱 패턴 (UX 개선)

### 문제
```
현재: 페이지 로드 → 빈 화면 → API 호출 → 값 표시
UX:  깜빡임, 불편한 대기 시간
```

### 해결책
```
개선: 페이지 로드 → 캐시된 값 표시 → API 호출 (백그라운드) → 새 값으로 업데이트
UX:  즉시 이전 데이터 표시, 부드러운 업데이트
```

### 구현 패턴

```javascript
// 1️⃣ 초기화: 캐시에서 값 로드
function imdLoadKorea() {
    // Step 1: 캐시된 값 먼저 로드
    const cachedData = localStorage.getItem('marketData_KOREA');
    if (cachedData) {
        const data = JSON.parse(cachedData);
        imdLoadKoreaDisplay(data); // 기존 값 표시
        imdSetStatus('kospi', 'updating'); // "업데이트 중" 표시
    }

    // Step 2: API 호출 (백그라운드)
    workerFetchMarket().then(function(data) {
        if (data && data.KOREA_MARKET) {
            imdLoadKoreaDisplay(data); // 새 값으로 업데이트
            localStorage.setItem('marketData_KOREA', JSON.stringify(data)); // 캐시 갱신
            imdSetStatus('kospi', 'ok'); // 업데이트 완료
        }
    }).catch(function(err) {
        console.warn('API 실패, 캐시 값 유지:', err);
        imdSetStatus('kospi', 'error'); // 에러 표시
    });
}

// 2️⃣ 데이터 표시 함수 (분리)
function imdLoadKoreaDisplay(data) {
    var kr = data.KOREA_MARKET;
    if (kr.KOSPI && kr.KOSPI.price) {
        imdSetValue('kospi', kr.KOSPI.price, 0);
        if (kr.KOSPI.change) imdSetChange('kospi', kr.KOSPI.change, 'pct');
    }
    // ... 기타 항목
}
```

### 상태 표시 (imdSetStatus)
```javascript
// 로딩 상태 정의
const STATUS = {
    'ok': '✅',         // 정상, 최신
    'updating': '⏳',   // 업데이트 중
    'error': '❌',      // 에러 발생
    'stale': '⚠️'      // 오래된 값 (캐시)
};

function imdSetStatus(id, state) {
    const elem = document.getElementById(id + '_status');
    if (elem) {
        elem.textContent = STATUS[state];
        elem.className = 'status-' + state;
    }
}
```

### LocalStorage 구조
```javascript
{
  "marketData_KOREA": {
    "KOREA_MARKET": {...},
    "timestamp": "2026-03-09T10:30:00Z"
  },
  "marketData_US": {
    "US_MARKET": {...},
    "timestamp": "2026-03-09T10:30:00Z"
  }
}
```

### 캐시 만료 정책
```javascript
const CACHE_EXPIRY = 30 * 60 * 1000; // 30분

function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - new Date(data.timestamp).getTime();

    if (age > CACHE_EXPIRY) {
        localStorage.removeItem(key); // 만료된 캐시 삭제
        return null;
    }
    return data;
}
```

---

## 📝 체크리스트 (코드 리뷰 전)

- [ ] 모든 시장 데이터는 API/DB에서 호출되는가?
- [ ] 하드코딩된 숫자 값이 없는가?
- [ ] null/undefined 값 처리가 되어있는가?
- [ ] 값이 없을 때 "-" 표시되는가?
- [ ] 데이터 소스가 주석으로 표기되어 있는가?
- [ ] 포맷팅(소숫점, 단위)이 올바른가?
- [ ] 주기적 갱신 (setInterval) 있는가?

---

## 🔗 참고

- **현재 worker.js 구조**: `/market` 엔드포인트 → 실시간 API 호출 → 포맷팅 → 응답
- **index.html 갱신 주기**:
  - 시장 데이터: 5분마다 (`setInterval(..., 300000)`)
  - 경제지표: 4시간마다 (`setInterval(..., 4*60*60*1000)`)

---

## 📐 Worker `/market` 응답 구조 (index.html 기대 형식)

```json
{
  "KOREA_MARKET": {
    "EWY": { "price": 123.45, "changePercentage": -0.12 }
  },
  "US_MARKET": {
    "SP500":      { "price": 560.12, "changePercentage": 0.45 },
    "NASDAQ":     { "price": 480.34, "changePercentage": 0.67 },
    "DOW":        { "price": 440.56, "changePercentage": 0.23 },
    "VIX":        { "price": 18.45,  "changePercentage": -2.10 },
    "SOX":        { "price": 210.34, "changePercentage": 1.23 },
    "RUSSELL2000":{ "price": 220.45, "changePercentage": 0.89 }
  },
  "COMMODITIES": {
    "GOLD":   { "price": 2900,  "changePercentage": 0.32 },
    "SILVER": { "price": 32.45, "changePercentage": 0.15 },
    "OIL":    { "price": 71.23, "changePercentage": -1.20 }
  },
  "FX": {
    "USDJPY": { "price": 149.50, "changePercentage": 0.05 },
    "EURUSD": { "price": 1.0823, "changePercentage": -0.10 },
    "DXY":    { "price": 104.32, "changePercentage": 0.08 }
  },
  "LIQUIDITY": {
    "FED_BALANCE": 7234567,
    "REVERSE_REPO": 123456,
    "TGA": 567890
  },
  "RATES": {
    "US10Y": 4.28,
    "US2Y":  4.15,
    "YIELD_CURVE": 0.130
  },
  "SECTORS": {
    "TECHNOLOGY": { "price": 230.12, "changePercentage": 0.56 }
  },
  "MACRO_BASE": {
    "CPI": 314.12,
    "INFLATION_EXPECTATION": 2.30,
    "UNEMPLOYMENT": 4.10,
    "M2": 21500000,
    "REAL_RATES": 1.98
  },
  "MACRO_INDICATORS": {
    "CONSUMER_SENTIMENT": 64.7,
    "REAL_GDP": 23450.0,
    "INDUSTRIAL_PRODUCTION": 103.2,
    "NONFARM_PAYROLLS": 158400,
    "PCE_INFLATION": 2.6
  }
}
```

### ⚠️ 단위 주의사항 (index.html 변환 로직)
```javascript
// LIQUIDITY: worker는 raw FRED 값 전달, index.html이 변환
FED_BALANCE  → /1,000,000 → T (Trillions)   // WALCL: millions 단위
REVERSE_REPO → /1,000     → B (Billions)    // RRPONTSYD: millions 단위
TGA          → /1,000,000 → T (Trillions)   // WTREGEN: millions 단위

// MACRO_BASE.M2: M2SL(billions) × 1000 → millions 저장
M2           → /1,000,000 → T (Trillions)   // index.html이 변환

// RATES: 직접 숫자(%) 전달 — 객체 {value: X} 형식 금지!
US10Y: 4.28  // ✅ 올바름
US10Y: { value: 4.28 }  // ❌ 금지 (index.html이 인식 못함)
```

