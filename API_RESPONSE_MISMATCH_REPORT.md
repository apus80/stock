# 🔴 API 응답 구조 불일치 분석

**검증일:** 2026-03-18
**상태:** ❌ AI분석 1,2,3의 필드 불일치 발견

---

## 📊 AI분석 2 (ai-analysis-2.html) - 3개 Widget 분석

### ✅ Widget 1: Alpha Discovery Scanner

**호출 엔드포인트:**
```
✅ /alpha/discovery          (runAlphaDiscovery)
✅ /analysis/market-regime   (getMarketRegime)
✅ /feargreed                (Alternative.me API)
```

**ai-analysis-2.html 기대 필드:**
| 엔드포인트 | 기대 필드 | 줄 번호 | 예시 |
|-----------|---------|--------|-----|
| `/alpha/discovery` | `data.top_20[]` | 1092 | `[{symbol, score, momentum, volume, pe, revenueGrowth}]` |
| " | `data.execution_time_sec` | 1173 | `12.45` |
| " | `data.analyzed` | 1173 | `90` |
| " | `data.universe_size` | 1173 | `5000` |
| `/analysis/market-regime` | `regime.regime` | 1139 | `"Risk-On"` |
| `/feargreed` | `fearGreed.score` | 1151 | `72` |
| " | `fearGreed.rating` | 1151 | `"Greed"` |

**Worker.js 실제 응답:**
```javascript
// /alpha/discovery (2061-2068줄)
{
  top_20: top20,              ✅ 있음
  execution_time_sec: ...,    ✅ 있음
  analyzed: ...,              ✅ 있음
  universe_size: ...,         ✅ 있음
  timestamp: ...,
  dataType: "alpha_discovery"
}

// /analysis/market-regime (1482-1499줄)
{
  regime: regime,             ✅ 있음 ("Risk-On", "Risk-Off", "Neutral")
  confidence: ...,
  signal: ...,
  badgeClass: ...,
  factors: [...],
  details: { spy, vix, spy_change }
  // ❌ recommendation 필드 없음!
}

// /feargreed (3187-3191줄)
{
  score: Math.round(...),     ✅ 있음
  rating: data.value_classification || null,  ✅ 있음
  timestamp: ...,
  source: 'Alternative.me'
}
```

**결론:** ✅ Widget 1 필드 일치함

---

### ⚠️ Widget 2: Market Entry Gate

**호출 엔드포인트:**
```
❌ /analysis/market-regime   (getMarketRegime)
✅ /analysis/volatility-regime (getVolatilityRegime)
✅ /analysis/credit-stress   (getCreditStress)
✅ /feargreed                (Alternative.me API)
```

**ai-analysis-2.html 기대 필드:**
| 엔드포인트 | 기대 필드 | 줄 번호 | 사용 목적 |
|-----------|---------|--------|---------|
| `/analysis/market-regime` | `regime.regime` | 1246 | Risk-On/Off 판단 |
| " | `regime.recommendation` | 1248 | 추천사항 표시 |
| `/analysis/volatility-regime` | `vol.vix` | 1252 | VIX 수준 표시 |
| " | `vol.recommendation` | 1254 | 추천사항 |
| `/analysis/credit-stress` | `credit.stress_level` | 1258 | 스트레스 레벨 |
| " | `credit.recommendation` | 1260 | 추천사항 |
| `/feargreed` | `fg.score` | 1264 | 공포탐욕 지수 |
| " | `fg.rating` | 1265 | 공포탐욕 등급 |

**Worker.js 실제 응답:**
```javascript
// /analysis/market-regime (1482-1499줄)
{
  regime: regime,             ✅ 있음
  confidence: ...,
  signal: ...,
  badgeClass: ...,
  factors: [...],
  details: { spy, vix, spy_change }
  // ❌ NO recommendation 필드! ← 1248줄에서 필요
}

// /analysis/volatility-regime (1628-1643줄)
{
  vix: data.vix,              ✅ 있음
  regime: regime,
  state: regime,
  confidence: volConfidence,
  signal: ...,
  badgeClass: ...,
  factors: [...],
  recommendation: regime === "Low" ? "적극 투자" : ...  ✅ 있음
}

// /analysis/credit-stress (1581-1593줄)
{
  stress_level: stress,       ✅ 있음 ("높음", "중간", "낮음")
  signal: ...,
  spread: ...,
  metrics: [...],
  recommendation: stress === "높음" ? ... ✅ 있음
}

// /feargreed
{
  score: Math.round(...),     ✅ 있음
  rating: data.value_classification || null,  ✅ 있음
  timestamp: ...,
  source: 'Alternative.me'
}
```

**🔴 문제 발견!**
```
❌ /analysis/market-regime에 recommendation 필드가 없음!
   - getMarketRegime 함수 (1482-1499줄)에는 recommendation 필드 없음
   - ai-analysis-2.html 1248줄에서 regime.recommendation 필요
   - Widget 2에서 "추천사항" 표시 불가
```

**결론:** ❌ Widget 2의 market-regime 필드 불일치

---

### ⚠️ Widget 3: Single Stock Deep Dive

**호출 엔드포인트:**
```
✅ /alpha?symbol=X
✅ /fundamentals/growth?symbol=X
✅ /fundamentals/income?symbol=X
✅ /fundamentals/balance?symbol=X
✅ /fundamentals/cashflow?symbol=X
✅ /fundamentals/profile?symbol=X
```

**ai-analysis-2.html 기대 필드:**
| 엔드포인트 | 기대 필드 | 줄 번호 | 사용 목적 |
|-----------|---------|--------|---------|
| `/alpha?symbol=X` | `data.alpha.data` | 1370 | 데이터 존재 확인 |
| " | `data.alpha.data.explosiveScore` | 1388 | 점수 판정 |
| `/fundamentals/cashflow` | `data.cashflow.data.freeCashFlow` | 1389 | FCF 기반 판정 |

**Worker.js 응답 구조:**
```javascript
// /alpha?symbol=X (getAlphaScore 함수 필요)
// 확인 필요 - 엔드포인트 존재하는지, 응답 구조가 맞는지

// /fundamentals/cashflow?symbol=X
// 확인 필요
```

**상태:** ❓ 아직 확인 필요

---

## 🔴 해결 방안

### 방안 A: Worker.js 수정 (권장)
1248줄에서 ai-analysis-2.html이 기대하는 필드 추가

```javascript
// worker.js getMarketRegime 함수 (1482-1500줄)
return {
  timestamp: new Date().toISOString(),
  dataType: "market_regime",
  regime: regime,
  confidence: Math.round(confidenceScore),
  signal: regime === "Risk-On" ? "🎯 공격 모드" : regime === "Risk-Off" ? "⚠️ 방어 모드" : "➡️ 중립",
  badgeClass: regime === "Risk-On" ? "bullish" : regime === "Risk-Off" ? "bearish" : "neutral",
  factors: [...],
  details: { spy, vix, spy_change },
  // ✅ 추가 필요
  recommendation: regime === "Risk-On" ? "적극 투자" : regime === "Risk-Off" ? "현금 보유" : "균형형"
}
```

### 방안 B: ai-analysis-2.html 수정
1248줄 수정:
```javascript
// ❌ 현재
recommendation: regime?.recommendation

// ✅ 수정 (실제 응답 구조에 맞춤)
recommendation: regime?.signal  // signal 필드 사용
```

---

## 📋 확인해야 할 항목

### AI분석 1 (ai-analysis.html)
- [ ] 모든 위젯의 `/analysis/*` 엔드포인트 응답 구조 확인
- [ ] 필드 일치 여부 검증

### AI분석 2 (ai-analysis-2.html)
- [ ] ❌ Widget 2의 `/analysis/market-regime` recommendation 필드 추가 필요
- [ ] Widget 3의 `/alpha?symbol=X` 응답 구조 확인
- [ ] Widget 3의 `/fundamentals/*` 응답 구조 확인

### AI분석 3 (ai-analysis-3.html)
- [ ] API 호출 여부 확인
- [ ] 필드 일치 여부 검증

---

## 🎯 다음 단계

1. **Widget 1**: 이미 필드 일치함 - 문제 없음 ✅
2. **Widget 2**: `/analysis/market-regime`에 `recommendation` 필드 추가
3. **Widget 3**: `/alpha?symbol=X`, `/fundamentals/*` 응답 구조 확인
4. **AI분석 1, 3**: 전체 엔드포인트 응답 구조 확인

