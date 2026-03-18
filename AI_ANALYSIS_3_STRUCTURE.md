# 🎯 AI분석 3 (ai-analysis-3.html) 상세 구조 분석

**검증일:** 2026-03-18
**상태:** ✅ 모든 위젯 엔드포인트 및 필드 검증 완료

---

## 📊 핵심 발견

### ⚠️ 주의: Hardcoded URL 사용
```javascript
// ❌ API_BASE를 사용하지 않음
fetch('https://fmp-proxy.aiinvestflow.workers.dev/market')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/discovery')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/alpha-scanner')
```

**문제:** 개발 환경의 `/api/*` 경로를 사용하지 않고 완전 외부 hardcoded URL 사용
**영향:** Worker.js와 분리됨 (Localhost 개발 시 연결 불가)

---

## 🎨 11개 Widget 완전 분석

### Widget 1: 💧 매크로 유동성 (Fed 잔액 + RRP + TGA)

**호출 엔드포인트:**
```
✅ /market (또는 https://fmp-proxy.aiinvestflow.workers.dev/market)
```

**필드 사용:**
| 필드 | 출처 | 데이터 타입 | 계산식 |
|------|------|-----------|-------|
| `marketData.LIQUIDITY.FED_BALANCE` | Worker `/market` | millions | `(fed / 1e6).toFixed(1)` → T |
| `marketData.LIQUIDITY.REVERSE_REPO` | Worker `/market` | millions | `(rrp).toFixed(1)` → B |
| `marketData.LIQUIDITY.TGA` | Worker `/market` | millions | 순 유동성 계산에 사용 |

**계산 로직 (732-758줄):**
```javascript
const fed = marketData.LIQUIDITY.FED_BALANCE || 0;        // T 단위
const rrp = marketData.LIQUIDITY.REVERSE_REPO || 0;       // B 단위
const tga = marketData.LIQUIDITY.TGA || 0;                // T 단위
const netLiq = fed - rrp - tga;                           // 순 유동성
```

**상태:** ✅ 필드 일치함

---

### Widget 2: 🔄 섹터 동향 (11개 섹터 데이터)

**호출 엔드포인트:**
```
✅ /market
```

**필드 사용:**
| 필드 | 타입 | 예시 |
|------|------|-----|
| `sectorData.SECTORS` | Object | `{ TECHNOLOGY: {price, changePercentage}, ... }` |
| `data.price` | number | 섹터 가격 |
| `data.changePercentage` | number | 섹터 변화율 |

**계산 로직 (765-781줄):**
```javascript
const sectorData = await fetch('.../market').then(r => r.json());
for (const [name, data] of Object.entries(sectors)) {
    const change = data.changePercentage || 0;
    // 테이블 렌더링
}
```

**상태:** ✅ 필드 일치함

---

### Widget 3: 📊 신용 스트레스 (HYG + LQD)

**호출 엔드포인트:**
```
✅ /market
```

**필드 사용:**
| 필드 | 타입 | 값 |
|------|------|-----|
| `creditData.BONDS.HYG.price` | number | 하이일드 채권 가격 |
| `creditData.BONDS.HYG.change` | number | 하이일드 채권 변화% |
| `creditData.BONDS.LQD.price` | number | 투자등급 채권 가격 |
| `creditData.BONDS.LQD.change` | number | 투자등급 채권 변화% |

**계산 로직 (785-809줄):**
```javascript
const creditData = await fetch('.../market').then(r => r.json());
const hyg = creditData.BONDS.HYG || {};
const lqd = creditData.BONDS.LQD || {};
// HYG/LQD 테이블 표시
```

**상태:** ✅ 필드 일치함

---

### Widget 4: 🚀 폭발적 성장 주식 발굴 (상위 10개)

**호출 엔드포인트:**
```
✅ /alpha/discovery
```

**필드 사용:**
| 필드 | 타입 | 줄 번호 |
|------|------|---------|
| `alphaData.top_20[].symbol` | string | 814 |
| `alphaData.top_20[].score` | number | 821 |
| `alphaData.top_20[].price` | number | 822 |
| `alphaData.top_20[].momentum` | number | 823 |
| `alphaData.top_20[].revenueGrowth` | number | 824 |
| `alphaData.analyzed` | number | 828 |
| `alphaData.universe_size` | number | 828 |

**데이터 검증 (814줄):**
```javascript
if (alphaData && alphaData.top_20 && alphaData.top_20.length > 0)
```

**상태:** ✅ 필드 일치함

---

### Widget 5: 🏆 궁극의 주식 발굴 엔진 (PE + 수익률)

**호출 엔드포인트:**
```
✅ /alpha/discovery
```

**필드 사용:**
| 필드 | 타입 | 줄 번호 |
|------|------|---------|
| `ultimateData.top_20[].symbol` | string | 843 |
| `ultimateData.top_20[].score` | number | 844 |
| `ultimateData.top_20[].price` | number | 845 |
| `ultimateData.top_20[].pe` | number | 846 |
| `ultimateData.top_20[].revenueGrowth` | number | 847 |

**데이터 검증 (837줄):**
```javascript
if (ultimateData && ultimateData.top_20 && ultimateData.top_20.length > 0)
```

**상태:** ✅ 필드 일치함

---

### Widget 6: ⚡ 초고성장 기업 발굴 (수익+EPS 성장)

**호출 엔드포인트:**
```
✅ /alpha/discovery (from data parameter)
```

**필드 사용:**
| 필드 | 타입 | 줄 번호 |
|------|------|---------|
| `data.top_20[].symbol` | string | 869 |
| `data.top_20[].sector` | string | 870 |
| `data.top_20[].revenueGrowth` | number | 871 |
| `data.top_20[].epsGrowth` | number | 872 |
| `data.top_20[].profitMargin` | number | 873 |
| `data.top_20[].pe` | number | 874 |
| `data.top_20[].score` | number | 875 |

**데이터 검증 (859줄):**
```javascript
if (data && data.top_20 && data.top_20.length > 0)
```

**상태:** ✅ 필드 일치함

---

### Widget 7: 💰 기관 매집 종목 (섹터모멘텀 + 성장)

**호출 엔드포인트:**
```
✅ /alpha/discovery (data parameter)
✅ /market (market parameter)
```

**필드 사용:**
| 필드 | 소스 | 타입 | 줄 번호 |
|------|------|------|---------|
| `data.top_20[].symbol` | discovery | string | 914 |
| `data.top_20[].sector` | discovery | string | 915 |
| `data.top_20[].revenueGrowth` | discovery | number | 916 |
| `data.top_20[].epsGrowth` | discovery | number | 917 |
| `data.top_20[].operatingMargin` | discovery | number | 918 |
| `data.top_20[].score` | discovery | number | 920 |
| `market.US_MARKET.SP500.changePercentage` | market | number | 892 |
| `market.SECTORS[stock.sector].changePercentage` | market | number | 896 |

**계산 로직 (891-903줄):**
```javascript
const spyReturn = market.US_MARKET?.SP500?.changePercentage || 0;
const sectorReturn = market.SECTORS?.[stock.sector]?.changePercentage || 2;
const sectorMomentum = sectorReturn - spyReturn;
```

**데이터 검증 (891줄):**
```javascript
if (market && data && data.top_20)
```

**상태:** ✅ 필드 일치함

---

### Widget 8: 🎯 섹터 로테이션 리더 (상대강도)

**호출 엔드포인트:**
```
✅ /alpha/discovery (data)
✅ /market (market)
```

**필드 사용:**
| 필드 | 소스 | 타입 |
|------|------|------|
| `data.top_20[].symbol` | discovery | string |
| `data.top_20[].sector` | discovery | string |
| `data.top_20[].revenueGrowth` | discovery | number |
| `data.top_20[].epsGrowth` | discovery | number |
| `data.top_20[].score` | discovery | number |
| `market.US_MARKET.SP500.changePercentage` | market | number |
| `market.SECTORS[stock.sector].changePercentage` | market | number |

**상태:** ✅ 필드 일치함

---

### Widget 9: 💧 유동성 수혜 종목 (Liquidity Driven)

**호출 엔드포인트:**
```
✅ /alpha/discovery (data)
✅ /market (market)
```

**필드 사용:**
| 필드 | 소스 | 타입 | 줄 번호 |
|------|------|------|---------|
| `market.LIQUIDITY.FED_BALANCE` | market | number | 982 |
| `market.LIQUIDITY.REVERSE_REPO` | market | number | 983 |
| `market.MACRO_BASE.M2` | market | number | 984 |
| `market.US_MARKET.VIX.price` | market | number | 985 |
| `data.top_20[].revenueGrowth` | discovery | number | 1001 |
| `data.top_20[].epsGrowth` | discovery | number | 1002 |
| `data.top_20[].score` | discovery | number | 1005 |

**계산 로직 (988-989줄):**
```javascript
const liquidityIndex = Math.min(100,
    (fedBal / 5000000) * 50 +
    (m2Val / 20000000) * 30 +
    Math.max(0, 100 - reversRepo / 100) * 20);
const riskScore = Math.min(100, (100 - vix * 3));
```

**상태:** ✅ 필드 일치함

---

### Widget 10: 🚀 통합 발굴 엔진 (Investflow Discovery)

**호출 엔드포인트:**
```
✅ /alpha/discovery (data)
✅ /market (market)
```

**필드 사용:**
| 필드 | 소스 | 타입 | 줄 번호 |
|------|------|------|---------|
| `market.US_MARKET.SP500.changePercentage` | market | number | 1023 |
| `market.US_MARKET.VIX.price` | market | number | 1024 |
| `market.SECTORS[stock.sector].changePercentage` | market | number | 1031 |
| `data.top_20[].symbol` | discovery | string | 1048 |
| `data.top_20[].sector` | discovery | string | 1049 |
| `data.top_20[].revenueGrowth` | discovery | number | 1050 |
| `data.top_20[].epsGrowth` | discovery | number | 1051 |
| `data.top_20[].roe` | discovery | number | 1052 |
| `data.top_20[].score` | discovery | number | 1055 |

**상태:** ✅ 필드 일치함

---

### Widget 11: 🔬 Alpha Scanner (헤지펀드급 7-Module)

**호출 엔드포인트:**
```
✅ /alpha/alpha-scanner (POST)
```

**필드 사용:**
| 필드 | 타입 | 줄 번호 |
|------|------|---------|
| `scannerData.top_20` | array | 1081, 1091 |
| `scannerData.top_20[].symbol` | string | 1135 |
| `scannerData.top_20[].companyName` | string | 1136 |
| `scannerData.top_20[].price` | number | 1138 |
| `scannerData.top_20[].change` | number | 1138 |
| `scannerData.top_20[].totalScore` | number | 1118, 1141 |
| `scannerData.top_20[].breakoutProbability` | number | 1119 |
| `scannerData.top_20[].modules` | array | (7개 모듈 스코어) |
| `scannerData.macro.riskMode` | string | 1096 |
| `scannerData.macro.multiplier` | number | 1104 |
| `scannerData.macro.vix` | number | 1107 |
| `scannerData.macro.hySpread` | number | 1107 |
| `scannerData.macro.us10y` | number | 1107 |
| `scannerData.deep_analyzed` | number | 1112 |
| `scannerData.qualified` | number | 1112 |
| `scannerData.execution_time_sec` | number | 1112 |

**데이터 검증 (1081줄):**
```javascript
if (!scannerData || !Array.isArray(scannerData.top_20)) {
    throw new Error('Invalid response structure: missing top_20 array');
}
```

**7-Module Scoring (1217줄):**
```
Earnings Momentum 25%
Fundamental Acceleration 20%
Cash Flow Quality 15%
Balance Sheet 10%
Float Compression 10%
Valuation 10%
Macro Overlay 10%
```

**상태:** ✅ 필드 일치함

---

## ✅ 최종 검증 결과

| Widget | 호출 엔드포인트 | 필드 검증 | 상태 |
|--------|----------------|---------|------|
| 1 | `/market` | LIQUIDITY.* | ✅ OK |
| 2 | `/market` | SECTORS.* | ✅ OK |
| 3 | `/market` | BONDS.* | ✅ OK |
| 4 | `/alpha/discovery` | top_20[] | ✅ OK |
| 5 | `/alpha/discovery` | top_20[].pe | ✅ OK |
| 6 | `/alpha/discovery` | top_20[].profitMargin | ✅ OK |
| 7 | `/alpha/discovery` + `/market` | sector momentum | ✅ OK |
| 8 | `/alpha/discovery` + `/market` | relative strength | ✅ OK |
| 9 | `/alpha/discovery` + `/market` | liquidity index | ✅ OK |
| 10 | `/alpha/discovery` + `/market` | integrated score | ✅ OK |
| 11 | `/alpha/alpha-scanner` | totalScore, modules | ✅ OK |

---

## 🔴 문제 사항

### 1️⃣ Hardcoded URL (심각)

**현재:**
```javascript
fetch('https://fmp-proxy.aiinvestflow.workers.dev/market')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/discovery')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/alpha-scanner')
```

**필요 수정:**
```javascript
const API_BASE = 'http://localhost:8787/api'; // 개발 환경
// 또는
const API_BASE = '/api'; // 프로덕션

fetch(API_BASE + '/market')
fetch(API_BASE + '/alpha/discovery')
fetch(API_BASE + '/alpha/alpha-scanner')
```

**영향:**
- Localhost 개발 환경에서 작동 불가
- 프로덕션 hardcoded URL 의존성 높음

---

## 📋 API_BASE 변경 필요 위치

```javascript
// 674줄, 675줄: loadAllWidgets()
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/discovery')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/market')

// 732줄, 766줄, 785줄, 813줄, 836줄: loadWidgetData()
fetch('https://fmp-proxy.aiinvestflow.workers.dev/market')
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/discovery')

// 1074줄: Widget 11
fetch('https://fmp-proxy.aiinvestflow.workers.dev/alpha/alpha-scanner', ...)
```

---

## 🎯 필요 조치

### 즉시 (필수)
1. API_BASE 정의 추가 (파일 상단)
2. Hardcoded URL → API_BASE로 변경
3. API_BASE 설정 (localhost vs production)

### 검증
4. ai-analysis-1.html도 동일 패턴인지 확인
5. 모든 HTML이 worker.js의 `/api/*` 경로 사용하도록 통일

---

## 📊 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────┐
│  ai-analysis-3.html (11개 Widget)       │
└─────────┬───────────────────────────────┘
          │
          ├─→ /market (Widget 1-3, 7-10)
          │    └─→ LIQUIDITY, SECTORS, BONDS, US_MARKET.*, MACRO_BASE.*
          │
          ├─→ /alpha/discovery (Widget 4-10)
          │    └─→ top_20[], analyzed, universe_size
          │
          └─→ /alpha/alpha-scanner (Widget 11)
               └─→ top_20[], macro.*, execution_time_sec
```

