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

## 📊 현재 데이터 소스

| 데이터 | 소스 | 주기 | 필드 |
|--------|------|------|------|
| SPY, QQQ, DIA 등 미국 주식 | FMP API | 실시간 | `price`, `changePercentage` |
| 코스피, 코스닥 | FMP API | 실시간 | `price`, `changePercentage` |
| 연방기금 잔액, 역레포 | FRED API | 일일 | `value` |
| 10년물, 2년물 수익률 | FRED API | 일일 | `value` |

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

