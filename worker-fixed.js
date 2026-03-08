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
        additional: ["UMCSENT", "GDPC1", "INDPRO", "PAYEMS", "PCEPI"],
        commodities: ["DCOILWTICO"]  // ✅ WTI Oil 추가
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

      async function yahooFinanceGet(symbol) {
        try {
          const r = await fetch(
            `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`
          )
          const j = await r.json()
          const price = j?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw
          return price ? { symbol, price } : null
        } catch (e) {
          console.error(`❌ Yahoo Finance ${symbol} 실패:`, e.message)
          return null
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

        const commoditiesFredData = await Promise.all(
          FRED_SYMBOLS.commodities.map(series => fredGet(series))
        )

        function getLatestValue(fredArray) {
          if (!fredArray || fredArray.length === 0) return null
          // "." 값을 건너뛰고 유효한 값 찾기
          for (let i = fredArray.length - 1; i >= 0; i--) {
            const val = fredArray[i].value
            if (val && val !== '.' && val !== '') {
              return parseFloat(val)
            }
          }
          return null
        }

        const [cpiValue, inflationValue, unemploymentValue, m2Value, fedBalanceValue, rrpValue, tgaValue, us10yValue, us2yValue] =
          macroFredData.map(getLatestValue)

        const [sentimentValue, gdpValue, industrialValue, payrollValue, pceInflationValue] =
          additionalFredData.map(getLatestValue)

        const [oilValue] = commoditiesFredData.map(getLatestValue)

        const gold = price("GCUSD")
        const silver = price("SIUSD")
        const oil = oilValue || price("WTIUSD")  // FRED 또는 FMP fallback

        // FX Fallback - Yahoo Finance
        let usdJpyPrice = price("USDJPY")
        let eurUsdPrice = price("EURUSD")

        if (!usdJpyPrice) {
          const yf_usdjpy = await yahooFinanceGet("USDJPY=X")
          usdJpyPrice = yf_usdjpy?.price
        }

        if (!eurUsdPrice) {
          const yf_eurusd = await yahooFinanceGet("EURUSD=X")
          eurUsdPrice = yf_eurusd?.price
        }

        return {
          timestamp: new Date().toISOString(),
          dataType: "market",

          US_MARKET: {
            SP500: { price: price("SPY") ? `$${price("SPY")}` : null, change: change("SPY"), changePercent: `${changePercent("SPY")}%` },
            NASDAQ: { price: price("QQQ") ? `$${price("QQQ")}` : null, change: change("QQQ"), changePercent: `${changePercent("QQQ")}%` },
            DOW: { price: price("DIA") ? `$${price("DIA")}` : null, change: change("DIA"), changePercent: `${changePercent("DIA")}%` },
            VIX: { price: price("^VIX") ? `${price("^VIX")}pts` : null, change: change("^VIX"), changePercent: `${changePercent("^VIX")}%` },
            SOX: { price: price("SOXX") ? `$${price("SOXX")}` : null, change: change("SOXX"), changePercent: `${changePercent("SOXX")}%` },
            RUSSELL2000: { price: price("IWM") ? `$${price("IWM")}` : null, change: change("IWM"), changePercent: `${changePercent("IWM")}%` }
          },

          SECTORS: {
            TECHNOLOGY: { symbol: "XLK", price: price("XLK") ? `$${price("XLK")}` : null, change: change("XLK"), changePercent: `${changePercent("XLK")}%` },
            FINANCIALS: { symbol: "XLF", price: price("XLF") ? `$${price("XLF")}` : null, change: change("XLF"), changePercent: `${changePercent("XLF")}%` },
            ENERGY: { symbol: "XLE", price: price("XLE") ? `$${price("XLE")}` : null, change: change("XLE"), changePercent: `${changePercent("XLE")}%` },
            HEALTHCARE: { symbol: "XLV", price: price("XLV") ? `$${price("XLV")}` : null, change: change("XLV"), changePercent: `${changePercent("XLV")}%` },
            CONSUMER_DISCRETIONARY: { symbol: "XLY", price: price("XLY") ? `$${price("XLY")}` : null, change: change("XLY"), changePercent: `${changePercent("XLY")}%` },
            INDUSTRIALS: { symbol: "XLI", price: price("XLI") ? `$${price("XLI")}` : null, change: change("XLI"), changePercent: `${changePercent("XLI")}%` },
            UTILITIES: { symbol: "XLU", price: price("XLU") ? `$${price("XLU")}` : null, change: change("XLU"), changePercent: `${changePercent("XLU")}%` },
            REAL_ESTATE: { symbol: "XLRE", price: price("XLRE") ? `$${price("XLRE")}` : null, change: change("XLRE"), changePercent: `${changePercent("XLRE")}%` }
          },

          CREDIT: {
            HIGH_YIELD: { symbol: "HYG", price: price("HYG") ? `$${price("HYG")}` : null, change: change("HYG"), changePercent: `${changePercent("HYG")}%` },
            INVESTMENT_GRADE: { symbol: "LQD", price: price("LQD") ? `$${price("LQD")}` : null, change: change("LQD"), changePercent: `${changePercent("LQD")}%` }
          },

          BREADTH: {
            TOTAL_MARKET: { symbol: "VTI", price: price("VTI") ? `$${price("VTI")}` : null, change: change("VTI"), changePercent: `${changePercent("VTI")}%` },
            LONG_TREASURY: { symbol: "TLT", price: price("TLT") ? `$${price("TLT")}` : null, change: change("TLT"), changePercent: `${changePercent("TLT")}%` }
          },

          CRYPTO: {
            BTC: { price: price("BTCUSD") ? `$${price("BTCUSD")}` : null, change: change("BTCUSD"), changePercent: `${changePercent("BTCUSD")}%` },
            ETH: { price: price("ETHUSD") ? `$${price("ETHUSD")}` : null, change: change("ETHUSD"), changePercent: `${changePercent("ETHUSD")}%` },
            SOL: { price: price("SOLUSD") ? `$${price("SOLUSD")}` : null, change: change("SOLUSD"), changePercent: `${changePercent("SOLUSD")}%` }
          },

          COMMODITIES: {
            GOLD: { price: gold ? `$${gold}/oz` : null, change: change("GCUSD"), changePercent: `${changePercent("GCUSD")}%` },
            SILVER: { price: silver ? `$${silver}/oz` : null, change: change("SIUSD"), changePercent: `${changePercent("SIUSD")}%` },
            OIL_WTI: { price: oil ? `$${oil.toFixed(2)}/bbl` : null, change: null, changePercent: null },
            GOLD_SILVER_RATIO: gold && silver ? `${(gold / silver).toFixed(2)}:1` : null
          },

          FX: {
            USDJPY: { price: usdJpyPrice ? `¥${usdJpyPrice.toFixed(2)}/USD` : null, change: change("USDJPY"), changePercent: `${changePercent("USDJPY")}%` },
            EURUSD: { price: eurUsdPrice ? `€${eurUsdPrice.toFixed(4)}/USD` : null, change: change("EURUSD"), changePercent: `${changePercent("EURUSD")}%` },
            DXY: { price: price("DX") ? `${price("DX").toFixed(2)}` : null, change: change("DX"), changePercent: `${changePercent("DX")}%` }
          },

          MACRO_BASE: {
            CPI: cpiValue ? `${cpiValue.toFixed(2)}idx` : null,
            INFLATION_EXPECTATION: inflationValue ? `${inflationValue.toFixed(2)}%` : null,
            UNEMPLOYMENT: unemploymentValue ? `${unemploymentValue.toFixed(2)}%` : null,
            M2: m2Value ? `${(m2Value / 1000).toFixed(2)}T` : null,
            REAL_RATES: us10yValue && inflationValue ? `${(us10yValue - inflationValue).toFixed(2)}%` : null
          },

          MACRO_INDICATORS: {
            CONSUMER_SENTIMENT: sentimentValue ? `${sentimentValue.toFixed(2)}idx` : null,
            REAL_GDP: gdpValue ? `${gdpValue.toFixed(0)}B` : null,
            INDUSTRIAL_PRODUCTION: industrialValue ? `${industrialValue.toFixed(2)}idx` : null,
            NONFARM_PAYROLLS: payrollValue ? `${(payrollValue / 1000).toFixed(0)}M` : null,
            PCE_INFLATION: pceInflationValue ? `${pceInflationValue.toFixed(2)}%` : null
          },

          RATES: {
            US10Y: us10yValue ? `${us10yValue.toFixed(2)}%` : null,
            US2Y: us2yValue ? `${us2yValue.toFixed(2)}%` : null,
            YIELD_CURVE: us10yValue && us2yValue ? `${(us10yValue - us2yValue).toFixed(2)}%` : null
          },

          LIQUIDITY: {
            FED_BALANCE: fedBalanceValue ? `${(fedBalanceValue / 1000000).toFixed(1)}T` : null,
            REVERSE_REPO: rrpValue ? `${(rrpValue / 1000).toFixed(0)}B` : null,
            TGA: tgaValue ? `${(tgaValue / 1000000).toFixed(1)}T` : null,
            REAL_LIQUIDITY: fedBalanceValue && rrpValue && tgaValue ? `${((fedBalanceValue / 1000000) - (rrpValue / 1000) - (tgaValue / 1000000)).toFixed(0)}B` : null
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
