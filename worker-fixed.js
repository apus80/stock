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
              { id: "kospi", label: "KOSPI", unit: "pt", dataKey: "KOREA_MARKET.KOSPI.price", divisor: 100 },
              { id: "kosdaq", label: "KOSDAQ", unit: "pt", dataKey: "KOREA_MARKET.KOSDAQ.price", divisor: 100 },
              { id: "kospifut", label: "야간선물", unit: "pt", dataKey: "KOREA_MARKET.KOSPI_FUT.price", divisor: 100 },
              { id: "foreignflow", label: "외국인 수급", unit: "억원", dataKey: null },
              { id: "instflow", label: "기관 수급", unit: "억원", dataKey: null },
              { id: "retailflow", label: "개인 수급", unit: "억원", dataKey: null }
            ]
          },
          {
            id: 2,
            title: "2. 미국 시장",
            items: [
              { id: "sp500", label: "S&P500 (SPY)", unit: "$", dataKey: "US_MARKET.SP500.price" },
              { id: "nasdaq", label: "NASDAQ (QQQ)", unit: "$", dataKey: "US_MARKET.NASDAQ.price" },
              { id: "vix", label: "VIX", unit: "", dataKey: "US_MARKET.VIX.price" },
              { id: "sox", label: "SOX (SOXX)", unit: "$", dataKey: "US_MARKET.SOX.price" }
            ]
          },
          {
            id: 3,
            title: "3. 미국 선물",
            items: [
              { id: "spfuture", label: "S&P500 Fut", unit: "", dataKey: null },
              { id: "nasfuture", label: "Nasdaq Fut", unit: "", dataKey: null },
              { id: "rtyfuture", label: "Russell Fut", unit: "$", dataKey: "US_MARKET.RUSSELL2000.price" }
            ]
          },
          {
            id: 4,
            title: "4. Crypto",
            items: [
              { id: "btc", label: "Bitcoin", unit: "$", dataKey: "CRYPTO.BTC.price" },
              { id: "eth", label: "Ethereum", unit: "$", dataKey: "CRYPTO.ETH.price" },
              { id: "sol", label: "Solana", unit: "$", dataKey: "CRYPTO.SOL.price" }
            ]
          },
          {
            id: 5,
            title: "5. Commodities",
            items: [
              { id: "gold", label: "Gold", unit: "$", dataKey: "COMMODITIES.GOLD.price" },
              { id: "silver", label: "Silver", unit: "$", dataKey: "COMMODITIES.SILVER.price" },
              { id: "oil", label: "Oil (WTI)", unit: "$", dataKey: "COMMODITIES.OIL_WTI.price" },
              { id: "dxy", label: "DXY", unit: "", dataKey: "FX.DXY.price" }
            ]
          },
          {
            id: 6,
            title: "6. FX",
            items: [
              { id: "uskrw", label: "USD/KRW", unit: "₩", dataKey: null },
              { id: "usjpy", label: "USD/JPY", unit: "¥", dataKey: "FX.USDJPY.price" },
              { id: "eurusd", label: "EUR/USD", unit: "€", dataKey: "FX.EURUSD.price" }
            ]
          },
          {
            id: 7,
            title: "7. Market Liquidity",
            items: [
              { id: "fedbal", label: "Fed Balance", unit: "T", dataKey: "LIQUIDITY.FED_BALANCE" },
              { id: "repo", label: "Reverse Repo", unit: "B", dataKey: "LIQUIDITY.REVERSE_REPO" },
              { id: "tga", label: "TGA", unit: "T", dataKey: "LIQUIDITY.TGA" },
              { id: "m2", label: "M2", unit: "T", dataKey: "LIQUIDITY.M2" },
              { id: "us10y", label: "10Y Yield", unit: "%", dataKey: "RATES.US10Y" },
              { id: "us2y", label: "2Y Yield", unit: "%", dataKey: "RATES.US2Y" },
              { id: "yieldcurve", label: "Yield Curve", unit: "%", dataKey: "RATES.YIELD_CURVE" }
            ]
          },
          {
            id: 8,
            title: "8. ETF Smart Money",
            items: [
              { id: "spyflow", label: "SPY Vol Flow", unit: "M", dataKey: null },
              { id: "qqqflow", label: "QQQ Vol Flow", unit: "M", dataKey: null },
              { id: "iwmflow", label: "IWM Vol Flow", unit: "M", dataKey: null }
            ]
          },
          {
            id: 9,
            title: "9. Sentiment & Options",
            items: [
              { id: "fear", label: "Fear & Greed", unit: "", dataKey: null },
              { id: "putcall", label: "Put/Call Ratio", unit: "", dataKey: null },
              { id: "gamma", label: "SPY Gamma Wall", unit: "", dataKey: null }
            ]
          },
          {
            id: 10,
            title: "10. Sectors",
            items: [
              { id: "xlk", label: "Technology (XLK)", unit: "$", dataKey: "SECTORS.TECHNOLOGY.price" },
              { id: "xlf", label: "Financials (XLF)", unit: "$", dataKey: "SECTORS.FINANCIALS.price" },
              { id: "xle", label: "Energy (XLE)", unit: "$", dataKey: "SECTORS.ENERGY.price" },
              { id: "xlv", label: "Healthcare (XLV)", unit: "$", dataKey: "SECTORS.HEALTHCARE.price" },
              { id: "xly", label: "Consumer Disc (XLY)", unit: "$", dataKey: "SECTORS.CONSUMER_DISCRETIONARY.price" },
              { id: "xli", label: "Industrials (XLI)", unit: "$", dataKey: "SECTORS.INDUSTRIALS.price" },
              { id: "xlu", label: "Utilities (XLU)", unit: "$", dataKey: "SECTORS.UTILITIES.price" },
              { id: "xlre", label: "Real Estate (XLRE)", unit: "$", dataKey: "SECTORS.REAL_ESTATE.price" }
            ]
          },
          {
            id: 11,
            title: "11. Credit & Breadth",
            items: [
              { id: "hyg", label: "High Yield (HYG)", unit: "$", dataKey: "CREDIT.HIGH_YIELD.price" },
              { id: "lqd", label: "Investment Grade (LQD)", unit: "$", dataKey: "CREDIT.INVESTMENT_GRADE.price" },
              { id: "vti", label: "Total Market (VTI)", unit: "$", dataKey: "BREADTH.TOTAL_MARKET.price" },
              { id: "tlt", label: "Long Treasury (TLT)", unit: "$", dataKey: "BREADTH.LONG_TREASURY.price" }
            ]
          },
          {
            id: 12,
            title: "12. Macro Base",
            items: [
              { id: "cpi", label: "CPI", unit: "idx", dataKey: "MACRO_BASE.CPI" },
              { id: "inflation_exp", label: "Inflation Exp", unit: "%", dataKey: "MACRO_BASE.INFLATION_EXPECTATION" },
              { id: "unemployment", label: "Unemployment", unit: "%", dataKey: "MACRO_BASE.UNEMPLOYMENT" },
              { id: "m2_macro", label: "M2 Money Supply", unit: "T", dataKey: "MACRO_BASE.M2" },
              { id: "real_rates", label: "Real Rates", unit: "%", dataKey: "MACRO_BASE.REAL_RATES" }
            ]
          },
          {
            id: 13,
            title: "13. Macro Indicators",
            items: [
              { id: "sentiment", label: "Consumer Sentiment", unit: "idx", dataKey: "MACRO_INDICATORS.CONSUMER_SENTIMENT" },
              { id: "gdp", label: "Real GDP", unit: "B", dataKey: "MACRO_INDICATORS.REAL_GDP" },
              { id: "indpro", label: "Industrial Production", unit: "idx", dataKey: "MACRO_INDICATORS.INDUSTRIAL_PRODUCTION" },
              { id: "payems", label: "Nonfarm Payrolls", unit: "K", dataKey: "MACRO_INDICATORS.NONFARM_PAYROLLS" },
              { id: "pce_inf", label: "PCE Inflation", unit: "%", dataKey: "MACRO_INDICATORS.PCE_INFLATION" }
            ]
          },
          {
            id: 14,
            title: "14. US Market Extended",
            items: [
              { id: "dow", label: "DOW", unit: "$", dataKey: "US_MARKET.DOW.price" },
              { id: "russell", label: "Russell 2000", unit: "$", dataKey: "US_MARKET.RUSSELL2000.price" }
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
         요청 처리
      ================================ */
      let response

      /* 🔹 메타데이터 요청 */
      if (action === 'metadata') {
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
