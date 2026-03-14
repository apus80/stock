// 🔍 FMP key-metrics에서 성장률 필드 확인
// revenueGrowth, earningsGrowth가 직접 제공되는지 테스트

const FMP = process.env.FMP_API_KEY || "YOUR_FMP_KEY";

async function checkMetricsFields() {
  console.log("🔍 FMP key-metrics 필드 확인\n");

  const symbols = ["AAPL", "MSFT"];

  for (const symbol of symbols) {
    try {
      const url = `https://financialmodelingprep.com/stable/key-metrics?symbol=${symbol}&apikey=${FMP}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data[0]) {
        console.log(`❌ ${symbol}: 데이터 없음\n`);
        continue;
      }

      const metrics = data[0];
      console.log(`✅ ${symbol} - 사용 가능한 성장률 필드:`);

      // 가능한 성장률 필드들
      const growthFields = [
        "revenueGrowth",
        "revenuePerShareGrowth",
        "epsGrowth",
        "earningsPerShareGrowth",
        "earningsGrowth",
        "netIncomeGrowth",
        "operatingCashFlowGrowth",
        "freeCashFlowGrowth"
      ];

      let found = false;
      for (const field of growthFields) {
        if (metrics[field] !== undefined && metrics[field] !== null) {
          console.log(`  ✓ ${field}: ${metrics[field]}`);
          found = true;
        }
      }

      if (!found) {
        console.log(`  ✗ 성장률 필드 없음`);
        console.log(`\n  📊 현재 제공 필드 (첫 10개):`);
        const keys = Object.keys(metrics).slice(0, 10);
        keys.forEach(k => {
          console.log(`    • ${k}: ${metrics[k]}`);
        });
      }

      console.log("");

    } catch (e) {
      console.error(`❌ ${symbol} 에러: ${e.message}\n`);
    }
  }

  console.log("📝 결론:");
  console.log("  1. 성장률 필드 있음 → 직접 사용");
  console.log("  2. 성장률 필드 없음 → 옵션 1 또는 3 사용");
}

checkMetricsFields();
