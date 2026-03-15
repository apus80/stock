// 🔍 Worker.js API 검증 테스트 스크립트
// Cloudflare 배포 전 5개 API 확인용

const FMP = process.env.FMP_API_KEY || "YOUR_FMP_KEY";

async function testAPIs() {
  console.log("🚀 Worker.js API 검증 시작\n");

  const symbols = ["AAPL", "MSFT", "NVDA"];
  const results = {};

  for (const symbol of symbols) {
    console.log(`📌 테스트: ${symbol}`);
    results[symbol] = {};

    try {
      // ✅ 1️⃣ Quote API
      const quoteURL = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${FMP}`;
      const quoteRes = await fetch(quoteURL);
      const quoteData = await quoteRes.json();
      results[symbol].quote = {
        status: quoteRes.ok ? "✅ OK" : `❌ HTTP ${quoteRes.status}`,
        price: quoteData[0]?.price,
        change: quoteData[0]?.change
      };
      console.log(`  1️⃣ Quote: ${results[symbol].quote.status} (Price: ${quoteData[0]?.price})`);

      // ✅ 2️⃣ Historical Price API
      const histURL = `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${symbol}&limit=200&apikey=${FMP}`;
      const histRes = await fetch(histURL);
      const histData = await histRes.json();
      results[symbol].history = {
        status: histRes.ok ? "✅ OK" : `❌ HTTP ${histRes.status}`,
        count: histData ? histData.length : 0
      };
      console.log(`  2️⃣ Historical: ${results[symbol].history.status} (Days: ${results[symbol].history.count})`);

      // ✅ 3️⃣ Key Metrics API
      const metricsURL = `https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&apikey=${FMP}`;
      const metricsRes = await fetch(metricsURL);
      const metricsData = await metricsRes.json();
      results[symbol].metrics = {
        status: metricsRes.ok ? "✅ OK" : `❌ HTTP ${metricsRes.status}`,
        pe: metricsData[0]?.peRatio,
        pb: metricsData[0]?.priceToBookRatio,
        float: metricsData[0]?.floatShares
      };
      console.log(`  3️⃣ Metrics: ${results[symbol].metrics.status} (PE: ${metricsData[0]?.peRatio})`);

      // ✅ 4️⃣ Analyst Recommendations API
      const analystURL = `https://financialmodelingprep.com/stable/analyst-stock-recommendations?symbol=${symbol}&apikey=${FMP}`;
      const analystRes = await fetch(analystURL);
      const analystData = await analystRes.json();
      results[symbol].analyst = {
        status: analystRes.ok ? "✅ OK" : `❌ HTTP ${analystRes.status}`,
        count: analystData ? analystData.length : 0
      };
      console.log(`  4️⃣ Analyst: ${results[symbol].analyst.status} (Recommendations: ${analystData ? analystData.length : 0})`);

      // ✅ 5️⃣ Insider Trading API
      const insiderURL = `https://financialmodelingprep.com/stable/insider-trading/search?symbol=${symbol}&apikey=${FMP}`;
      const insiderRes = await fetch(insiderURL);
      const insiderData = await insiderRes.json();
      results[symbol].insider = {
        status: insiderRes.ok ? "✅ OK" : `❌ HTTP ${insiderRes.status}`,
        count: insiderData ? insiderData.length : 0
      };
      console.log(`  5️⃣ Insider: ${results[symbol].insider.status} (Trades: ${insiderData ? insiderData.length : 0})\n`);

    } catch (e) {
      console.error(`  ❌ ${symbol} 에러: ${e.message}\n`);
    }
  }

  console.log("📊 === 최종 결과 ===");
  console.log(JSON.stringify(results, null, 2));

  // Rate limit 계산
  console.log("\n📈 === Rate Limit 계산 ===");
  console.log("20개 종목 × 5개 API = 100 요청");
  console.log("일일 한계: 250요청 (FMP 무료 플랜)");
  console.log("안전 마진: 150요청 (60%)");
}

testAPIs();
