export default {
  async fetch(request, env) {
    try {
      const FMP = env.FMP_API_KEY
      const FRED = env.FRED_KEY

      // URL 파라미터 파싱
      const url = new URL(request.url)
      const action = url.searchParams.get('action')
      const symbol = url.searchParams.get('symbol')
      const series = url.searchParams.get('series')  // ✅ FRED 추가

      console.log(`📊 요청: action=${action}, symbol=${symbol}, series=${series}`)

      /* ================================
         설정
      ================================ */
      const MARKET_SYMBOLS = {
        base: ["SPY", "QQQ", "DIA", "^VIX", "SOXX", "IWM", "BTCUSD", "ETHUSD", "SOLUSD", "GCUSD", "SIUSD", "USDJPY", "EURUSD", "DX"],
        sectors: ["XLK", "XLF", "XLE", "XLV", "XLY", "XLI", "XLU", "XLRE"],
        credit: ["HYG", "LQD"],
        breadth: ["VTI", "TLT"]
      }

      const FRED_SYMBOLS = {
        macro: ["CPIAUCSL", "T10YIE", "UNRATE", "M2SL", "WALCL", "RRPONTSYD", "WTREGEN", "DGS10", "DGS2"],
        additional: ["UMCSENT", "GDPC1", "INDPRO", "PAYEMS", "PCEPI"]
      }

      /* ================================
         API 함수
      ================================ */
      async function getQuote(sym) {
        try {
          const r = await fetch(
            `https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${FMP}`
          )
          const j = await r.json()
          return Array.isArray(j) && j.length > 0 ? j[0] : null
        } catch (e) {
          console.error(`❌ 주식 ${sym} 실패:`, e.message)
          return null
        }
      }

      async function fredGet(series) {
        try {
          const r = await fetch(
            `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED}&file_type=json`
          )
          const j = await r.json()
          return j.observations || []
        } catch (e) {
          console.error(`❌ FRED ${series} 실패:`, e.message)
          return []
        }
      }

      /* ================================
         0️⃣ FRED 단일 시리즈 (⭐ 가장 먼저 처리)
      ================================ */
      if (series) {
        console.log(`📈 FRED 단일 요청: ${series}`)
        const fredData = await fredGet(series)
        const latest = fredData.length > 0
          ? parseFloat(fredData[fredData.length - 1].value)
          : null

        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            dataType: "fred_single",
            series: series,
            value: latest
          }, null, 2),
          {
            headers: {
              "content-type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=300"
            }
          }
        )
      }

      /* ================================
         1. 마켓 데이터
      ================================ */
      async function getMarketData() {
        console.log("📊 마켓 데이터 수집 중...")

        const baseMarketQuotes = await Promise.all(
          MARKET_SYMBOLS.base.map(sym => getQuote(sym))
        )

        const sectorQuotes = await Promise.all(
          MARKET_SYMBOLS.sectors.map(sym => getQuote(sym))
        )

        const creditQuotes = await Promise.all(
          MARKET_SYMBOLS.credit.map(sym => getQuote(sym))
        )

        const breadthQuotes = await Promise.all(
          MARKET_SYMBOLS.breadth.map(sym => getQuote(sym))
        )

        const allMarketData = [
          ...baseMarketQuotes,
          ...sectorQuotes,
          ...creditQuotes,
          ...breadthQuotes
        ].filter(q => q !== null)

        function price(sym) {
          const item = allMarketData.find(i => i.symbol && i.symbol.toUpperCase() === sym.toUpperCase())
          return item?.price || null
        }

        function change(sym) {
          const item = allMarketData.find(i => i.symbol && i.symbol.toUpperCase() === sym.toUpperCase())
          return item?.change || null
        }

        function changePercent(sym) {
          const item = allMarketData.find(i => i.symbol && i.symbol.toUpperCase() === sym.toUpperCase())
          return item?.changePercentage || null
        }

        // FRED 데이터 수집
        const macroFredData = await Promise.all(
          FRED_SYMBOLS.macro.map(series => fredGet(series))
        )

        const additionalFredData = await Promise.all(
          FRED_SYMBOLS.additional.map(series => fredGet(series))
        )

        function getLatestValue(fredArray) {
          return fredArray && fredArray.length > 0 ? parseFloat(fredArray[fredArray.length - 1].value) : null
        }

        const [cpiValue, inflationValue, unemploymentValue, m2Value, fedBalanceValue, rrpValue, tgaValue, us10yValue, us2yValue] =
          macroFredData.map(getLatestValue)

        const [sentimentValue, gdpValue, industrialValue, payrollValue, pceInflationValue] =
          additionalFredData.map(getLatestValue)

        const gold = price("GCUSD")
        const silver = price("SIUSD")

        return {
          timestamp: new Date().toISOString(),
          dataType: "market",

          US_MARKET: {
            SP500: { price: price("SPY"), change: change("SPY"), changePercent: changePercent("SPY") },
            NASDAQ: { price: price("QQQ"), change: change("QQQ"), changePercent: changePercent("QQQ") },
            DOW: { price: price("DIA"), change: change("DIA"), changePercent: changePercent("DIA") },
            VIX: { price: price("^VIX"), change: change("^VIX"), changePercent: changePercent("^VIX") },
            SOX: { price: price("SOXX"), change: change("SOXX"), changePercent: changePercent("SOXX") },
            RUSSELL2000: { price: price("IWM"), change: change("IWM"), changePercent: changePercent("IWM") }
          },

          SECTORS: {
            TECHNOLOGY: { symbol: "XLK", price: price("XLK"), change: change("XLK"), changePercent: changePercent("XLK") },
            FINANCIALS: { symbol: "XLF", price: price("XLF"), change: change("XLF"), changePercent: changePercent("XLF") },
            ENERGY: { symbol: "XLE", price: price("XLE"), change: change("XLE"), changePercent: changePercent("XLE") },
            HEALTHCARE: { symbol: "XLV", price: price("XLV"), change: change("XLV"), changePercent: changePercent("XLV") },
            CONSUMER_DISCRETIONARY: { symbol: "XLY", price: price("XLY"), change: change("XLY"), changePercent: changePercent("XLY") },
            INDUSTRIALS: { symbol: "XLI", price: price("XLI"), change: change("XLI"), changePercent: changePercent("XLI") },
            UTILITIES: { symbol: "XLU", price: price("XLU"), change: change("XLU"), changePercent: changePercent("XLU") },
            REAL_ESTATE: { symbol: "XLRE", price: price("XLRE"), change: change("XLRE"), changePercent: changePercent("XLRE") }
          },

          CREDIT: {
            HIGH_YIELD: { symbol: "HYG", price: price("HYG"), change: change("HYG"), changePercent: changePercent("HYG") },
            INVESTMENT_GRADE: { symbol: "LQD", price: price("LQD"), change: change("LQD"), changePercent: changePercent("LQD") }
          },

          BREADTH: {
            TOTAL_MARKET: { symbol: "VTI", price: price("VTI"), change: change("VTI"), changePercent: changePercent("VTI") },
            LONG_TREASURY: { symbol: "TLT", price: price("TLT"), change: change("TLT"), changePercent: changePercent("TLT") }
          },

          CRYPTO: {
            BTC: { price: price("BTCUSD"), change: change("BTCUSD"), changePercent: changePercent("BTCUSD") },
            ETH: { price: price("ETHUSD"), change: change("ETHUSD"), changePercent: changePercent("ETHUSD") },
            SOL: { price: price("SOLUSD"), change: change("SOLUSD"), changePercent: changePercent("SOLUSD") }
          },

          COMMODITIES: {
            GOLD: { price: gold, change: change("GCUSD"), changePercent: changePercent("GCUSD") },
            SILVER: { price: silver, change: change("SIUSD"), changePercent: changePercent("SIUSD") },
            GOLD_SILVER_RATIO: gold && silver ? gold / silver : null
          },

          FX: {
            USDJPY: { price: price("USDJPY"), change: change("USDJPY"), changePercent: changePercent("USDJPY") },
            EURUSD: { price: price("EURUSD"), change: change("EURUSD"), changePercent: changePercent("EURUSD") },
            DXY: { price: price("DX"), change: change("DX"), changePercent: changePercent("DX") }
          },

          MACRO_BASE: {
            CPI: cpiValue,
            INFLATION_EXPECTATION: inflationValue,
            UNEMPLOYMENT: unemploymentValue,
            M2: m2Value,
            REAL_RATES: us10yValue && inflationValue ? us10yValue - inflationValue : null
          },

          MACRO_INDICATORS: {
            CONSUMER_SENTIMENT: { value: sentimentValue },
            REAL_GDP: { value: gdpValue },
            INDUSTRIAL_PRODUCTION: { value: industrialValue },
            NONFARM_PAYROLLS: { value: payrollValue },
            PCE_INFLATION: { value: pceInflationValue }
          },

          RATES: {
            US10Y: us10yValue,
            US2Y: us2yValue,
            YIELD_CURVE: us10yValue && us2yValue ? us10yValue - us2yValue : null
          },

          LIQUIDITY: {
            FED_BALANCE: fedBalanceValue,
            REVERSE_REPO: rrpValue,
            TGA: tgaValue,
            REAL_LIQUIDITY: fedBalanceValue && rrpValue && tgaValue ? (fedBalanceValue / 1000) - rrpValue - (tgaValue / 1000) : null
          }
        }
      }

      /* ================================
         2. 간소화된 개별 주식 분석
      ================================ */
      async function getSimpleStockAnalysis(sym) {
        console.log(`📈 ${sym} 분석 중...`)

        const quote = await getQuote(sym)

        if (!quote) {
          return { error: `${sym} 데이터를 찾을 수 없습니다` }
        }

        const changePercent = quote?.changePercentage
        let technicalScore = 50
        if (changePercent > 5) technicalScore = 100
        else if (changePercent > 2) technicalScore = 80
        else if (changePercent > -2) technicalScore = 60
        else if (changePercent > -5) technicalScore = 40
        else technicalScore = 20

        const price = quote?.price
        const yearHigh = quote?.yearHigh
        const yearLow = quote?.yearLow
        let valuationScore = 50

        if (price && yearHigh && yearLow) {
          const rangePercent = (price - yearLow) / (yearHigh - yearLow) * 100
          if (rangePercent < 30) valuationScore = 100
          else if (rangePercent < 50) valuationScore = 80
          else if (rangePercent < 70) valuationScore = 60
          else if (rangePercent < 85) valuationScore = 40
          else valuationScore = 20
        }

        const volume = quote?.volume
        const dayHigh = quote?.dayHigh
        const dayLow = quote?.dayLow
        let liquidityScore = 60

        if (volume > 40000000) liquidityScore = 100
        else if (volume > 20000000) liquidityScore = 80
        else if (volume > 10000000) liquidityScore = 60
        else liquidityScore = 40

        let volatilityScore = 50
        if (dayHigh && dayLow && price) {
          const dayRange = ((dayHigh - dayLow) / price) * 100
          if (dayRange < 1) volatilityScore = 80
          else if (dayRange < 3) volatilityScore = 60
          else if (dayRange < 5) volatilityScore = 40
          else volatilityScore = 20
        }

        const overallScore = Math.round(
          (technicalScore * 0.40) +
          (valuationScore * 0.30) +
          (liquidityScore * 0.20) +
          (volatilityScore * 0.10)
        )

        let recommendation = "HOLD"
        if (overallScore >= 75) recommendation = "BUY"
        else if (overallScore < 50) recommendation = "SELL"

        return {
          timestamp: new Date().toISOString(),
          dataType: "simple_stock_analysis",
          symbol: sym,
          currentPrice: {
            price: quote?.price,
            change: quote?.change,
            changePercent: quote?.changePercentage
          },
          aiAnalysis: {
            overallScore: overallScore,
            recommendation: recommendation,
            components: {
              technicalScore: technicalScore,
              valuationScore: valuationScore,
              liquidityScore: liquidityScore,
              volatilityScore: volatilityScore
            }
          }
        }
      }

      /* ================================
         요청 처리
      ================================ */
      let response

      if (action === 'market') {
        response = await getMarketData()

      } else if (action === 'stock') {
        if (!symbol) {
          response = {
            error: "종목 심볼을 지정하세요",
            usage: "?action=stock&symbol=AAPL"
          }
        } else {
          response = await getSimpleStockAnalysis(symbol.toUpperCase())
        }

      } else {
        response = {
          error: "잘못된 요청",
          usage: {
            fred_single: "?series=DGS10 (개별 FRED)",
            market: "?action=market (마켓 + FRED 전체)",
            stock: "?action=stock&symbol=AAPL (개별 주식)"
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
          headers: {
            "content-type": "application/json"
          }
        }
      )
    }
  }
}
