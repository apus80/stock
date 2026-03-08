export default {

  async fetch(request, env, ctx) {

    const FMP = env.FMP_API_KEY
    const FRED = env.FRED_KEY

    const cache = caches.default
    const cacheKey = new Request(request.url)

    const cached = await cache.match(cacheKey)
    if (cached) return cached


    async function quote(symbol) {

      try {

        const r = await fetch(
          `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP}`
        )

        // ✅ 응답 상태 확인
        if (!r.ok) {
          console.error(`[FMP] ${symbol} HTTP Error: ${r.status}`)
          return null
        }

        const j = await r.json()

        // ✅ 응답 구조 확인
        if (!j || !Array.isArray(j) || j.length === 0) {
          console.error(`[FMP] ${symbol} No data returned:`, j)
          return null
        }

        const price = j[0]?.price
        if (price === null || price === undefined) {
          console.error(`[FMP] ${symbol} No price in response:`, j[0])
          return null
        }

        return price

      } catch (e) {
        console.error(`[FMP] ${symbol} Fetch Error:`, e.message)
        return null
      }

    }


    /* ================= MARKET ================= */

    const [
      sp500,
      nasdaq,
      dow,
      vix,
      sox,
      spy,
      qqq,
      iwm,
      gold,
      silver,
      oil,
      usdjpy,
      eurusd,
      dxy
    ] = await Promise.all([

      quote("GSPC"),        // ^GSPC → GSPC (FMP 호환 심볼)
      quote("IXIC"),        // ^IXIC → IXIC
      quote("DJI"),         // ^DJI → DJI
      quote("VIX"),         // ^VIX → VIX
      quote("SOXX"),
      quote("SPY"),
      quote("QQQ"),
      quote("IWM"),
      quote("XAUUSD"),      // 금
      quote("XAGUSD"),      // 은
      quote("CLUSD"),       // 원유 (WTI)
      quote("USDJPY"),
      quote("EURUSD"),
      quote("DX-Y.NYB")     // 달러 지수

    ])


    /* ================= FRED ================= */

    async function fred(series) {

      try {

        const r = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED}&file_type=json`
        )

        if (!r.ok) {
          console.error(`[FRED] ${series} HTTP Error: ${r.status}`)
          return 0
        }

        const j = await r.json()

        if (!j?.observations || j.observations.length === 0) {
          console.error(`[FRED] ${series} No data returned`)
          return 0
        }

        return parseFloat(j.observations.slice(-1)[0]?.value ?? 0)

      } catch (e) {
        console.error(`[FRED] ${series} Fetch Error:`, e.message)
        return 0
      }

    }


    const [
      cpi,
      unemployment,
      m2,
      fedBalance,
      rrp,
      tga,
      us10y,
      us2y
    ] = await Promise.all([

      fred("CPIAUCSL"),
      fred("UNRATE"),
      fred("M2SL"),
      fred("WALCL"),
      fred("RRPONTSYD"),
      fred("WTREGEN"),
      fred("DGS10"),
      fred("DGS2")

    ])


    /* ================= CALCULATIONS ================= */

    const goldSilverRatio =
      (gold && silver)
        ? gold / silver
        : null


    const realRates =
      (us10y && cpi)
        ? us10y - cpi
        : null


    const yieldCurve =
      (us10y && us2y)
        ? us10y - us2y
        : null


    const realLiquidity =
      fedBalance - rrp - tga


    const liquidityTrend =
      realLiquidity / 1000000


    /* ================= RESULT ================= */

    const result = {

      timestamp: new Date().toISOString(),

      US_MARKET: {
        SP500: sp500,
        NASDAQ: nasdaq,
        DOW: dow,
        VIX: vix,
        SOX: sox
      },

      US_FUTURES: {
        ES: spy,
        NQ: qqq,
        RTY: iwm
      },

      COMMODITIES: {
        Gold: gold,
        Silver: silver,
        Oil: oil,
        GoldSilverRatio: goldSilverRatio
      },

      FX: {
        USDJPY: usdjpy,
        EURUSD: eurusd,
        DXY: dxy
      },

      MACRO: {
        CPI: cpi,
        Unemployment: unemployment,
        M2: m2,
        RealRates: realRates
      },

      RATES: {
        US10Y: us10y,
        US2Y: us2y,
        YieldCurve: yieldCurve
      },

      LIQUIDITY: {
        FedBalance: fedBalance,
        ReverseRepo: rrp,
        TGA: tga,
        RealLiquidity: realLiquidity,
        LiquidityTrend: liquidityTrend
      }

    }


    const response = new Response(
      JSON.stringify(result, null, 2),
      {
        headers: {
          "content-type": "application/json",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*"
        }
      }
    )

    ctx.waitUntil(
      cache.put(cacheKey, response.clone())
    )

    return response

  }

}
