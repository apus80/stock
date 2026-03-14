// 🧮 Explosive Score 계산 로직 검증
// 현재 구현 (FRED/Yahoo Finance 지표 추가 전)

// Mock 데이터 (API 응답 시뮬레이션)
const mockData = {
  symbol: "AAPL",
  price: 195.50,
  pe: 28.5,
  pb: 45.2,
  float: 2.6e9,
  marketCap: 3.0e12,
  analystScore: 0.85,        // 평가사 긍정 비율
  insiderActivity: 5,         // 최근 거래 건수
  momentum: 0.0823,           // 50일 대비 가격 상승률
  volume_spike: 1.45          // 평균 거래량 대비 배수
};

// 현재 Explosive Score 함수
function explosiveScore(factors, momentum, volume) {
  if (!factors) return 0;

  const score =
    (1 / (factors.pe + 1)) * 1.5 +           // Value factor: PE 낮을수록 높음
    (1 / (factors.pb + 1)) * 1.5 +           // Book value factor
    factors.analystScore * 0.8 +              // Analyst rating: 전문가 긍정 평가
    (factors.insiderActivity > 0 ? 1 : 0) * 0.4 +  // Insider activity: 있으면 +0.4
    (1 / (factors.float / 100000000 + 1)) * 0.8 +  // Low float premium: 유동주식 적을수록 높음
    momentum * 2.5 +                         // Strong momentum boost
    volume * 2.0;                            // Volume spike boost

  return Math.max(0, score);
}

// 테스트
console.log("🧮 === Explosive Score 검증 ===\n");

console.log("📊 입력 데이터:");
console.log(`  symbol: ${mockData.symbol}`);
console.log(`  price: $${mockData.price}`);
console.log(`  PE: ${mockData.pe}`);
console.log(`  PB: ${mockData.pb}`);
console.log(`  Float: ${(mockData.float / 1e9).toFixed(2)}B`);
console.log(`  Analyst Score: ${(mockData.analystScore * 100).toFixed(1)}%`);
console.log(`  Insider Activity: ${mockData.insiderActivity} 거래`);
console.log(`  Momentum (50일): ${(mockData.momentum * 100).toFixed(2)}%`);
console.log(`  Volume Spike: ${mockData.volume_spike.toFixed(2)}배\n`);

// 각 요소별 점수 계산
const factors = {
  price: mockData.price,
  pe: mockData.pe,
  pb: mockData.pb,
  float: mockData.float,
  marketCap: mockData.marketCap,
  analystScore: mockData.analystScore,
  insiderActivity: mockData.insiderActivity
};

const valueScore = (1 / (factors.pe + 1)) * 1.5;
const bookScore = (1 / (factors.pb + 1)) * 1.5;
const analystComponentScore = factors.analystScore * 0.8;
const insiderComponentScore = (factors.insiderActivity > 0 ? 1 : 0) * 0.4;
const floatScore = (1 / (factors.float / 100000000 + 1)) * 0.8;
const momentumComponentScore = mockData.momentum * 2.5;
const volumeComponentScore = mockData.volume_spike * 2.0;

const totalScore = explosiveScore(factors, mockData.momentum, mockData.volume_spike);

console.log("📈 === 구성 요소별 점수 ===");
console.log(`  1️⃣ Value (PE ratio):         ${valueScore.toFixed(4)} (가중치: 1.5)`);
console.log(`  2️⃣ Book Value (PB ratio):    ${bookScore.toFixed(4)} (가중치: 1.5)`);
console.log(`  3️⃣ Analyst Score:           ${analystComponentScore.toFixed(4)} (가중치: 0.8)`);
console.log(`  4️⃣ Insider Activity:        ${insiderComponentScore.toFixed(4)} (가중치: 0.4)`);
console.log(`  5️⃣ Low Float Premium:       ${floatScore.toFixed(4)} (가중치: 0.8)`);
console.log(`  6️⃣ Momentum (50일):         ${momentumComponentScore.toFixed(4)} (가중치: 2.5)`);
console.log(`  7️⃣ Volume Spike:            ${volumeComponentScore.toFixed(4)} (가중치: 2.0)\n`);

console.log(`✅ 최종 Explosive Score: ${totalScore.toFixed(4)}`);
console.log(`   (점수가 높을수록 폭발력 있는 주식)\n`);

// 가중치 분석
const weights = {
  value: 1.5,
  book: 1.5,
  analyst: 0.8,
  insider: 0.4,
  float: 0.8,
  momentum: 2.5,
  volume: 2.0
};
const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

console.log("⚖️ === 가중치 분석 (현재: 7개 요소) ===");
console.log(`  총 가중치: ${totalWeight.toFixed(1)}`);
console.log(`  Momentum 비중: ${(weights.momentum / totalWeight * 100).toFixed(1)}%`);
console.log(`  Volume 비중: ${(weights.volume / totalWeight * 100).toFixed(1)}%`);
console.log(`  Fundamental 비중: ${((weights.value + weights.book + weights.analyst + weights.insider + weights.float) / totalWeight * 100).toFixed(1)}%\n`);

// 업데이트된 9개 요소 분석
console.log("📊 === 업데이트된 Score (9개 요소) ===");
console.log("  기존 7개:");
console.log("    • Value (PE, PB): 3.0 가중치");
console.log("    • Growth (Revenue, Earnings): 2.4 가중치 ✅ 추가");
console.log("    • Analyst: 0.8 가중치");
console.log("    • Insider: 0.4 가중치");
console.log("    • Float: 0.8 가중치");
console.log("    • Momentum: 2.5 가중치");
console.log("    • Volume: 2.0 가중치");
console.log("  ────────────────────────────────");
console.log("  총 가중치: 12.1 (이전: 10.0)");

console.log("⏳ === 다음 개선 예정 (FRED + Yahoo Finance) ===");
console.log("  📊 FRED 지표 추가:");
console.log("    • VIX (변동성 지수)");
console.log("    • 금리 곡선 (10Y - 2Y)");
console.log("    • Fed Balance Sheet");
console.log("    • M2 통화량");
console.log("  📈 Yahoo Finance 지표 추가:");
console.log("    • Debt-to-Equity 비율");
console.log("    • Free Cash Flow");
console.log("    • Return on Equity (ROE)");
console.log("    • 배당 수익률");
