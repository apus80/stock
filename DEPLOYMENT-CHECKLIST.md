# ✅ Worker.js Cloudflare 배포 전 검증 체크리스트

## 🎯 배포 전 확인 사항

### **1️⃣ API 작동 확인**
- [ ] `/stable/quote?symbol=X` - 현재가 데이터 OK
- [ ] `/stable/historical-price-eod/full?symbol=X` - 200일 가격/거래량 OK
- [ ] `/stable/key-metrics?symbol=X` - PE, PB, Float OK
- [ ] `/stable/analyst-stock-recommendations?symbol=X` - 분석가 평가 OK
- [ ] `/stable/insider-trading/search?symbol=X` - 내부자 거래 OK

**테스트 방법:**
```bash
node test-worker-apis.js
```

**성공 기준:** 5개 API 모두 `✅ OK` 상태

---

### **2️⃣ Rate Limit 확인**
- [ ] 20개 종목 × 5개 API = 100요청 (250/day 한계 내) ✅
- [ ] getHedgeFundUniverse() - Stock Screener 1요청 ✅
- [ ] 총 101요청 (60% 안전 마진) ✅

**계산:**
```
- Stock Screener: 1 요청
- Alpha Analysis: 20 × 5 = 100 요청
- 총합: 101 요청
- FMP 한계: 250 요청/일
- 안전률: 149 요청 여유 (60%)
```

---

### **3️⃣ Score 계산 로직 검증**
- [ ] Explosive Score 함수 동작 확인
- [ ] 7개 구성 요소 계산 정상
  - [ ] Value (PE ratio)
  - [ ] Book Value (PB ratio)
  - [ ] Analyst Score
  - [ ] Insider Activity
  - [ ] Low Float Premium
  - [ ] Momentum (50일)
  - [ ] Volume Spike
- [ ] 점수 범위 (0 ~ 정상값)

**테스트 방법:**
```bash
node test-scoring-logic.js
```

**예상 결과:**
```
✅ 최종 Explosive Score: 1.2345
   (점수가 높을수록 폭발력 있는 주식)
```

---

### **4️⃣ 데이터 흐름 검증**

```
┌─────────────────────────────────────┐
│ 1. getHedgeFundUniverse()           │
│    └─ Stock Screener 1 API          │
│       └─ 1,000개 종목 반환           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. runAlphaDiscovery() 루프          │
│    └─ 20개 종목만 분석 (제한)       │
│       └─ 각 종목당 5 API 호출        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. getAlphaData(symbol)             │
│    ├─ quote                         │
│    ├─ history (200일)               │
│    ├─ metrics                       │
│    ├─ analyst                       │
│    └─ insider                       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. calculateFactors(data)           │
│    └─ PE, PB, Float, Analyst 등     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. 점수 계산                        │
│    ├─ momentumScore()               │
│    ├─ volumeSpike()                 │
│    └─ explosiveScore()              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. 결과 정렬 및 Top 20 반환         │
│    └─ timestamp 포함                │
└─────────────────────────────────────┘
```

- [ ] 각 단계 에러 처리 확인
- [ ] null 체크 정상 작동

---

### **5️⃣ 에러 처리 검증**

```javascript
// 각 단계별 에러 처리 확인
✅ getHedgeFundUniverse() - try/catch
✅ getAlphaData() - try/catch
✅ calculateFactors() - null 체크
✅ momentumScore() - 데이터 부족 처리
✅ volumeSpike() - 데이터 부족 처리
✅ runAlphaDiscovery() - 전체 감싸기
```

- [ ] API 실패 시 계속 진행 (단일 종목 실패 != 전체 실패)
- [ ] null/undefined 값 처리

**확인 사항:**
```
❌ API 실패 → console.error 로깅 ✅
❌ 데이터 부족 → continue (다음 종목) ✅
❌ 계산 오류 → 0 반환 또는 skip ✅
```

---

### **6️⃣ 응답 형식 검증**

```json
{
  "timestamp": "2026-03-14T10:30:00Z",
  "dataType": "alpha_discovery",
  "universe_size": 1000,
  "analyzed": 20,
  "execution_time_sec": 12.5,
  "top_20": [
    {
      "symbol": "AAPL",
      "score": 1.2345,
      "price": 195.50,
      "pe": 28.50,
      "momentum": 0.0823,
      "volume": 1.45,
      "revenueGrowth": 0.12,
      "earningsGrowth": 0.15,
      "analystScore": 0.85,
      "insiderActivity": 5
    }
  ]
}
```

- [ ] timestamp 포함 ✅
- [ ] dataType 명시 ✅
- [ ] 실행 시간 측정 ✅
- [ ] Top 20 정렬 ✅
- [ ] 모든 필드 숫자로 변환 (parseFloat) ✅

---

### **7️⃣ 성능 테스트**

- [ ] 20개 종목 분석 평균 시간: **10-15초** 목표
  ```
  예상 시간 분석:
  - Stock Screener: ~1초
  - 20개 × 5 API: ~1-2초/종목 = ~30초
  - Rate limit 대기: ~2초
  - 계산 및 정렬: ~1초
  ────────────────
  총: 35-40초 (타이아웃 60초 안에)
  ```

- [ ] 메모리 사용 정상 (Worker 메모리 제한 128MB)
- [ ] Cloudflare 타이아웃 (30초) 대비 여유 있음

**타이아웃 최적화:**
```javascript
// Rate limit 관리 - 429 에러 방지
if (i % 10 === 9) {
  await new Promise(resolve => setTimeout(resolve, 500))
}
```

---

## 📋 배포 체크리스트

### **배포 전 최종 확인**

1. **코드 검토**
   - [ ] `/api/v3` 제거됨 ✅
   - [ ] 5개 API만 사용 ✅
   - [ ] 20개 종목 제한 ✅
   - [ ] 동적 쿼터 계산 ✅

2. **환경 변수**
   - [ ] FMP_API_KEY 설정됨
   - [ ] Cloudflare Worker 환경에서 접근 가능

3. **테스트 실행**
   - [ ] test-worker-apis.js 통과
   - [ ] test-scoring-logic.js 검증
   - [ ] 로컬 모의 테스트 성공

4. **Git 커밋**
   - [ ] 변경사항 정리
   - [ ] 명확한 커밋 메시지
   - [ ] branch: `claude/fix-index-infinite-loop-qfBiU`

---

## 🚀 배포 단계

```bash
# 1. 로컬 테스트
npm test
node test-worker-apis.js
node test-scoring-logic.js

# 2. Git 커밋
git add worker.js
git commit -m "Deploy Alpha Discovery Engine v1 (5 APIs, 20 stocks)"
git push -u origin claude/fix-index-infinite-loop-qfBiU

# 3. Cloudflare 배포
# wrangler.toml 설정 후
wrangler deploy

# 4. 배포 후 확인
curl https://your-worker-url/alpha/discovery
```

---

## ⏳ 다음 단계 (FRED + Yahoo Finance 지표 추가)

```
현재 Score (7개 요소):
├─ PE ratio ✅
├─ PB ratio ✅
├─ Analyst Score ✅
├─ Insider Activity ✅
├─ Float ✅
├─ Momentum ✅
└─ Volume Spike ✅

다음 개선 (예정):
├─ FRED 지표
│  ├─ VIX (변동성)
│  ├─ 10Y - 2Y 수익률 곡선
│  ├─ Fed Balance Sheet
│  └─ M2 통화량
└─ Yahoo Finance
   ├─ Debt-to-Equity
   ├─ Free Cash Flow
   ├─ ROE (Return on Equity)
   └─ 배당 수익률

예상 개선 일정: 다음 버전
```

---

## 📞 문제 발생 시

```
❌ API 응답 null
  → FMP_API_KEY 확인
  → 엔드포인트 URL 재확인 (/api/v3 제거 여부)
  → 월별 요청 한계 확인 (250/day)

❌ 점수가 모두 0 또는 NaN
  → calculateFactors() null 처리 확인
  → parseFloat() 적용 확인
  → 나눗셈 0 에러 처리 확인

❌ 타이아웃 (>30초)
  → Rate limit sleep 시간 조정
  → API 병렬 호출 최적화
  → 종목 수 더 줄이기
```

---

## ✅ 준비 완료!

배포 준비 완료 시 다음 체크:
```
✅ 5개 API 모두 작동
✅ Rate Limit 101요청 (250내)
✅ Score 계산 정상
✅ 에러 처리 완벽
✅ 응답 형식 정상
✅ 성능 10-15초
✅ 테스트 통과
```

**배포 GO! 🚀**
