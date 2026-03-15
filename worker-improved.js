export default {
  async fetch(request, env) {
    try {
      const FMP = env.FMP_API_KEY
      const FRED = env.FRED_KEY

      // URL 파라미터 파싱
      const url = new URL(request.url)
      const action = url.searchParams.get('action')
      const symbol = url.searchParams.get('symbol')
      const series = url.searchParams.get('series')

      console.log(`📊 요청: action=${action}, symbol=${symbol}, series=${series}`)

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
          const observations = j.observations || []
          return observations.length > 0 ? parseFloat(observations[observations.length - 1].value) : null
        } catch (e) {
          console.error(`❌ FRED ${series} 실패:`, e.message)
          return null
        }
      }

      /* ================================
      1️⃣ FRED 단일 시리즈
      ================================ */

      if (series) {
        const value = await fredGet(series)
        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            dataType: "fred_single",
            series: series,
            value: value
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
      2️⃣ 모든 FRED 데이터 (⭐ 새로 추가)
      ================================ */

      if (action === 'liquidity') {
        const FRED_SERIES = {
          // Treasury Yields
          DGS10: "10Y Treasury",
          DGS2: "2Y Treasury",
          T10YIE: "10Y Inflation Expectation",

          // Monetary Base & Liquidity
          WALCL: "Fed Balance Sheet",
          RRPONTSYD: "Reverse Repo",
          M2SL: "M2 Money Supply",
          WTREGEN: "Mortgage Debt Held",

          // Employment & Inflation
          UNRATE: "Unemployment Rate",
          PAYEMS: "Nonfarm Payroll",
          CPIAUCSL: "Consumer Price Index",
          PCEPI: "PCE Inflation",

          // Economic Activity
          GDPC1: "Real GDP",
          INDPRO: "Industrial Production",
          UMCSENT: "Consumer Sentiment"
        }

        // 모든 FRED 데이터 병렬 요청
        const fredPromises = Object.entries(FRED_SERIES).map(([code, name]) =>
          fredGet(code).then(value => ({
            code,
            name,
            value
          }))
        )

        const fredData = await Promise.all(fredPromises)

        // 객체로 변환
        const fred = {}
        fredData.forEach(item => {
          fred[item.code] = item.value
        })

        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            dataType: "liquidity",
            count: fredData.length,
            FRED: fred
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
      3️⃣ 마켓 데이터
      ================================ */

      if (action === 'market') {
        const MARKET_SYMBOLS = {
          base: ["SPY", "QQQ", "DIA", "^VIX", "SOXX", "IWM", "BTCUSD", "ETHUSD", "SOLUSD", "GCUSD", "SIUSD", "USDJPY", "EURUSD", "DX"],
          sectors: ["XLK", "XLF", "XLE", "XLV", "XLY", "XLI", "XLU", "XLRE"],
          credit: ["HYG", "LQD"],
          breadth: ["VTI", "TLT"]
        }

        const allSymbols = [
          ...MARKET_SYMBOLS.base,
          ...MARKET_SYMBOLS.sectors,
          ...MARKET_SYMBOLS.credit,
          ...MARKET_SYMBOLS.breadth
        ]

        const quotes = await Promise.all(allSymbols.map(sym => getQuote(sym)))
        const allMarketData = quotes.filter(q => q !== null)

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

        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            dataType: "market",
            count: allMarketData.length,
            US_MARKET: {
              SP500: { price: price("SPY"), change: change("SPY"), changePercent: changePercent("SPY") },
              NASDAQ: { price: price("QQQ"), change: change("QQQ"), changePercent: changePercent("QQQ") },
              DOW: { price: price("DIA"), change: change("DIA"), changePercent: changePercent("DIA") },
              VIX: { price: price("^VIX"), change: change("^VIX"), changePercent: changePercent("^VIX") },
              SOX: { price: price("SOXX"), change: change("SOXX"), changePercent: changePercent("SOXX") },
              RUSSELL2000: { price: price("IWM"), change: change("IWM"), changePercent: changePercent("IWM") }
            }
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
      4️⃣ 개별 주식 분석
      ================================ */

      if (action === 'stock') {
        if (!symbol) {
          return new Response(
            JSON.stringify({
              error: "종목 심볼을 지정하세요",
              usage: "?action=stock&symbol=AAPL"
            }, null, 2),
            {
              headers: { "content-type": "application/json" }
            }
          )
        }

        const quote = await getQuote(symbol.toUpperCase())

        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            dataType: "stock",
            symbol: symbol.toUpperCase(),
            quote: quote || { error: `${symbol} 데이터 없음` }
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
      5️⃣ 기본값: API 사용법
      ================================ */

      return new Response(
        JSON.stringify({
          error: "잘못된 요청",
          usage: {
            fred_single: "?series=DGS10 (개별 요청)",
            fred_all: "?action=liquidity (모든 FRED 데이터 - 15개)",
            market: "?action=market (마켓 데이터)",
            stock: "?action=stock&symbol=AAPL (개별 주식)"
          }
        }, null, 2),
        {
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*"
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
