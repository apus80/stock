#!/usr/bin/env node

/**
 * API 엔드포인트 검증 스크립트
 * 각 소스에서 실제로 데이터가 오는지 확인
 */

const FMP_KEY = process.env.FMP_API_KEY;
const FRED_KEY = process.env.FRED_KEY;

if (!FMP_KEY) {
  console.error('❌ FMP_API_KEY not set');
  process.exit(1);
}
if (!FRED_KEY) {
  console.error('❌ FRED_KEY not set');
  process.exit(1);
}

async function testFMP() {
  console.log('\n📊 === FMP API (/stable/batch-quote) ===');
  const symbols = ['SPY', 'QQQ', '^VIX'];

  for (const sym of symbols) {
    try {
      const url = `https://financialmodelingprep.com/stable/batch-quote?symbols=${sym}&apikey=${FMP_KEY}`;
      const r = await fetch(url);
      const data = await r.json();

      console.log(`\n✅ ${sym}:`);
      console.log(`   Response type: ${Array.isArray(data) ? 'ARRAY' : typeof data}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Price: ${data[0].price}`);
        console.log(`   Change%: ${data[0].changePercentage}`);
      } else {
        console.log(`   ❌ EMPTY or INVALID response`);
      }
    } catch (e) {
      console.error(`❌ ${sym}: ${e.message}`);
    }
  }
}

async function testFRED() {
  console.log('\n📈 === FRED API (/fred/series/observations) ===');
  const series = ['WALCL', 'DGS10', 'UNRATE'];

  for (const s of series) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s}&api_key=${FRED_KEY}&file_type=json`;
      const r = await fetch(url);
      const data = await r.json();

      console.log(`\n✅ ${s}:`);
      if (data.error_code) {
        console.log(`   ❌ API Error: ${data.error_message}`);
      } else {
        const obs = data.observations || [];
        if (obs.length > 0) {
          const latest = obs[obs.length - 1];
          console.log(`   Latest date: ${latest.date}`);
          console.log(`   Latest value: ${latest.value}`);
        } else {
          console.log(`   ❌ NO observations`);
        }
      }
    } catch (e) {
      console.error(`❌ ${s}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🔍 API 엔드포인트 검증 테스트');
  console.log('================================');

  await testFMP();
  await testFRED();

  console.log('\n\n✅ 검증 완료');
}

main().catch(console.error);
