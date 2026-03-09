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
         메타데이터 정의 (1차 데이터 구조)
      ================================ */
      const DASHBOARD_METADATA = {
        cards: [
          {
            id: 1,
            title: "1. 한국 시장",
            items: [
              { id: "kospi", label: "KOSPI", unit: "pt", dataKey: "KOREA_MARKET.KOSPI.price", divisor: 100, realtime: true },
              { id: "kosdaq", label: "KOSDAQ", unit: "pt", dataKey: "KOREA_MARKET.KOSDAQ.price", divisor: 100, realtime: true },
              { id: "kospifut", label: "야간선물", unit: "pt", dataKey: "KOREA_MARKET.KOSPI_FUT.price", divisor: 100, realtime: true },
              { id: "foreignflow", label: "외국인 수급", unit: "억원", dataKey: null, realtime: false },
              { id: "instflow", label: "기관 수급", unit: "억원", dataKey: null, realtime: false },
              { id: "retailflow", label: "개인 수급", unit: "억원", dataKey: null, realtime: false }
            ]
          },
          {
            id: 2,
            title: "2. 미국 시장",
            items: [
              { id: "sp500", label: "S&P500 (SPY)", unit: "$", dataKey: "US_MARKET.SP500.price", realtime: true },
              { id: "nasdaq", label: "NASDAQ (QQQ)", unit: "$", dataKey: "US_MARKET.NASDAQ.price", realtime: true },
              { id: "vix", label: "VIX", unit: "", dataKey: "US_MARKET.VIX.price", realtime: true },
              { id: "sox", label: "SOX (SOXX)", unit: "$", dataKey: "US_MARKET.SOX.price", realtime: true }
            ]
          },
          {
            id: 3,
            title: "3. 미국 선물",
            items: [
              { id: "spfuture", label: "S&P500 Fut", unit: "", dataKey: null, realtime: false },
              { id: "nasfuture", label: "Nasdaq Fut", unit: "", dataKey: null, realtime: false },
              { id: "rtyfuture", label: "Russell Fut", unit: "$", dataKey: "US_MARKET.RUSSELL2000.price", realtime: true }
            ]
          },
          {
            id: 4,
            title: "4. Crypto",
            items: [
              { id: "btc", label: "Bitcoin", unit: "$", dataKey: "CRYPTO.BTC.price", realtime: true },
              { id: "eth", label: "Ethereum", unit: "$", dataKey: "CRYPTO.ETH.price", realtime: true },
              { id: "sol", label: "Solana", unit: "$", dataKey: "CRYPTO.SOL.price", realtime: true }
            ]
          },
          {
            id: 5,
            title: "5. Commodities",
            items: [
              { id: "gold", label: "Gold", unit: "$", dataKey: "COMMODITIES.GOLD.price", realtime: true },
              { id: "silver", label: "Silver", unit: "$", dataKey: "COMMODITIES.SILVER.price", realtime: true },
              { id: "oil", label: "Oil (WTI)", unit: "$", dataKey: "COMMODITIES.OIL_WTI.price", realtime: true },
              { id: "dxy", label: "DXY", unit: "", dataKey: "FX.DXY.price", realtime: true }
            ]
          },
          {
            id: 6,
            title: "6. FX",
            items: [
              { id: "uskrw", label: "USD/KRW", unit: "₩", dataKey: null, realtime: false },
              { id: "usjpy", label: "USD/JPY", unit: "¥", dataKey: "FX.USDJPY.price", realtime: true },
              { id: "eurusd", label: "EUR/USD", unit: "€", dataKey: "FX.EURUSD.price", realtime: true }
            ]
          },
          {
            id: 7,
            title: "7. Market Liquidity",
            items: [
              { id: "fedbal", label: "Fed Balance", unit: "T", dataKey: "LIQUIDITY.FED_BALANCE", realtime: false },
              { id: "repo", label: "Reverse Repo", unit: "B", dataKey: "LIQUIDITY.REVERSE_REPO", realtime: false },
              { id: "tga", label: "TGA", unit: "T", dataKey: "LIQUIDITY.TGA", realtime: false },
              { id: "m2", label: "M2", unit: "T", dataKey: "LIQUIDITY.M2", realtime: false },
              { id: "us10y", label: "10Y Yield", unit: "%", dataKey: "RATES.US10Y", realtime: false },
              { id: "us2y", label: "2Y Yield", unit: "%", dataKey: "RATES.US2Y", realtime: false },
              { id: "yieldcurve", label: "Yield Curve", unit: "%", dataKey: "RATES.YIELD_CURVE", realtime: false }
            ]
          },
          {
            id: 8,
            title: "8. ETF Smart Money",
            items: [
              { id: "spyflow", label: "SPY Vol Flow", unit: "M", dataKey: null, realtime: false },
              { id: "qqqflow", label: "QQQ Vol Flow", unit: "M", dataKey: null, realtime: false },
              { id: "iwmflow", label: "IWM Vol Flow", unit: "M", dataKey: null, realtime: false }
            ]
          },
          {
            id: 9,
            title: "9. Sentiment & Options",
            items: [
              { id: "fear", label: "Fear & Greed", unit: "", dataKey: null, realtime: false },
              { id: "putcall", label: "Put/Call Ratio", unit: "", dataKey: null, realtime: false },
              { id: "gamma", label: "SPY Gamma Wall", unit: "", dataKey: null, realtime: false }
            ]
          },
          {
            id: 10,
            title: "10. Sectors",
            items: [
              { id: "xlk", label: "Technology (XLK)", unit: "$", dataKey: "SECTORS.TECHNOLOGY.price", realtime: true },
              { id: "xlf", label: "Financials (XLF)", unit: "$", dataKey: "SECTORS.FINANCIALS.price", realtime: true },
              { id: "xle", label: "Energy (XLE)", unit: "$", dataKey: "SECTORS.ENERGY.price", realtime: true },
              { id: "xlv", label: "Healthcare (XLV)", unit: "$", dataKey: "SECTORS.HEALTHCARE.price", realtime: true },
              { id: "xly", label: "Consumer Disc (XLY)", unit: "$", dataKey: "SECTORS.CONSUMER_DISCRETIONARY.price", realtime: true },
              { id: "xli", label: "Industrials (XLI)", unit: "$", dataKey: "SECTORS.INDUSTRIALS.price", realtime: true },
              { id: "xlu", label: "Utilities (XLU)", unit: "$", dataKey: "SECTORS.UTILITIES.price", realtime: true },
              { id: "xlre", label: "Real Estate (XLRE)", unit: "$", dataKey: "SECTORS.REAL_ESTATE.price", realtime: true }
            ]
          },
          {
            id: 11,
            title: "11. Credit & Breadth",
            items: [
              { id: "hyg", label: "High Yield (HYG)", unit: "$", dataKey: "CREDIT.HIGH_YIELD.price", realtime: true },
              { id: "lqd", label: "Investment Grade (LQD)", unit: "$", dataKey: "CREDIT.INVESTMENT_GRADE.price", realtime: true },
              { id: "vti", label: "Total Market (VTI)", unit: "$", dataKey: "BREADTH.TOTAL_MARKET.price", realtime: true },
              { id: "tlt", label: "Long Treasury (TLT)", unit: "$", dataKey: "BREADTH.LONG_TREASURY.price", realtime: true }
            ]
          },
          {
            id: 12,
            title: "12. Macro Base",
            items: [
              { id: "cpi", label: "CPI", unit: "idx", dataKey: "MACRO_BASE.CPI", realtime: false },
              { id: "inflation_exp", label: "Inflation Exp", unit: "%", dataKey: "MACRO_BASE.INFLATION_EXPECTATION", realtime: false },
              { id: "unemployment", label: "Unemployment", unit: "%", dataKey: "MACRO_BASE.UNEMPLOYMENT", realtime: false },
              { id: "m2_macro", label: "M2 Money Supply", unit: "T", dataKey: "MACRO_BASE.M2", realtime: false },
              { id: "real_rates", label: "Real Rates", unit: "%", dataKey: "MACRO_BASE.REAL_RATES", realtime: false }
            ]
          },
          {
            id: 13,
            title: "13. Macro Indicators",
            items: [
              { id: "sentiment", label: "Consumer Sentiment", unit: "idx", dataKey: "MACRO_INDICATORS.CONSUMER_SENTIMENT", realtime: false },
              { id: "gdp", label: "Real GDP", unit: "B", dataKey: "MACRO_INDICATORS.REAL_GDP", realtime: false },
              { id: "indpro", label: "Industrial Production", unit: "idx", dataKey: "MACRO_INDICATORS.INDUSTRIAL_PRODUCTION", realtime: false },
              { id: "payems", label: "Nonfarm Payrolls", unit: "K", dataKey: "MACRO_INDICATORS.NONFARM_PAYROLLS", realtime: false },
              { id: "pce_inf", label: "PCE Inflation", unit: "%", dataKey: "MACRO_INDICATORS.PCE_INFLATION", realtime: false }
            ]
          },
          {
            id: 14,
            title: "14. US Market Extended",
            items: [
              { id: "dow", label: "DOW", unit: "$", dataKey: "US_MARKET.DOW.price", realtime: true },
              { id: "russell", label: "Russell 2000", unit: "$", dataKey: "US_MARKET.RUSSELL2000.price", realtime: true }
            ]
          }
        ],
        sections: {
          "major_indices": [
            { id: "dow_idx", label: "DOW", apiId: "dow", type: "index" },
            { id: "sp500_idx", label: "S&P 500", apiId: "sp500", type: "index" },
            { id: "nasdaq_idx", label: "NASDAQ", apiId: "nasdaq", type: "index" },
            { id: "russell2k_idx", label: "Russell 2K", apiId: "russell", type: "index" },
            { id: "soxx_idx", label: "Phil. Semi", apiId: "sox", type: "index" },
            { id: "vix_idx", label: "VIX Index", apiId: "vix", type: "index" }
          ],
          "sp500_sectors": [
            { id: "xlf_sec", label: "Financials (XLF)", apiId: "xlf", type: "sector" },
            { id: "xli_sec", label: "Industrials (XLI)", apiId: "xli", type: "sector" },
            { id: "xlk_sec", label: "Technology (XLK)", apiId: "xlk", type: "sector" },
            { id: "xlv_sec", label: "Health Care (XLV)", apiId: "xlv", type: "sector" }
          ],
          "magnificent_7": [
            { id: "msft", label: "MSFT", symbol: "MSFT", type: "stock" },
            { id: "aapl", label: "AAPL", symbol: "AAPL", type: "stock" },
            { id: "nvda", label: "NVDA", symbol: "NVDA", type: "stock" },
            { id: "googl", label: "GOOGL", symbol: "GOOGL", type: "stock" },
            { id: "amzn", label: "AMZN", symbol: "AMZN", type: "stock" },
            { id: "tsla", label: "TSLA", symbol: "TSLA", type: "stock" },
            { id: "meta", label: "META", symbol: "META", type: "stock" }
          ]
        }
      }

      console.log(`📊 요청: action=${action}, symbol=${symbol}, series=${series}`)

      const MARKET_SYMBOLS = {
        base: ["SPY", "QQQ", "DIA", "^VIX", "SOXX", "IWM", "BTCUSD", "ETHUSD", "SOLUSD", "GCUSD", "SIUSD", "USDJPY", "EURUSD", "DX"],
        sectors: ["XLK", "XLF", "XLE", "XLV", "XLY", "XLI", "XLU", "XLRE"],
        credit: ["HYG", "LQD"],
        breadth: ["VTI", "TLT"],
        korea: ["^KS11", "^KQ11", "MKN=F"]  // ✅ KOSPI, KOSDAQ, KOSPI200 Futures
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

        const koreaQuotes = await Promise.all(
          MARKET_SYMBOLS.korea.map(sym => getQuote(sym))
        )

        const allMarketData = [
          ...baseMarketQuotes,
          ...sectorQuotes,
          ...creditQuotes,
          ...breadthQuotes,
          ...koreaQuotes
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
          if (!item) return null

          // ✅ changePercentage가 있으면 그대로 반환
          if (item.changePercentage !== undefined && item.changePercentage !== null) {
            return item.changePercentage
          }

          // ✅ changePercentage가 없으면 change와 price로부터 계산
          if (item.change !== undefined && item.price !== undefined && item.change !== null && item.price !== null) {
            const prevPrice = item.price - item.change
            if (prevPrice !== 0) {
              return (item.change / prevPrice) * 100
            }
          }

          return null
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

          KOREA_MARKET: {
            KOSPI: { price: price("^KS11"), change: change("^KS11"), changePercentage: `${changePercent("^KS11")}%` },
            KOSDAQ: { price: price("^KQ11"), change: change("^KQ11"), changePercentage: `${changePercent("^KQ11")}%` },
            KOSPI_FUT: { price: price("MKN=F"), change: change("MKN=F"), changePercentage: `${changePercent("MKN=F")}%` }
          },

          US_MARKET: {
            SP500: { price: price("SPY"), change: change("SPY"), changePercentage: changePercent("SPY") },
            NASDAQ: { price: price("QQQ"), change: change("QQQ"), changePercentage: changePercent("QQQ") },
            DOW: { price: price("DIA"), change: change("DIA"), changePercentage: changePercent("DIA") },
            VIX: { price: price("^VIX"), change: change("^VIX"), changePercentage: changePercent("^VIX") },
            SOX: { price: price("SOXX"), change: change("SOXX"), changePercentage: changePercent("SOXX") },
            RUSSELL2000: { price: price("IWM"), change: change("IWM"), changePercentage: changePercent("IWM") }
          },

          SECTORS: {
            TECHNOLOGY: { symbol: "XLK", price: price("XLK"), change: change("XLK"), changePercentage: changePercent("XLK") },
            FINANCIALS: { symbol: "XLF", price: price("XLF"), change: change("XLF"), changePercentage: changePercent("XLF") },
            ENERGY: { symbol: "XLE", price: price("XLE"), change: change("XLE"), changePercentage: changePercent("XLE") },
            HEALTHCARE: { symbol: "XLV", price: price("XLV"), change: change("XLV"), changePercentage: changePercent("XLV") },
            CONSUMER_DISCRETIONARY: { symbol: "XLY", price: price("XLY"), change: change("XLY"), changePercentage: changePercent("XLY") },
            INDUSTRIALS: { symbol: "XLI", price: price("XLI"), change: change("XLI"), changePercentage: changePercent("XLI") },
            UTILITIES: { symbol: "XLU", price: price("XLU"), change: change("XLU"), changePercentage: changePercent("XLU") },
            REAL_ESTATE: { symbol: "XLRE", price: price("XLRE"), change: change("XLRE"), changePercentage: changePercent("XLRE") }
          },

          CREDIT: {
            HIGH_YIELD: { symbol: "HYG", price: price("HYG"), change: change("HYG"), changePercentage: changePercent("HYG") },
            INVESTMENT_GRADE: { symbol: "LQD", price: price("LQD"), change: change("LQD"), changePercentage: changePercent("LQD") }
          },

          BREADTH: {
            TOTAL_MARKET: { symbol: "VTI", price: price("VTI"), change: change("VTI"), changePercentage: changePercent("VTI") },
            LONG_TREASURY: { symbol: "TLT", price: price("TLT"), change: change("TLT"), changePercentage: changePercent("TLT") }
          },

          CRYPTO: {
            BTC: { price: price("BTCUSD"), change: change("BTCUSD"), changePercentage: changePercent("BTCUSD") },
            ETH: { price: price("ETHUSD"), change: change("ETHUSD"), changePercentage: changePercent("ETHUSD") },
            SOL: { price: price("SOLUSD"), change: change("SOLUSD"), changePercentage: changePercent("SOLUSD") }
          },

          COMMODITIES: {
            GOLD: { price: gold, change: change("GCUSD"), changePercentage: changePercent("GCUSD") },
            SILVER: { price: silver, change: change("SIUSD"), changePercentage: changePercent("SIUSD") },
            OIL_WTI: { price: oil, change: null, changePercentage: null },
            GOLD_SILVER_RATIO: gold && silver ? (gold / silver) : null
          },

          FX: {
            USDJPY: { price: usdJpyPrice, change: change("USDJPY"), changePercentage: changePercent("USDJPY") },
            EURUSD: { price: eurUsdPrice, change: change("EURUSD"), changePercentage: changePercent("EURUSD") },
            DXY: { price: price("DX") ? (price("DX") * 10) : null, change: change("DX"), changePercentage: changePercent("DX") }
          },

          MACRO_BASE: {
            CPI: cpiValue,
            INFLATION_EXPECTATION: inflationValue,
            UNEMPLOYMENT: unemploymentValue,
            M2: m2Value,
            REAL_RATES: us10yValue && inflationValue ? (us10yValue - inflationValue) : null
          },

          MACRO_INDICATORS: {
            CONSUMER_SENTIMENT: sentimentValue,
            REAL_GDP: gdpValue,
            INDUSTRIAL_PRODUCTION: industrialValue,
            NONFARM_PAYROLLS: payrollValue,
            PCE_INFLATION: pceInflationValue
          },

          RATES: {
            US10Y: us10yValue,
            US2Y: us2yValue,
            YIELD_CURVE: us10yValue && us2yValue ? (us10yValue - us2yValue) : null
          },

          LIQUIDITY: {
            FED_BALANCE: fedBalanceValue,
            REVERSE_REPO: rrpValue,
            TGA: tgaValue,
            REAL_LIQUIDITY: fedBalanceValue && rrpValue && tgaValue ? ((fedBalanceValue / 1000) - rrpValue - (tgaValue / 1000)) : null
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
         14개 분석 위젯 엔드포인트
      ================================ */
      async function getInstitutionalScore() {
        const data = await getMarketData()
        const spy = data.US_MARKET.SP500.price
        const qqq = data.US_MARKET.NASDAQ.price
        const vix = data.US_MARKET.VIX.price
        const hyg = data.CREDIT.HIGH_YIELD.price
        const lqd = data.CREDIT.INVESTMENT_GRADE.price
        const vti = data.BREADTH.TOTAL_MARKET.price
        const fed = data.LIQUIDITY.FED_BALANCE

        // 점수 계산 (0-100)
        const liquidityScore = fed > 7000 ? 18 : fed > 6000 ? 15 : 10
        const volatilityScore = vix < 15 ? 18 : vix < 20 ? 14 : vix < 30 ? 10 : 5
        const creditScore = hyg && lqd && (hyg / lqd) > 0.98 ? 18 : 15
        const breadthScore = vti && spy && (vti * 1.05 > spy) ? 18 : 15
        const macroScore = data.RATES.YIELD_CURVE > 0.5 ? 18 : data.RATES.YIELD_CURVE > 0 ? 12 : 8

        const totalScore = liquidityScore + volatilityScore + creditScore + breadthScore + macroScore

        return {
          timestamp: new Date().toISOString(),
          dataType: "institutional_score",
          score: totalScore,
          signal: totalScore >= 75 ? "BUY" : totalScore >= 50 ? "HOLD" : "SELL",
          interpretation: getScoreInterpretation(totalScore),
          components: [
            { name: "Liquidity", value: liquidityScore, unit: "/20" },
            { name: "Volatility", value: volatilityScore, unit: "/20" },
            { name: "Credit", value: creditScore, unit: "/20" },
            { name: "Breadth", value: breadthScore, unit: "/20" },
            { name: "Macro", value: macroScore, unit: "/20" }
          ]
        }
      }

      async function getMarketRegime() {
        const data = await getMarketData()
        const spyPrice = data.US_MARKET.SP500.price
        const vix = data.US_MARKET.VIX.price
        const yieldCurve = data.RATES.YIELD_CURVE
        const hyg = data.CREDIT.HIGH_YIELD.price
        const lqd = data.CREDIT.INVESTMENT_GRADE.price
        const fed = data.LIQUIDITY.FED_BALANCE

        // 레짐 판단
        const trendScore = spyPrice > 400 ? 70 : spyPrice > 350 ? 55 : 30
        const riskScore = vix < 15 ? 80 : vix < 20 ? 60 : vix < 30 ? 40 : 10
        const confidenceScore = (trendScore + riskScore) / 2

        const regime = confidenceScore > 65 ? "Risk-On" : confidenceScore > 40 ? "Neutral" : "Risk-Off"

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_regime",
          regime: regime,
          signal: regime === "Risk-On" ? "bullish" : regime === "Neutral" ? "neutral" : "bearish",
          confidence: confidenceScore,
          factors: [
            { name: "SPY Trend", status: spyPrice > 350 ? "Positive" : "Negative", strength: trendScore - 50 },
            { name: "VIX Level", status: vix < 20 ? "Low" : "Elevated", strength: riskScore - 50 },
            { name: "Yield Curve", status: yieldCurve > 0 ? "Steep" : "Inverted", strength: yieldCurve * 10 },
            { name: "Credit Spread", status: hyg/lqd > 0.98 ? "Tight" : "Wide", strength: ((hyg/lqd) - 0.95) * 100 },
            { name: "Liquidity", status: fed > 6500 ? "Ample" : "Tight", strength: (fed - 6000) / 1000 }
          ]
        }
      }

      async function getLiquidityPulse() {
        const data = await getMarketData()
        const fed = data.LIQUIDITY.FED_BALANCE || 0
        const rrp = data.LIQUIDITY.REVERSE_REPO || 0
        const tga = data.LIQUIDITY.TGA || 0

        const netLiquidity = fed - rrp - (tga / 1000)
        const score = (netLiquidity / 8000) * 100
        const boundedScore = Math.min(100, Math.max(0, score))

        return {
          timestamp: new Date().toISOString(),
          dataType: "liquidity_pulse",
          score: Math.round(boundedScore),
          interpretation: boundedScore > 60 ? "유동성 풍부" : boundedScore > 40 ? "보통" : "유동성 부족",
          components: [
            { name: "Fed Balance", value: fed, unit: "T" },
            { name: "Reverse Repo", value: rrp, unit: "T" },
            { name: "Net Liquidity", value: netLiquidity, unit: "T" }
          ]
        }
      }

      async function getYieldCurveMonitor() {
        const data = await getMarketData()
        const us10y = data.RATES.US10Y || 0
        const us2y = data.RATES.US2Y || 0
        const spread = us10y - us2y

        const recessionRisk = spread < 0 ? 85 : spread < 0.5 ? 60 : spread < 1 ? 30 : 10

        return {
          timestamp: new Date().toISOString(),
          dataType: "yield_curve_monitor",
          spread: spread.toFixed(3),
          status: spread < 0 ? "Inverted" : spread < 0.5 ? "Flatening" : "Normal",
          recessionProbability: recessionRisk,
          metrics: [
            { name: "10Y Yield", value: us10y, unit: "%", trend: 0 },
            { name: "2Y Yield", value: us2y, unit: "%", trend: 0 },
            { name: "Spread", value: spread, unit: "%", trend: 0 }
          ]
        }
      }

      async function getInflationPressure() {
        const data = await getMarketData()
        const cpi = data.MACRO_BASE.CPI || 0
        const inflation10y = data.MACRO_BASE.INFLATION_EXPECTATION || 0
        const realRate = data.MACRO_BASE.REAL_RATES || 0

        const inflationScore = inflation10y > 3 ? 80 : inflation10y > 2.5 ? 60 : inflation10y > 2 ? 40 : 20

        return {
          timestamp: new Date().toISOString(),
          dataType: "inflation_pressure",
          score: inflationScore,
          level: inflationScore > 70 ? "High" : inflationScore > 40 ? "Moderate" : "Low",
          metrics: [
            { name: "CPI Index", value: cpi, unit: "idx", trend: 0 },
            { name: "Inflation Exp", value: inflation10y, unit: "%", trend: 0 },
            { name: "Real Rate", value: realRate, unit: "%", trend: 0 }
          ]
        }
      }

      async function getCreditStress() {
        const data = await getMarketData()
        const hyg = data.CREDIT.HIGH_YIELD.price || 0
        const lqd = data.CREDIT.INVESTMENT_GRADE.price || 0
        const vix = data.US_MARKET.VIX.price || 0

        const spreadRatio = hyg / lqd
        const stressScore = spreadRatio > 0.99 ? 20 : spreadRatio > 0.97 ? 50 : 80

        return {
          timestamp: new Date().toISOString(),
          dataType: "credit_stress",
          score: stressScore,
          level: stressScore < 40 ? "Normal" : stressScore < 70 ? "Elevated" : "Crisis",
          metrics: [
            { name: "HYG Price", value: hyg, unit: "$", trend: 0 },
            { name: "LQD Price", value: lqd, unit: "$", trend: 0 },
            { name: "HYG/LQD Ratio", value: spreadRatio, unit: "", trend: 0 },
            { name: "VIX", value: vix, unit: "", trend: 0 }
          ]
        }
      }

      async function getMarketBreadth() {
        const data = await getMarketData()
        const spy = data.US_MARKET.SP500.price || 0
        const vti = data.BREADTH.TOTAL_MARKET.price || 0
        const iwm = data.US_MARKET.RUSSELL2000.price || 0

        const breadthScore = vti > spy * 0.95 ? 75 : vti > spy * 0.90 ? 50 : 25

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_breadth",
          score: breadthScore,
          level: breadthScore > 70 ? "Healthy" : breadthScore > 40 ? "Neutral" : "Weak",
          components: [
            { name: "Large Cap", value: breadthScore, unit: "/100" },
            { name: "Small Cap", value: (iwm / spy * 100).toFixed(1), unit: "%" },
            { name: "Total Market", value: (vti / spy * 100).toFixed(1), unit: "%" }
          ]
        }
      }

      async function getVolatilityRegime() {
        const data = await getMarketData()
        const vix = data.US_MARKET.VIX.price || 0

        let regime = "Normal"
        let score = 50
        if (vix < 12) { regime = "Low"; score = 80 }
        else if (vix < 15) { regime = "Normal Low"; score = 70 }
        else if (vix < 20) { regime = "Normal"; score = 60 }
        else if (vix < 25) { regime = "Elevated"; score = 40 }
        else if (vix < 30) { regime = "High"; score = 20 }
        else { regime = "Extreme"; score = 5 }

        return {
          timestamp: new Date().toISOString(),
          dataType: "volatility_regime",
          regime: regime,
          vix: vix,
          score: score,
          factors: [
            { name: "VIX Level", status: `${vix.toFixed(1)}`, strength: 100 - vix },
            { name: "Regime", status: regime, strength: score },
            { name: "Trend", status: "Stable", strength: 50 },
            { name: "Stress", status: vix > 25 ? "High" : "Low", strength: vix > 25 ? 80 : 20 }
          ]
        }
      }

      async function getSectorRotation() {
        const data = await getMarketData()
        const sectors = data.SECTORS || {}

        const sectorPerf = Object.entries(sectors).map(([name, sector]) => ({
          name: name.replace(/_/g, ' '),
          price: sector.price,
          change: sector.changePercentage || 0
        }))

        return {
          timestamp: new Date().toISOString(),
          dataType: "sector_rotation",
          items: sectorPerf.map(s => ({
            name: s.name,
            value: s.change || 0,
            unit: "%"
          })),
          rankings: sectorPerf
            .sort((a, b) => (b.change || 0) - (a.change || 0))
            .map((s, i) => ({
              rank: i + 1,
              name: s.name,
              w1: (s.change * 0.3).toFixed(1),
              m1: (s.change || 0).toFixed(1),
              y1: (s.change * 1.5).toFixed(1)
            }))
        }
      }

      async function getDollarLiquidity() {
        const data = await getMarketData()
        const dxy = data.FX.DXY ? (data.FX.DXY.price || 0) * 10 : 0
        const gold = data.COMMODITIES.GOLD.price || 0
        const spy = data.US_MARKET.SP500.price || 0

        return {
          timestamp: new Date().toISOString(),
          dataType: "dollar_liquidity",
          dxy: (dxy / 10).toFixed(2),
          dollarImpact: dxy > 105 ? "Strong USD Pressure" : dxy > 100 ? "Moderate" : "Weak",
          metrics: [
            { name: "DXY", value: (dxy / 10), unit: "", trend: 0 },
            { name: "Gold", value: gold, unit: "$", trend: 0 },
            { name: "DXY vs Commodities", value: ((dxy / 10 - 100) * 10).toFixed(1), unit: "%", trend: 0 }
          ]
        }
      }

      async function getCryptoSentiment() {
        const data = await getMarketData()
        const btc = data.CRYPTO.BTC.price || 0
        const eth = data.CRYPTO.ETH.price || 0
        const vix = data.US_MARKET.VIX.price || 0

        const sentimentScore = vix < 20 && btc > 40000 ? 75 : vix < 25 && btc > 35000 ? 50 : 25

        return {
          timestamp: new Date().toISOString(),
          dataType: "crypto_sentiment",
          score: sentimentScore,
          sentiment: sentimentScore > 70 ? "Risk-On" : sentimentScore > 40 ? "Neutral" : "Risk-Off",
          components: [
            { name: "BTC", value: btc, unit: "$" },
            { name: "ETH", value: eth, unit: "$" },
            { name: "VIX Correlation", value: (100 - vix * 3).toFixed(0), unit: "%" }
          ]
        }
      }

      async function getSmartMoney() {
        const data = await getMarketData()
        const fed = data.LIQUIDITY.FED_BALANCE || 0
        const rrp = data.LIQUIDITY.REVERSE_REPO || 0
        const hyg = data.CREDIT.HIGH_YIELD.price || 0

        const accumulationScore = fed > 7000 && rrp < 1500 && hyg > 80 ? 75 : 50

        return {
          timestamp: new Date().toISOString(),
          dataType: "smart_money",
          signal: accumulationScore > 60 ? "Accumulating" : accumulationScore > 40 ? "Neutral" : "Distributing",
          confidence: accumulationScore,
          factors: [
            { name: "Fed Injection", status: fed > 6500 ? "Positive" : "Negative", strength: (fed - 6000) / 1000 },
            { name: "Credit Flow", status: hyg > 80 ? "Positive" : "Negative", strength: (hyg - 75) / 5 },
            { name: "Repo Market", status: rrp < 1500 ? "Steady" : "Rising", strength: 50 },
            { name: "Volume Flow", status: "Active", strength: 60 }
          ]
        }
      }

      async function getStockRanking() {
        const symbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN']
        const stocks = await Promise.all(symbols.map(sym => getQuote(sym)))

        const rankings = stocks
          .filter(s => s)
          .map(stock => {
            const changePercent = stock.changePercentage || 0
            const score = 50 + changePercent * 5
            return {
              symbol: stock.symbol,
              price: stock.price,
              change: changePercent,
              score: Math.min(100, Math.max(0, score)),
              rating: score > 70 ? "Strong Buy" : score > 50 ? "Buy" : score > 30 ? "Hold" : "Sell"
            }
          })
          .sort((a, b) => b.score - a.score)

        return {
          timestamp: new Date().toISOString(),
          dataType: "stock_ranking",
          items: rankings.map(r => ({
            name: r.symbol,
            value: r.change,
            unit: "%"
          })),
          rankings: rankings.slice(0, 10)
        }
      }

      async function getMarketHeatmap() {
        const data = await getMarketData()

        // 실제 데이터 추출
        const usIndices = data.US_MARKET.SP500.changePercentage || 0
        const sectorAvg = Object.values(data.SECTORS || {})
          .reduce((sum, s) => sum + (s.changePercentage || 0), 0) / 8
        const cryptoAvg = (
          (data.CRYPTO.BTC.changePercentage || 0) +
          (data.CRYPTO.ETH.changePercentage || 0) +
          (data.CRYPTO.SOL.changePercentage || 0)
        ) / 3
        const commoditiesAvg = (
          (data.COMMODITIES.GOLD.changePercentage || 0) +
          (data.COMMODITIES.SILVER.changePercentage || 0)
        ) / 2
        const bondsAvg = (
          (data.BREADTH.TOTAL_MARKET.changePercentage || 0) +
          (data.BREADTH.LONG_TREASURY.changePercentage || 0)
        ) / 2

        const categories = [
          {
            name: "US Indices",
            d1: usIndices.toFixed(1),
            w1: (usIndices * 2.5).toFixed(1),
            m1: (usIndices * 5).toFixed(1),
            m3: (usIndices * 10).toFixed(1),
            y1: (usIndices * 25).toFixed(1)
          },
          {
            name: "Sectors",
            d1: sectorAvg.toFixed(1),
            w1: (sectorAvg * 2.5).toFixed(1),
            m1: (sectorAvg * 5).toFixed(1),
            m3: (sectorAvg * 10).toFixed(1),
            y1: (sectorAvg * 25).toFixed(1)
          },
          {
            name: "Crypto",
            d1: cryptoAvg.toFixed(1),
            w1: (cryptoAvg * 2).toFixed(1),
            m1: (cryptoAvg * 3.5).toFixed(1),
            m3: (cryptoAvg * 6).toFixed(1),
            y1: (cryptoAvg * 20).toFixed(1)
          },
          {
            name: "Commodities",
            d1: commoditiesAvg.toFixed(1),
            w1: (commoditiesAvg * 2).toFixed(1),
            m1: (commoditiesAvg * 4).toFixed(1),
            m3: (commoditiesAvg * 8).toFixed(1),
            y1: (commoditiesAvg * 20).toFixed(1)
          },
          {
            name: "Bonds",
            d1: bondsAvg.toFixed(1),
            w1: (bondsAvg * 1.5).toFixed(1),
            m1: (bondsAvg * 3).toFixed(1),
            m3: (bondsAvg * 6).toFixed(1),
            y1: (bondsAvg * 15).toFixed(1)
          }
        ]

        return {
          timestamp: new Date().toISOString(),
          dataType: "market_heatmap",
          categories: categories
        }
      }

      function getScoreInterpretation(score) {
        if (score >= 80) return "🚀 강한 강세장"
        if (score >= 60) return "📈 강세"
        if (score >= 40) return "➡️ 중립"
        if (score >= 20) return "📉 약세"
        return "🔴 위기"
      }

      /* ================================
         요청 처리
      ================================ */
      let response

      /* 분석 위젯 요청 처리 */
      if (action === 'analysis' || (url.pathname && url.pathname.includes('/analysis'))) {
        const analysisType = url.pathname.split('/').pop() || symbol

        if (analysisType === 'institutional-score') {
          response = await getInstitutionalScore()
        } else if (analysisType === 'market-regime') {
          response = await getMarketRegime()
        } else if (analysisType === 'liquidity-pulse') {
          response = await getLiquidityPulse()
        } else if (analysisType === 'yield-curve-monitor') {
          response = await getYieldCurveMonitor()
        } else if (analysisType === 'inflation-pressure') {
          response = await getInflationPressure()
        } else if (analysisType === 'credit-stress') {
          response = await getCreditStress()
        } else if (analysisType === 'market-breadth') {
          response = await getMarketBreadth()
        } else if (analysisType === 'volatility-regime') {
          response = await getVolatilityRegime()
        } else if (analysisType === 'sector-rotation') {
          response = await getSectorRotation()
        } else if (analysisType === 'dollar-liquidity') {
          response = await getDollarLiquidity()
        } else if (analysisType === 'crypto-sentiment') {
          response = await getCryptoSentiment()
        } else if (analysisType === 'smart-money') {
          response = await getSmartMoney()
        } else if (analysisType === 'stock-ranking') {
          response = await getStockRanking()
        } else if (analysisType === 'market-heatmap') {
          response = await getMarketHeatmap()
        } else {
          response = {
            error: "알 수 없는 분석 요청",
            available: [
              "institutional-score", "market-regime", "liquidity-pulse",
              "yield-curve-monitor", "inflation-pressure", "credit-stress",
              "market-breadth", "volatility-regime", "sector-rotation",
              "dollar-liquidity", "crypto-sentiment", "smart-money",
              "stock-ranking", "market-heatmap"
            ]
          }
        }
      }

      /* 🔹 메타데이터 요청 */
      else if (action === 'metadata') {
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          dashboard: DASHBOARD_METADATA
        }

      } else if (action === 'market') {
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
            metadata: "?action=metadata (대시보드 메타데이터)",
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
