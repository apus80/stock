export default {
  async fetch(request, env) {
    try {
      const FMP = env.FMP_API_KEY
      const FRED = env.FRED_KEY
      const ITICK = env.ITICK_TOKEN

      // 환경 변수 검증
      console.log(`🔑 환경변수 확인:`)
      console.log(`   FMP_API_KEY: ${FMP ? '✅ 설정됨' : '❌ 없음'}`)
      console.log(`   FRED_KEY: ${FRED ? '✅ 설정됨' : '❌ 없음'}`)
      console.log(`   ITICK_TOKEN: ${ITICK ? '✅ 설정됨' : '❌ 없음'}`)

      // URL 파싱
      const url = new URL(request.url)
      const pathname = url.pathname
      const action = url.searchParams.get('action')
      const symbol = url.searchParams.get('symbol')
      const series = url.searchParams.get('series')

      console.log(`📊 요청: pathname="${pathname}", action="${action}", url="${request.url}"`)

      /* ================================
         API 함수들
      ================================ */
      async function getQuote(sym) {
        try {
          // 📍 출처: FMP API (financialmodelingprep.com)
          // v3 API 최신 버전 사용
          const url = `https://financialmodelingprep.com/api/v3/quote/${sym}?apikey=${FMP}`
          console.log(`📍 FMP API 호출: ${sym}`)
          console.log(`   🔗 URL: ${url.substring(0, url.lastIndexOf('?'))}?apikey=[HIDDEN]`)
          console.log(`   🔑 API Key: ${FMP ? 'SET' : 'NOT SET'}`)

          const r = await fetch(url)
          console.log(`   📊 Status: ${r.status} ${r.statusText}`)
          console.log(`   Headers: Content-Type=${r.headers.get('content-type')}`)

          if (!r.ok) {
            console.error(`❌ FMP ${sym}: HTTP ${r.status} ${r.statusText}`)
            const errText = await r.text()
            console.error(`   📝 Response Body (first 500 chars):`)
            console.error(`   ${errText.substring(0, 500)}`)
            if (errText.length > 500) console.error(`   ... (${errText.length - 500} more chars)`)
            return null
          }

          const j = await r.json()
          console.log(`📦 FMP ${sym} 응답:`)
          console.log(`   Type: ${Array.isArray(j) ? 'Array' : typeof j}`)
          console.log(`   Length: ${Array.isArray(j) ? j.length : 'N/A'}`)
          if (typeof j === 'object') {
            const keys = Object.keys(j || {})
            console.log(`   Keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`)
          }
          console.log(`   Full Response: ${JSON.stringify(j).substring(0, 200)}`)

          // FMP v3/quote는 Array 반환
          if (!j || (Array.isArray(j) && j.length === 0)) {
            console.warn(`⚠️ ${sym}: 응답값 없음 (null 또는 empty array)`)
            return null
          }

          // 응답을 정규화 (Array 또는 Object 모두 처리)
          const quote = Array.isArray(j) ? j[0] : j
          console.log(`   Quote object keys: ${Object.keys(quote || {}).join(', ')}`)
          console.log(`   Price value: ${quote?.price}`)

          if (!quote || !quote.price) {
            console.warn(`⚠️ ${sym}: price 필드 없음 또는 null`)
            console.warn(`   Quote: ${JSON.stringify(quote).substring(0, 200)}`)
            return null
          }

          // FMP API 필드명 정규화
          // - price: price 또는 price
          // - changePercentage: changesPercentage (FMP 실제 필드명)
          const normalized = {
            symbol: quote.symbol || sym,
            price: quote.price,
            changePercentage: quote.changesPercentage || quote.changePercentage, // FMP는 's'가 붙음
            change: quote.change,
            volume: quote.volume,
            timestamp: quote.timestamp
          }

          console.log(`✅ ${sym}: price=${normalized.price}, change=${normalized.changePercentage}%`)
          return normalized

        } catch (e) {
          console.error(`❌ ${sym} ERROR:`)
          console.error(`   Message: ${e.message}`)
          console.error(`   Type: ${e.name}`)
          console.error(`   Stack: ${e.stack?.substring(0, 300)}`)
          return null
        }
      }

      async function getKoreanQuote(symbol) {
        // 📍 출처: Yahoo Finance API (query1.finance.yahoo.com) - 한국 지수만 직접 호출
        try {
          const yahooSymbol = symbol === 'KS11' ? '^KS11' : symbol === 'KQ11' ? '^KQ11' : symbol
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d&includePrePost=false`
          console.log(`📍 Yahoo Finance API 호출: ${yahooSymbol}`)

          const r = await fetch(url)

          if (!r.ok) {
            console.error(`❌ Yahoo ${yahooSymbol}: HTTP ${r.status} ${r.statusText}`)
            return null
          }

          const j = await r.json()
          if (!j.chart || !j.chart.result || !j.chart.result[0]) {
            console.warn(`⚠️ Yahoo ${yahooSymbol}: 응답 구조 오류`)
            return null
          }

          const meta = j.chart.result[0].meta
          const result = {
            price: meta.regularMarketPrice || null,
            changePercentage: meta.regularMarketChangePercent || null,
            change: meta.regularMarketChange || null,
            volume: meta.regularMarketVolume || null
          }
          console.log(`✅ Yahoo ${yahooSymbol}: price=${result.price}, change=${result.changePercentage}%`)
          return result
        } catch (e) {
          console.error(`❌ Yahoo ${symbol}:`, e.message)
          return null
        }
      }

      async function fredGet(series) {
        try {
          // 📍 출처: FRED API (Federal Reserve)
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED}&file_type=json`
          const r = await fetch(url)
          if (!r.ok) {
            console.error(`❌ FRED ${series}: HTTP ${r.status}`)
            return []
          }
          const j = await r.json()
          if (j.error_code) {
            console.error(`❌ FRED ${series}: API Error:`, j.error_message)
            return []
          }
          const obs = j.observations || []
          if (obs.length > 0) {
            console.log(`✅ FRED ${series}: ${obs.length} obs, latest=${obs[obs.length-1].value}`)
          }
          return obs
        } catch (e) {
          console.error(`❌ FRED ${series}:`, e.message)
          return []
        }
      }

      function getLatestValue(fredArray) {
        if (!fredArray || fredArray.length === 0) return null
        for (let i = fredArray.length - 1; i >= 0; i--) {
          const val = fredArray[i].value
          if (val && val !== '.' && val !== '') return parseFloat(val)
        }
        return null
      }

      const FRED_CONVERSIONS = {
        "CPIAUCSL": { divisor: 1, unit: "idx" },
        "T10YIE": { divisor: 1, unit: "%" },
        "UNRATE": { divisor: 1, unit: "%" },
        "M2SL": { divisor: 1000, unit: "T" },
        "WALCL": { divisor: 1000000, unit: "T" },
        "RRPONTSYD": { divisor: 1000000, unit: "T" },
        "WTREGEN": { divisor: 1000000, unit: "T" },
        "DGS10": { divisor: 1, unit: "%" },
        "DGS2": { divisor: 1, unit: "%" },
        "DCOILWTICO": { divisor: 1, unit: "$" }
      }

      function convertFredValue(series, rawValue) {
        if (rawValue === null || rawValue === undefined) return null
        const conversion = FRED_CONVERSIONS[series]
        if (!conversion) return rawValue
        return rawValue / conversion.divisor
      }

      // 📦 캐싱: 60초 내 중복 호출 방지
      let cachedMarketData = null
      let cacheTimestamp = 0
      const CACHE_TTL = 60000 // 60초

      async function getMarketDataCached() {
        const now = Date.now()
        if (cachedMarketData && (now - cacheTimestamp) < CACHE_TTL) {
          console.log("📦 캐시 사용 (경과: " + (now - cacheTimestamp) + "ms)")
          return cachedMarketData
        }

        console.log("🔄 신규 API 호출")
        cachedMarketData = await getMarketData()
        cacheTimestamp = now
        return cachedMarketData
      }

      async function getMarketData() {
        console.log("🔄 모든 시장 데이터 API 호출 시작...")
        console.log(`📍 환경: FMP=${FMP ? '✅' : '❌'}, FRED=${FRED ? '✅' : '❌'}`)
        const results = await Promise.all([
          // US 주식
          getQuote("SPY"),
          getQuote("QQQ"),
          getQuote("DIA"),
          getQuote("SOXX"),
          getQuote("IWM"),
          getQuote("^VIX"),
          // 채권
          getQuote("HYG"),
          getQuote("LQD"),
          // 광범위 지표
          getQuote("VTI"),
          getQuote("TLT"),
          // 섹터 ETF (카드 10)
          getQuote("XLK"),  // TECHNOLOGY
          getQuote("XLF"),  // FINANCIALS
          getQuote("XLE"),  // ENERGY
          getQuote("XLV"),  // HEALTHCARE
          getQuote("XLY"),  // CONSUMER_DISCRETIONARY
          getQuote("XLI"),  // INDUSTRIALS
          getQuote("XLU"),  // UTILITIES
          getQuote("XLRE"), // REAL_ESTATE
          // 한국 주식
          getKoreanQuote("KS11"),
          getKoreanQuote("KQ11"),
          // FRED 경제지표
          fredGet("WALCL"),
          fredGet("RRPONTSYD"),
          fredGet("DGS10"),
          fredGet("DGS2"),
          fredGet("CPIAUCSL"),
          fredGet("UNRATE"),
          fredGet("UMCSENT"),
          fredGet("GDPC1"),
          fredGet("INDPRO"),
          fredGet("PAYEMS"),
          fredGet("PCEPILFE")
        ])

        const [spy, qqq, dia, soxx, iwm, vix, hyg, lqd, vti, tlt, xlk, xlf, xle, xlv, xly, xli, xlu, xlre, kospi, kosdaq, fed, rp, dgs10, dgs2, cpi, unrate, umcsent, gdpc1, indpro, payems, pcepilfe] = results

        // 데이터 로깅
        console.log(`\n📊 ===== API 호출 결과 요약 =====`)
        console.log(`📈 미국 주식:`)
        console.log(`   SPY: ${spy?.price || '❌ NULL'} (change: ${spy?.changePercentage || '❌ NULL'}%)`)
        console.log(`   QQQ: ${qqq?.price || '❌ NULL'} (change: ${qqq?.changePercentage || '❌ NULL'}%)`)
        console.log(`   DIA: ${dia?.price || '❌ NULL'} (change: ${dia?.changePercentage || '❌ NULL'}%)`)
        console.log(`🇰🇷 한국 주식: ← 핵심!`)
        console.log(`   KOSPI: ${kospi?.price || '❌ NULL'} (change: ${kospi?.changePercentage || '❌ NULL'}%)`)
        console.log(`   KOSDAQ: ${kosdaq?.price || '❌ NULL'} (change: ${kosdaq?.changePercentage || '❌ NULL'}%)`)
        console.log(`   ⚠️ KOSPI 전체: ${JSON.stringify(kospi)}`)
        console.log(`   ⚠️ KOSDAQ 전체: ${JSON.stringify(kosdaq)}`)
        console.log(`💰 채권:`)
        console.log(`   HYG: ${hyg?.price || '❌ NULL'} (change: ${hyg?.changePercentage || '❌ NULL'}%)`)
        console.log(`   LQD: ${lqd?.price || '❌ NULL'} (change: ${lqd?.changePercentage || '❌ NULL'}%)`)
        console.log(`📊 FRED 데이터:`)
        console.log(`   WALCL: ${fed?.length || 0} observations, latest=${getLatestValue(fed) || '❌ NULL'}`)
        console.log(`   DGS10: ${dgs10?.length || 0} observations, latest=${getLatestValue(dgs10) || '❌ NULL'}`)
        console.log(`================================\n`)

        const fedVal = convertFredValue("WALCL", getLatestValue(fed))
        const rpVal = convertFredValue("RRPONTSYD", getLatestValue(rp))
        const us10y = convertFredValue("DGS10", getLatestValue(dgs10))
        const us2y = convertFredValue("DGS2", getLatestValue(dgs2))
        const cpiVal = convertFredValue("CPIAUCSL", getLatestValue(cpi))
        const unrateVal = convertFredValue("UNRATE", getLatestValue(unrate))
        const umsentVal = convertFredValue("UMCSENT", getLatestValue(umcsent))
        const gdpVal = convertFredValue("GDPC1", getLatestValue(gdpc1))
        const indproVal = convertFredValue("INDPRO", getLatestValue(indpro))
        const payelmsVal = convertFredValue("PAYEMS", getLatestValue(payems))
        const pcepilfeVal = convertFredValue("PCEPILFE", getLatestValue(pcepilfe))

        return {
          spy: spy?.price,
          qqq: qqq?.price,
          dia: dia?.price,
          soxx: soxx?.price,
          iwm: iwm?.price,
          vix: vix?.price,
          spyChange: spy?.changePercentage,
          qqqChange: qqq?.changePercentage,
          diaChange: dia?.changePercentage,
          soxxChange: soxx?.changePercentage,
          iwmChange: iwm?.changePercentage,
          vixChange: vix?.changePercentage,
          kospi: kospi?.price,
          kospiChange: kospi?.changePercentage,
          kosdaq: kosdaq?.price,
          kosdaqChange: kosdaq?.changePercentage,
          hyg: hyg?.price,
          lqd: lqd?.price,
          hygChange: hyg?.changePercentage,
          lqdChange: lqd?.changePercentage,
          vti: vti?.price,
          tlt: tlt?.price,
          vtiChange: vti?.changePercentage,
          tltChange: tlt?.changePercentage,
          fed: fedVal,
          rp: rpVal,
          us10y: us10y,
          us2y: us2y,
          yieldCurve: us10y && us2y ? (us10y - us2y) : null,
          // 카드 10: Sectors
          SECTORS: {
            TECHNOLOGY: xlk ? {price: xlk.price, changePercentage: xlk.changePercentage} : null,
            FINANCIALS: xlf ? {price: xlf.price, changePercentage: xlf.changePercentage} : null,
            ENERGY: xle ? {price: xle.price, changePercentage: xle.changePercentage} : null,
            HEALTHCARE: xlv ? {price: xlv.price, changePercentage: xlv.changePercentage} : null,
            CONSUMER_DISCRETIONARY: xly ? {price: xly.price, changePercentage: xly.changePercentage} : null,
            INDUSTRIALS: xli ? {price: xli.price, changePercentage: xli.changePercentage} : null,
            UTILITIES: xlu ? {price: xlu.price, changePercentage: xlu.changePercentage} : null,
            REAL_ESTATE: xlre ? {price: xlre.price, changePercentage: xlre.changePercentage} : null
          },
          // 카드 11: Credit & Breadth
          CREDIT: {
            HIGH_YIELD: hyg ? {price: hyg.price, changePercentage: hyg.changePercentage} : null,
            INVESTMENT_GRADE: lqd ? {price: lqd.price, changePercentage: lqd.changePercentage} : null
          },
          BREADTH: {
            TOTAL_MARKET: vti ? {price: vti.price, changePercentage: vti.changePercentage} : null,
            LONG_TREASURY: tlt ? {price: tlt.price, changePercentage: tlt.changePercentage} : null
          },
          // 카드 12: Macro Base
          MACRO_BASE: {
            CPI: cpiVal,
            INFLATION_EXPECTATION: null, // 별도 API 필요 (MMNRNJ)
            UNEMPLOYMENT: unrateVal,
            M2: null, // 별도 API 필요 (M2SL)
            REAL_RATES: null  // 별도 계산 필요 (us10y - inflation)
          },
          // 카드 13: Macro Indicators
          MACRO_INDICATORS: {
            CONSUMER_SENTIMENT: umsentVal,
            REAL_GDP: gdpVal,
            INDUSTRIAL_PRODUCTION: indproVal,
            NONFARM_PAYROLLS: payelmsVal,
            PCE_INFLATION: pcepilfeVal
          }
        }
      }

      // 1. Institutional Market Score
      async function getInstitutionalScore() {
        const data = await getMarketDataCached()
        const liquidityScore = (data.fed && data.fed > 7000) ? 18 : 15
        const volatilityScore = (data.vix && data.vix < 15) ? 18 : (data.vix < 20 ? 14 : 10)
        const creditScore = (data.hyg && data.lqd && (data.hyg / data.lqd) > 0.98) ? 18 : 15
        const breadthScore = 18
        const macroScore = (data.yieldCurve > 0.5) ? 18 : 12

        const totalScore = liquidityScore + volatilityScore + creditScore + breadthScore + macroScore

        return {
          timestamp: new Date().toISOString(),
          dataType: "institutional_score",
          score: totalScore,
          signal: totalScore >= 75 ? "🚀 강한 강세" : totalScore >= 60 ? "📈 강세" : totalScore >= 40 ? "➡️ 중립" : totalScore >= 20 ? "📉 약세" : "🔴 위기",
          components: {
            liquidity: liquidityScore,
            volatility: volatilityScore,
            credit: creditScore,
            breadth: breadthScore,
            macro: macroScore
          },
          details: {
            fed: data.fed,
            vix: data.vix,
            hyg_lqd_ratio: data.hyg && data.lqd ? (data.hyg / data.lqd).toFixed(3) : null,
            yield_curve: data.yieldCurve
          }
        }
      }

      // 2. Market Regime Engine
      async function getMarketRegime() {
        const data = await getMarketDataCached()
        const trendScore = (data.spy > 400) ? 70 : 55
        const riskScore = (data.vix < 15) ? 80 : 60
        const confidenceScore = (trendScore + riskScore) / 2

        let regime = "Neutral"
        if (confidenceScore > 65) regime = data.spyChange > 0 ? "Risk-On" : "Risk-Off"

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_regime",
          regime: regime,
          confidence: Math.round(confidenceScore),
          signal: regime === "Risk-On" ? "🎯 공격 모드" : regime === "Risk-Off" ? "⚠️ 방어 모드" : "➡️ 중립",
          components: {
            trend_score: trendScore,
            risk_score: riskScore
          },
          details: {
            spy: data.spy,
            vix: data.vix,
            spy_change: data.spyChange
          }
        }
      }

      // 3. Liquidity Pulse
      async function getLiquidityPulse() {
        const data = await getMarketDataCached()
        const liquidityScore = (data.fed > 7000) ? 85 : (data.fed > 6000) ? 70 : 50

        return {
          timestamp: new Date().toISOString(),
          dataType: "liquidity_pulse",
          score: liquidityScore,
          signal: liquidityScore > 75 ? "💧 풍부함" : liquidityScore > 50 ? "⚡ 적정" : "⚠️ 부족",
          details: {
            fed_balance: data.fed,
            reverse_repo: data.rp,
            liquidity_status: data.fed > 7000 ? "유동성 풍부 → 위험자산 선호" : "유동성 부족 → 안전자산 선호"
          }
        }
      }

      // 4. Yield Curve Monitor
      async function getYieldCurveMonitor() {
        const data = await getMarketDataCached()
        const spread = data.yieldCurve
        const isInverted = spread < 0

        return {
          timestamp: new Date().toISOString(),
          dataType: "yield_curve",
          spread: spread ? spread.toFixed(2) : null,
          inverted: isInverted,
          signal: isInverted ? "⚠️ 역전 신호" : "✅ 정상",
          recession_probability: isInverted ? 75 : 20,
          recommendation: isInverted ? "포트폴리오 방어 전환" : "공격적 포지셔닝",
          details: {
            us10y: data.us10y,
            us2y: data.us2y
          }
        }
      }

      // 5. Inflation Pressure Monitor
      async function getInflationPressure() {
        const [cpi, t10y] = await Promise.all([
          fredGet("CPIAUCSL"),
          fredGet("T10YIE")
        ])

        const cpiVal = getLatestValue(cpi)
        const inflationExpectation = convertFredValue("T10YIE", getLatestValue(t10y))
        const pressure = cpiVal && cpiVal > 240 ? "고" : "저"

        return {
          timestamp: new Date().toISOString(),
          dataType: "inflation_pressure",
          pressure: pressure,
          signal: pressure === "고" ? "🌡️ 높음" : "❄️ 낮음",
          components: {
            cpi: cpiVal,
            inflation_expectation: inflationExpectation
          },
          recommendation: pressure === "고" ? "금, 에너지, TIPs 선호" : "성장주 선호"
        }
      }

      // 6. Credit Stress Monitor
      async function getCreditStress() {
        const data = await getMarketDataCached()
        const spread = data.hyg && data.lqd ? ((data.hyg / data.lqd - 0.98) * 100) : 0
        const stress = spread > 2 ? "높음" : spread > 0 ? "중간" : "낮음"

        return {
          timestamp: new Date().toISOString(),
          dataType: "credit_stress",
          stress_level: stress,
          signal: stress === "높음" ? "⚠️ 스트레스" : stress === "중간" ? "⚡ 주의" : "✅ 안정",
          spread: spread.toFixed(2),
          details: {
            hyg: data.hyg,
            lqd: data.lqd,
            hyg_lqd_ratio: data.hyg && data.lqd ? (data.hyg / data.lqd).toFixed(3) : null
          },
          recommendation: stress === "높음" ? "투자등급 채권 증대" : "하이일드 공격"
        }
      }

      // 7. Market Breadth Analyzer
      async function getMarketBreadth() {
        const [spy, qqq] = await Promise.all([
          getQuote("SPY"),
          getQuote("QQQ")
        ])

        const breadthScore = (spy && spy.changePercentage > 0.5) ? 80 : 50

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_breadth",
          score: breadthScore,
          signal: breadthScore >= 75 ? "📊 광범위 상승" : "⚠️ 소수만 상승",
          details: {
            spy_change: spy?.changePercentage,
            qqq_change: qqq?.changePercentage
          }
        }
      }

      // 8. Volatility Regime
      async function getVolatilityRegime() {
        const data = await getMarketDataCached()
        const regime = (data.vix < 15) ? "Low" : (data.vix < 20) ? "Medium" : "High"

        return {
          timestamp: new Date().toISOString(),
          dataType: "volatility_regime",
          vix: data.vix,
          regime: regime,
          signal: regime === "Low" ? "⚡ 공격 모드" : regime === "Medium" ? "⚠️ 균형" : "🔴 방어 모드",
          recommendation: regime === "Low" ? "적극 투자" : regime === "Medium" ? "균형형" : "현금 보유"
        }
      }

      // 9. Sector Rotation Tracker
      async function getSectorRotation() {
        const sectors = await Promise.all([
          getQuote("XLK"),
          getQuote("XLF"),
          getQuote("XLE"),
          getQuote("XLV"),
          getQuote("XLY"),
          getQuote("XLI")
        ])

        const sectorData = [
          { name: "Technology (XLK)", change: sectors[0]?.changePercentage },
          { name: "Financials (XLF)", change: sectors[1]?.changePercentage },
          { name: "Energy (XLE)", change: sectors[2]?.changePercentage },
          { name: "Healthcare (XLV)", change: sectors[3]?.changePercentage },
          { name: "Consumer (XLY)", change: sectors[4]?.changePercentage },
          { name: "Industrials (XLI)", change: sectors[5]?.changePercentage }
        ].sort((a, b) => (b.change || 0) - (a.change || 0))

        return {
          timestamp: new Date().toISOString(),
          dataType: "sector_rotation",
          top_performers: sectorData.slice(0, 3),
          weakest: sectorData.slice(-3),
          all_sectors: sectorData
        }
      }

      // 10. Dollar Liquidity Impact
      async function getDollarLiquidity() {
        const [dxy, bitcoin] = await Promise.all([
          getQuote("DX"),
          getQuote("BTCUSD")
        ])

        const dxyPrice = dxy?.price
        const impact = dxyPrice > 105 ? "약세 자산 약함" : "약세 자산 강함"

        return {
          timestamp: new Date().toISOString(),
          dataType: "dollar_liquidity",
          dxy: dxyPrice,
          signal: dxyPrice > 105 ? "💵 달러 강함" : "📉 달러 약함",
          impact: impact,
          recommendation: dxyPrice > 105 ? "미국주식만" : "신흥국, 원자재 진입"
        }
      }

      // 11. Crypto Sentiment
      async function getCryptoSentiment() {
        const [btc, eth] = await Promise.all([
          getQuote("BTCUSD"),
          getQuote("ETHUSD")
        ])

        const sentiment = (btc && btc.changePercentage > 5) ? 75 : (btc && btc.changePercentage > 0) ? 55 : 35

        return {
          timestamp: new Date().toISOString(),
          dataType: "crypto_sentiment",
          sentiment_score: sentiment,
          signal: sentiment > 70 ? "🎉 Greed" : sentiment > 50 ? "➡️ Neutral" : "😨 Fear",
          details: {
            btc: btc?.price,
            eth: eth?.price,
            btc_change: btc?.changePercentage,
            eth_change: eth?.changePercentage
          },
          recommendation: sentiment > 70 ? "수익실현" : sentiment < 30 ? "매수기회" : "관망"
        }
      }

      // 12. Smart Money Signal
      async function getSmartMoney() {
        const [spy, qqq] = await Promise.all([
          getQuote("SPY"),
          getQuote("QQQ")
        ])

        const signal = (spy && spy.volume > 60000000) ? "축적" : "분산"

        return {
          timestamp: new Date().toISOString(),
          dataType: "smart_money",
          signal: signal,
          status: signal === "축적" ? "🤖 기관 매수" : "⚠️ 기관 매도",
          details: {
            spy_volume: spy?.volume,
            qqq_volume: qqq?.volume
          },
          recommendation: signal === "축적" ? "강세장 신호" : "약세장 신호"
        }
      }

      // 13. Stock Ranking
      async function getStockRanking() {
        const stocks = await Promise.all([
          getQuote("MSFT"),
          getQuote("AAPL"),
          getQuote("NVDA"),
          getQuote("GOOGL"),
          getQuote("AMZN"),
          getQuote("TSLA"),
          getQuote("META")
        ])

        const ranked = stocks.map((s, i) => ({
          rank: i + 1,
          symbol: ["MSFT", "AAPL", "NVDA", "GOOGL", "AMZN", "TSLA", "META"][i],
          price: s?.price,
          change: s?.changePercentage,
          score: Math.round(50 + (s?.changePercentage || 0) * 5)
        })).sort((a, b) => b.score - a.score)

        return {
          timestamp: new Date().toISOString(),
          dataType: "stock_ranking",
          ranking: ranked.slice(0, 10)
        }
      }

      // 14. Market Heatmap
      async function getMarketHeatmap() {
        const [spy, qqq, dia, vix, hyg, lqd, gold, btc, xlk, xlf] = await Promise.all([
          getQuote("SPY"),
          getQuote("QQQ"),
          getQuote("DIA"),
          getQuote("^VIX"),
          getQuote("HYG"),
          getQuote("LQD"),
          getQuote("GCUSD"),
          getQuote("BTCUSD"),
          getQuote("XLK"),
          getQuote("XLF")
        ])

        const assets = [
          { name: "S&P500", change: spy?.changePercentage, color: spy && spy.changePercentage > 0 ? "green" : "red" },
          { name: "NASDAQ", change: qqq?.changePercentage, color: qqq && qqq.changePercentage > 0 ? "green" : "red" },
          { name: "DOW", change: dia?.changePercentage, color: dia && dia.changePercentage > 0 ? "green" : "red" },
          { name: "VIX", change: vix?.changePercentage, color: vix && vix.changePercentage < 0 ? "green" : "red" },
          { name: "HYBond", change: hyg?.changePercentage, color: hyg && hyg.changePercentage > 0 ? "green" : "red" },
          { name: "IGBond", change: lqd?.changePercentage, color: lqd && lqd.changePercentage > 0 ? "green" : "red" },
          { name: "Gold", change: gold?.changePercentage, color: gold && gold.changePercentage > 0 ? "green" : "red" },
          { name: "Bitcoin", change: btc?.changePercentage, color: btc && btc.changePercentage > 0 ? "green" : "red" },
          { name: "Tech(XLK)", change: xlk?.changePercentage, color: xlk && xlk.changePercentage > 0 ? "green" : "red" },
          { name: "Finance(XLF)", change: xlf?.changePercentage, color: xlf && xlf.changePercentage > 0 ? "green" : "red" }
        ]

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_heatmap",
          assets: assets
        }
      }

      /* ================================
         경로 기반 라우팅
      ================================ */
      let response

      // /market endpoint - 시장 데이터
      if (pathname === "/market") {
        const marketData = await getMarketData()
        response = {
          timestamp: new Date().toISOString(),
          dataType: "market",
          KOREA_MARKET: {
            KOSPI: {
              price: marketData.kospi ? Math.round(marketData.kospi * 100) : null,
              change: marketData.kospiChange ? (marketData.kospiChange * 100) : null
            },
            KOSDAQ: {
              price: marketData.kosdaq ? Math.round(marketData.kosdaq * 100) : null,
              change: marketData.kosdaqChange ? (marketData.kosdaqChange * 100) : null
            },
            KOSPI_FUT: {
              price: marketData.kospi ? Math.round(marketData.kospi * 100) : null,
              change: marketData.kospiChange ? (marketData.kospiChange * 100) : null
            }
          },
          US_MARKET: {
            SP500: {
              price: marketData.spy ? parseFloat(marketData.spy.toFixed(2)) : null,
              changePercentage: marketData.spyChange ? parseFloat(marketData.spyChange.toFixed(2)) : null
            },
            NASDAQ: {
              price: marketData.qqq ? parseFloat(marketData.qqq.toFixed(2)) : null,
              changePercentage: marketData.qqqChange ? parseFloat(marketData.qqqChange.toFixed(2)) : null
            },
            DOW: {
              price: marketData.dia ? parseFloat(marketData.dia.toFixed(2)) : null,
              changePercentage: marketData.diaChange ? parseFloat(marketData.diaChange.toFixed(2)) : null
            },
            SOX: {
              price: marketData.soxx ? parseFloat(marketData.soxx.toFixed(2)) : null,
              changePercentage: marketData.soxxChange ? parseFloat(marketData.soxxChange.toFixed(2)) : null
            },
            RUSSELL2000: {
              price: marketData.iwm ? parseFloat(marketData.iwm.toFixed(2)) : null,
              changePercentage: marketData.iwmChange ? parseFloat(marketData.iwmChange.toFixed(2)) : null
            },
            VIX: {
              price: marketData.vix ? parseFloat(marketData.vix.toFixed(2)) : null,
              changePercentage: marketData.vixChange ? parseFloat(marketData.vixChange.toFixed(2)) : null
            }
          },
          BONDS: {
            HYG: {
              price: marketData.hyg ? parseFloat(marketData.hyg.toFixed(2)) : null,
              change: marketData.hygChange ? parseFloat(marketData.hygChange.toFixed(2)) : null
            },
            LQD: {
              price: marketData.lqd ? parseFloat(marketData.lqd.toFixed(2)) : null,
              change: marketData.lqdChange ? parseFloat(marketData.lqdChange.toFixed(2)) : null
            }
          },
          LIQUIDITY: {
            FED_BALANCE: {
              value: marketData.fed ? parseFloat(marketData.fed.toFixed(0)) : null,
              unit: "T"
            },
            REVERSE_REPO: {
              value: marketData.rp ? parseFloat(marketData.rp.toFixed(0)) : null,
              unit: "T"
            }
          },
          RATES: {
            US10Y: {
              value: marketData.us10y ? parseFloat(marketData.us10y.toFixed(2)) : null
            },
            US2Y: {
              value: marketData.us2y ? parseFloat(marketData.us2y.toFixed(2)) : null
            },
            YIELD_CURVE: marketData.yieldCurve ? parseFloat(marketData.yieldCurve.toFixed(3)) : null
          },
          // 카드 10-14: Sectors, Credit, Breadth, Macro
          SECTORS: marketData.SECTORS || {},
          CREDIT: marketData.CREDIT || {},
          BREADTH: marketData.BREADTH || {},
          MACRO_BASE: marketData.MACRO_BASE || {},
          MACRO_INDICATORS: marketData.MACRO_INDICATORS || {}
        }
      }
      // /stock endpoint - 개별 주식 데이터
      else if (pathname === "/stock") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const quote = await getQuote(stockSymbol)
          response = {
            timestamp: new Date().toISOString(),
            dataType: "stock",
            symbol: stockSymbol,
            data: quote
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // 루트 경로 처리
      else if (pathname === "/" || pathname === "/analysis") {
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          message: "14개 AI 분석 위젯 엔드포인트 사용 가능",
          endpoints: [
            "/analysis/institutional-score",
            "/analysis/market-regime",
            "/analysis/liquidity-pulse",
            "/analysis/yield-curve-monitor",
            "/analysis/inflation-pressure",
            "/analysis/credit-stress",
            "/analysis/market-breadth",
            "/analysis/volatility-regime",
            "/analysis/sector-rotation",
            "/analysis/dollar-liquidity",
            "/analysis/crypto-sentiment",
            "/analysis/smart-money",
            "/analysis/stock-ranking",
            "/analysis/market-heatmap"
          ]
        }
      } else if (pathname === "/analysis/institutional-score") {
        response = await getInstitutionalScore()
      } else if (pathname === "/analysis/market-regime") {
        response = await getMarketRegime()
      } else if (pathname === "/analysis/liquidity-pulse") {
        response = await getLiquidityPulse()
      } else if (pathname === "/analysis/yield-curve-monitor") {
        response = await getYieldCurveMonitor()
      } else if (pathname === "/analysis/inflation-pressure") {
        response = await getInflationPressure()
      } else if (pathname === "/analysis/credit-stress") {
        response = await getCreditStress()
      } else if (pathname === "/analysis/market-breadth") {
        response = await getMarketBreadth()
      } else if (pathname === "/analysis/volatility-regime") {
        response = await getVolatilityRegime()
      } else if (pathname === "/analysis/sector-rotation") {
        response = await getSectorRotation()
      } else if (pathname === "/analysis/dollar-liquidity") {
        response = await getDollarLiquidity()
      } else if (pathname === "/analysis/crypto-sentiment") {
        response = await getCryptoSentiment()
      } else if (pathname === "/analysis/smart-money") {
        response = await getSmartMoney()
      } else if (pathname === "/analysis/stock-ranking") {
        response = await getStockRanking()
      } else if (pathname === "/analysis/market-heatmap") {
        response = await getMarketHeatmap()
      } else if (action === 'metadata') {
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          message: "14개 AI 분석 위젯 엔드포인트 사용 가능",
          endpoints: [
            "/analysis/institutional-score",
            "/analysis/market-regime",
            "/analysis/liquidity-pulse",
            "/analysis/yield-curve-monitor",
            "/analysis/inflation-pressure",
            "/analysis/credit-stress",
            "/analysis/market-breadth",
            "/analysis/volatility-regime",
            "/analysis/sector-rotation",
            "/analysis/dollar-liquidity",
            "/analysis/crypto-sentiment",
            "/analysis/smart-money",
            "/analysis/stock-ranking",
            "/analysis/market-heatmap"
          ]
        }
      } else if (series) {
        const fredData = await fredGet(series)
        const raw = getLatestValue(fredData)
        const value = convertFredValue(series, raw)

        response = {
          timestamp: new Date().toISOString(),
          dataType: "fred_single",
          series: series,
          value: value
        }
      } else {
        // 기본값: 메타데이터 반환
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          message: "14개 AI 분석 위젯 엔드포인트 사용 가능",
          endpoints: [
            "/analysis/institutional-score",
            "/analysis/market-regime",
            "/analysis/liquidity-pulse",
            "/analysis/yield-curve-monitor",
            "/analysis/inflation-pressure",
            "/analysis/credit-stress",
            "/analysis/market-breadth",
            "/analysis/volatility-regime",
            "/analysis/sector-rotation",
            "/analysis/dollar-liquidity",
            "/analysis/crypto-sentiment",
            "/analysis/smart-money",
            "/analysis/stock-ranking",
            "/analysis/market-heatmap"
          ],
          debug: {
            pathname: pathname,
            action: action,
            series: series
          }
        }
      }

      return new Response(
        JSON.stringify(response, null, 2),
        {
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300"
          }
        }
      )

    } catch (e) {
      return new Response(
        JSON.stringify({
          error: e.message,
          timestamp: new Date().toISOString()
        }, null, 2),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      )
    }
  }
}
