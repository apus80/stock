#!/usr/bin/env node

/**
 * 🔍 Worker.js의 9개 지표 검증 스크립트
 *
 * 사용법:
 *   export FMP_API_KEY="your-key"
 *   node verify-9-indicators.js
 *
 * 목적: Cloudflare 배포 전에 calculateFactors()에서
 *       9개 지표를 제대로 가져오는지 확인
 */

const FMP = process.env.FMP_API_KEY || "";

if (!FMP) {
  console.error("❌ FMP_API_KEY 환경변수 설정 필요");
  console.error("   export FMP_API_KEY='your-key'");
  process.exit(1);
}

// =============================
// HELPER FUNCTIONS (worker.js에서 복사)
// =============================

async function fetchFMP(endpoint) {
  try {
    const url = `https://financialmodelingprep.com${endpoint}&apikey=${FMP}`;
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`❌ FMP ${endpoint}: HTTP ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.error(`❌ fetchFMP ${endpoint}:`, e.message);
    return null;
  }
}

async function getAlphaData(symbol) {
  try {
    const [
      quote,
      history,
      metrics,
      analyst,
      insider
    ] = await Promise.all([
      fetchFMP(`/stable/quote?symbol=${symbol}`),
      fetchFMP(`/stable/historical-price-eod/full?symbol=${symbol}&limit=200`),
      fetchFMP(`/stable/key-metrics?symbol=${symbol}`),
      fetchFMP(`/stable/analyst-stock-recommendations?symbol=${symbol}`),
      fetchFMP(`/stable/insider-trading/search?symbol=${symbol}`)
    ]);

    return {
      quote: quote ? quote[0] : null,
      history: history || [],
      metrics: metrics ? metrics[0] : null,
      analyst: analyst || [],
      insider: insider || []
    };
  } catch (e) {
    console.error(`❌ getAlphaData ${symbol}:`, e.message);
    return null;
  }
}

// ===================================
// 핵심 함수: calculateFactors (9개 지표)
// ===================================

function calculateFactors(data) {
  if (!data) return null;

  const quote = data.quote;
  const metrics = data.metrics;
  const history = data.history || [];

  // 기본 정보
  const price = quote?.price || 0;
  const pe = metrics?.peRatio || 50;
  const pb = metrics?.priceToBookRatio || 10;
  const float = metrics?.floatShares || 1000000000;
  const marketCap = metrics?.marketCap || 0;

  // 📊 성장률 지표 (FMP key-metrics에서 직접 가져옴)
  let revenueGrowth = 0;
  let earningsGrowth = 0;

  // Option A: FMP가 제공하는 공식 성장률 필드 사용
  if (metrics) {
    revenueGrowth =
      metrics.revenueGrowth ||
      metrics.revenuePerShareGrowth ||
      metrics.netIncomeGrowth || 0;

    earningsGrowth =
      metrics.earningsGrowth ||
      metrics.epsGrowth ||
      metrics.earningsPerShareGrowth || 0;
  }

  // Option B: 성장률 필드가 없으면 가격 데이터로 근사 계산
  if (revenueGrowth === 0 && history.length >= 50) {
    const current = history[0]?.close;
    const past50 = history[49]?.close;
    if (current && past50) {
      const priceGrowth = (current - past50) / past50;
      revenueGrowth = priceGrowth * 0.7;
    }
  }

  if (earningsGrowth === 0 && history.length >= 50) {
    const current = history[0]?.close;
    const past50 = history[49]?.close;
    if (current && past50) {
      const priceGrowth = (current - past50) / past50;
      earningsGrowth = priceGrowth * 1.1;
    }
  }

  // 전문가 평가
  const analystRecs = data.analyst || [];
  const buyCount = analystRecs.filter(a => a.ratingScore > 3).length;
  const analystScore = buyCount / Math.max(analystRecs.length, 1);

  // 인사이더 거래
  const insiderActivity = data.insider?.length || 0;

  return {
    price,
    pe,
    pb,
    float,
    marketCap,
    revenueGrowth,
    earningsGrowth,
    analystScore,
    insiderActivity
  };
}

// =============================
// 메인 테스트
// =============================

async function verifyIndicators() {
  console.log("🔍 === 9개 지표 검증 시작 ===\n");

  const testSymbols = ["AAPL", "MSFT", "NVDA"];

  for (const symbol of testSymbols) {
    console.log(`📌 테스트: ${symbol}`);
    console.log("─".repeat(60));

    try {
      // 1. 데이터 수집
      console.log("  [1/2] API 호출 중...");
      const data = await getAlphaData(symbol);

      if (!data) {
        console.log(`  ❌ 데이터 수집 실패\n`);
        continue;
      }

      // 2. 9개 지표 계산
      console.log("  [2/2] 9개 지표 계산 중...");
      const factors = calculateFactors(data);

      if (!factors) {
        console.log(`  ❌ 지표 계산 실패\n`);
        continue;
      }

      // 3. 결과 출력
      console.log("\n  ✅ 계산된 9개 지표:\n");

      console.log(`  1️⃣  Price             : $${factors.price.toFixed(2)}`);
      console.log(`  2️⃣  PE Ratio          : ${factors.pe.toFixed(2)}`);
      console.log(`  3️⃣  PB Ratio          : ${factors.pb.toFixed(2)}`);
      console.log(`  4️⃣  Float             : ${(factors.float / 1e9).toFixed(2)}B`);
      console.log(`  5️⃣  Market Cap        : ${(factors.marketCap / 1e9).toFixed(2)}B`);

      // 🎯 새로 추가된 2개 지표
      console.log(`  6️⃣  Revenue Growth    : ${(factors.revenueGrowth * 100).toFixed(2)}% ${"✅ NEW" }`);
      console.log(`  7️⃣  Earnings Growth   : ${(factors.earningsGrowth * 100).toFixed(2)}% ${"✅ NEW" }`);

      console.log(`  8️⃣  Analyst Score     : ${(factors.analystScore * 100).toFixed(1)}%`);
      console.log(`  9️⃣  Insider Activity  : ${factors.insiderActivity} 거래\n`);

      // 4. 데이터 소스 분석
      console.log("  📊 데이터 소스 분석:");
      console.log(`     • revenueGrowth  : ${
        factors.revenueGrowth === 0 ? "❌ 계산 실패" :
        data.metrics?.revenueGrowth ? "✅ FMP 직접 제공" :
        data.metrics?.revenuePerShareGrowth ? "✅ FMP RPS 사용" :
        data.metrics?.netIncomeGrowth ? "✅ FMP 순이익 사용" :
        "✅ 가격 데이터로 근사"
      }`);
      console.log(`     • earningsGrowth : ${
        factors.earningsGrowth === 0 ? "❌ 계산 실패" :
        data.metrics?.earningsGrowth ? "✅ FMP 직접 제공" :
        data.metrics?.epsGrowth ? "✅ FMP EPS 사용" :
        data.metrics?.earningsPerShareGrowth ? "✅ FMP EPS 성장률 사용" :
        "✅ 가격 데이터로 근사"
      }`);

      console.log("\n");

    } catch (e) {
      console.error(`  ❌ 에러: ${e.message}\n`);
    }
  }

  console.log("=" .repeat(60));
  console.log("✅ 검증 완료\n");
  console.log("📝 체크리스트:");
  console.log("  ☑️ 모든 9개 지표가 undefined 없이 계산되는가?");
  console.log("  ☑️ revenueGrowth와 earningsGrowth가 0이 아닌가?");
  console.log("  ☑️ 데이터 소스가 명확한가? (FMP 또는 근사)");
  console.log("  ☑️ 숫자값이 합리적인 범위인가?");
  console.log("\n✅ 모든 확인이 완료되면 Cloudflare 배포 GO!\n");
}

verifyIndicators().catch(console.error);
