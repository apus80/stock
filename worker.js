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
      async function getQuote(sym, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          // 📍 출처: FMP API (financialmodelingprep.com)
          // /stable/quote: 무료 플랜에서 동작 확인 (batch-quote는 유료 전용)
          const url = `https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${FMP}`
          console.log(`📍 FMP API 호출: ${sym}`)
          console.log(`   🔗 URL: ${url.substring(0, url.lastIndexOf('?'))}`)
          console.log(`   🔑 API Key: ${FMP ? 'SET' : 'NOT SET'}`)

          const r = await fetch(url, { signal: controller.signal })
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
        } finally {
          clearTimeout(timeout)
        }
      }

      async function getKoreanQuote(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        // 📍 출처: FMP API (financialmodelingprep.com) - /stable/quote (무료 플랜 동작)
        try {
          const fmpSymbol = symbol === 'KS11' ? '^KS11' : symbol === 'KQ11' ? '^KQ11' : symbol
          const url = `https://financialmodelingprep.com/stable/quote?symbol=${fmpSymbol}&apikey=${FMP}`
          console.log(`📍 FMP API 호출 (한국): ${fmpSymbol}`)
          console.log(`   🔗 URL: ${url.substring(0, url.lastIndexOf('?'))}`)

          const r = await fetch(url, { signal: controller.signal })
          console.log(`   📊 Status: ${r.status} ${r.statusText}`)

          if (!r.ok) {
            console.error(`❌ FMP 한국 ${fmpSymbol}: HTTP ${r.status} ${r.statusText}`)
            return null
          }

          const j = await r.json()

          if (!j || (Array.isArray(j) && j.length === 0)) {
            console.warn(`⚠️ ${fmpSymbol}: 응답값 없음`)
            return null
          }

          const quote = Array.isArray(j) ? j[0] : j
          if (!quote || !quote.price) {
            console.warn(`⚠️ ${fmpSymbol}: price 필드 없음`)
            return null
          }

          const result = {
            price: quote.price,
            changePercentage: quote.changesPercentage || quote.changePercentage,
            change: quote.change,
            volume: quote.volume
          }
          console.log(`✅ FMP 한국 ${fmpSymbol}: price=${result.price}, change=${result.changePercentage}%`)
          return result
        } catch (e) {
          console.error(`❌ FMP 한국 ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }


      async function fredGet(series, units = null, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          // 📍 출처: FRED API (Federal Reserve)
          // units='pc1' → 전년동기대비 YoY% 직접 반환 (계산 불필요)
          const unitsParam = units ? `&units=${units}` : ''
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED}&file_type=json${unitsParam}`
          const r = await fetch(url, { signal: controller.signal })
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
        } finally {
          clearTimeout(timeout)
        }
      }

      // 📍 출처: Yahoo Finance (DX-Y.NYB = ICE Dollar Index)
      async function yahooFinanceDXY(timeoutMs = 12000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = 'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=1d'
          const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
          if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`)
          const j = await r.json()
          const meta = j?.chart?.result?.[0]?.meta
          if (!meta || meta.regularMarketPrice === undefined) throw new Error('no price in response')
          console.log(`✅ Yahoo DXY: price=${meta.regularMarketPrice}, change%=${meta.regularMarketChangePercent}`)
          return {
            price: parseFloat(meta.regularMarketPrice.toFixed(2)),
            changePercentage: meta.regularMarketChangePercent !== undefined
              ? parseFloat(meta.regularMarketChangePercent.toFixed(2))
              : null
          }
        } catch (e) {
          console.error('❌ Yahoo DXY:', e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 📍 출처: Yahoo Finance (Market Structure Indicators)
      async function getYahooMarketStructure(timeoutMs = 12000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const symbols = ["^VVIX", "^MOVE", "^NYA"]
          const results = {}

          for (const symbol of symbols) {
            try {
              const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
              const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
              if (!r.ok) continue

              const j = await r.json()
              const meta = j?.chart?.result?.[0]?.meta
              if (meta && meta.regularMarketPrice !== undefined) {
                results[symbol] = {
                  price: parseFloat(meta.regularMarketPrice.toFixed(2)),
                  changePercentage: meta.regularMarketChangePercent !== undefined
                    ? parseFloat(meta.regularMarketChangePercent.toFixed(2))
                    : null
                }
                console.log(`✅ Yahoo ${symbol}: price=${results[symbol].price}, change=${results[symbol].changePercentage}%`)
              }
            } catch (e) {
              console.error(`❌ Yahoo ${symbol}:`, e.message)
            }
          }

          return Object.keys(results).length > 0 ? results : null
        } catch (e) {
          console.error('❌ Yahoo Market Structure:', e.message)
          return null
        } finally {
          clearTimeout(timeout)
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
        "RRPONTSYD": { divisor: 1, unit: "B" },  // FRED 원값이 Billions 단위
        "WTREGEN": { divisor: 1000000, unit: "T" },
        "DGS10": { divisor: 1, unit: "%" },
        "DGS2": { divisor: 1, unit: "%" },
        "DCOILWTICO": { divisor: 1, unit: "$" },
        "PCEPI": { divisor: 1, unit: "idx" },  // PCE Inflation Index
        "VIXCLS": { divisor: 1, unit: "idx" },  // VIX from FRED
        "BAMLH0A0HYM2": { divisor: 1, unit: "%" }  // High Yield OAS Spread
      }

      // 📍 Alpha Discovery Engine - 9개 인디케이터 기반 점수 계산
      // 출처: verify-9-indicators.js 검증 로직 (로컬 테스트 통과)

      async function fetchFMP(endpoint, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com${endpoint}&apikey=${FMP}`
          console.log(`📍 FMP API 호출: ${endpoint}`)
          const r = await fetch(url, { signal: controller.signal })
          console.log(`   📊 Status: ${r.status}`)

          if (!r.ok) {
            console.error(`❌ FMP ${endpoint}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()

          // 🔍 DEBUG: 각 API별 응답 확인
          if (endpoint.includes('quote')) {
            console.log(`   📦 quote 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
            if (Array.isArray(data) && data[0]) {
              const quote = data[0]
              console.log(`   📋 quote 필드: ${Object.keys(quote).slice(0, 30).join(', ')}`)
              console.log(`   💰 주요값: price=${quote.price}, pe=${quote.pe}, pb=${quote.priceToBook}, epsTrailingTwelveMonths=${quote.epsTrailingTwelveMonths}`)
              console.log(`   📊 전체: ${JSON.stringify(quote).substring(0, 200)}`)
            }
          } else if (endpoint.includes('key-metrics')) {
            console.log(`   📦 key-metrics 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
            if (Array.isArray(data) && data[0]) {
              const fields = Object.keys(data[0]).filter(k => k.includes('Ratio') || k.includes('Growth') || k.includes('Cap') || k.includes('Shares'))
              console.log(`   📋 필드: peRatio=${data[0].peRatio}, priceToBookRatio=${data[0].priceToBookRatio}, floatShares=${data[0].floatShares}`)
              console.log(`   📈 성장률: revenueGrowth=${data[0].revenueGrowth}, earningsGrowth=${data[0].earningsGrowth}`)
            }
          } else if (endpoint.includes('historical')) {
            console.log(`   📦 historical 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'} - 최근 3개: ${data.substring ? data : JSON.stringify(data).substring(0, 100)}`)
          } else if (endpoint.includes('insider')) {
            console.log(`   📦 insider 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
          }

          return data
        } catch (e) {
          console.error(`❌ fetchFMP ${endpoint}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      async function getAlphaData(symbol) {
        try {
          console.log(`📍 Alpha 데이터 수집 시작: ${symbol}`)
          // Promise.allSettled로 부분 실패 허용
          const results = await Promise.allSettled([
            fetchFMP(`/stable/quote?symbol=${symbol}`),
            fetchFMP(`/stable/historical-price-eod/full?symbol=${symbol}&limit=200`),
            fetchFMP(`/stable/key-metrics?symbol=${symbol}`),
            // 주의: /stable/analyst-stock-recommendations는 FMP 무료 플랜에서 404 반환
            // analyst 데이터 대신 insiderActivity로 신뢰도 판단
            fetchFMP(`/stable/insider-trading/search?symbol=${symbol}`)
          ])

          const extract = (r) => r.status === 'fulfilled' ? r.value : null
          const [quote, history, metrics, insider] = results.map(extract)

          return {
            quote: quote ? (Array.isArray(quote) ? quote[0] : quote) : null,
            history: history || [],
            metrics: metrics ? (Array.isArray(metrics) ? metrics[0] : metrics) : null,
            analyst: [], // FMP 무료 플랜에서 지원 안 함
            insider: insider || []
          }
        } catch (e) {
          console.error(`❌ getAlphaData ${symbol}:`, e.message)
          return null
        }
      }

      function calculateFactors(data) {
        if (!data || !data.quote) return null

        const quote = data.quote
        const metrics = data.metrics
        const history = data.history || []

        // 🔍 DEBUG: metrics 전체 구조 확인
        if (metrics) {
          console.log(`📊 metrics 객체 키: ${Object.keys(metrics).slice(0, 20).join(', ')}`)
          console.log(`📊 metrics 전체: ${JSON.stringify(metrics).substring(0, 300)}`)
        }

        // 기본 정보
        const price = quote.price || 0
        const pe = metrics?.peRatio || metrics?.pe || 50
        const pb = metrics?.priceToBookRatio || metrics?.pb || 10
        const float = metrics?.floatShares || metrics?.shares || 1000000000
        const marketCap = metrics?.marketCap || metrics?.market_cap || 0

        // 성장률 지표 (FMP key-metrics에서 직접 가져옴)
        let revenueGrowth = 0
        let earningsGrowth = 0

        if (metrics) {
          // FMP 필드명 다양성 대응
          revenueGrowth =
            metrics.revenueGrowth ||
            metrics.revenue_growth ||
            metrics.revenuePerShareGrowth ||
            metrics.netIncomeGrowth || 0

          earningsGrowth =
            metrics.earningsGrowth ||
            metrics.earnings_growth ||
            metrics.epsGrowth ||
            metrics.earnings_per_share_growth ||
            metrics.earningsPerShareGrowth || 0

          console.log(`📊 성장률 필드 상세: revenueGrowth=${revenueGrowth}, earningsGrowth=${earningsGrowth}`)
        }

        // 성장률이 없으면 가격 데이터로 근사 계산
        if (revenueGrowth === 0 && history.length >= 50) {
          const current = history[0]?.close
          const past50 = history[49]?.close
          if (current && past50) {
            const priceGrowth = (current - past50) / past50
            revenueGrowth = priceGrowth * 0.7
          }
        }

        if (earningsGrowth === 0 && history.length >= 50) {
          const current = history[0]?.close
          const past50 = history[49]?.close
          if (current && past50) {
            const priceGrowth = (current - past50) / past50
            earningsGrowth = priceGrowth * 1.1
          }
        }

        // 전문가 평가
        const analystRecs = data.analyst || []
        const buyCount = analystRecs.filter(a => a.ratingScore > 3).length
        const analystScore = buyCount / Math.max(analystRecs.length, 1)

        // 인사이더 거래
        const insiderActivity = data.insider?.length || 0

        return { price, pe, pb, float, marketCap, revenueGrowth, earningsGrowth, analystScore, insiderActivity }
      }

      // Momentum Score (50일)
      function momentumScore(history) {
        if (!history || history.length < 50) return 0
        const recent = history[0]?.close
        const past = history[49]?.close
        if (!recent || !past) return 0
        return (recent - past) / past
      }

      // Volume Spike Detection
      function volumeSpike(history) {
        if (!history || history.length < 20) return 0
        const today = history[0]?.volume
        let avg = 0
        for (let i = 1; i < 20; i++) {
          avg += history[i]?.volume || 0
        }
        avg /= 19
        if (avg === 0) return 0
        return today / avg
      }

      // Explosive Score (9개 지표 가중합)
      function explosiveScore(factors, momentum, volume) {
        if (!factors) return 0

        // 성장률 정규화 (0~1 범위)
        const normalizeGrowth = (g) => Math.max(0, Math.min(1, (g + 0.5) / 1.0))
        const revenueScore = normalizeGrowth(factors.revenueGrowth || 0)
        const earningsScore = normalizeGrowth(factors.earningsGrowth || 0)

        const score =
          (1 / (factors.pe + 1)) * 1.5 +        // Value: PE 저평가 (1.5x)
          (1 / (factors.pb + 1)) * 1.5 +        // Value: PB 저평가 (1.5x)
          revenueScore * 1.2 +                  // Growth: 수익 성장률 (1.2x)
          earningsScore * 1.2 +                 // Growth: 수익성 성장률 (1.2x)
          factors.analystScore * 0.8 +          // Quality: 전문가 평가 (0.8x)
          (factors.insiderActivity > 0 ? 1 : 0) * 0.4 +  // Quality: 내부자 거래 (0.4x)
          (1 / (factors.float / 100000000 + 1)) * 0.8 +  // Technical: 유동성 (0.8x)
          momentum * 2.5 +                      // Technical: 모멘텀 (2.5x)
          volume * 2.0                          // Technical: 거래량 (2.0x)

        return Math.max(0, score)
      }

      // 9개 인디케이터 기반 Explosive Score 계산 (가중합)
      async function getAlphaScore(symbol) {
        try {
          console.log(`🔍 Alpha Score 계산 시작: ${symbol}`)

          const data = await getAlphaData(symbol)
          if (!data) {
            console.warn(`⚠️ ${symbol}: 데이터 수집 실패`)
            return null
          }

          const factors = calculateFactors(data)
          if (!factors) {
            console.warn(`⚠️ ${symbol}: 지표 계산 실패`)
            return null
          }

          // Momentum & Volume 계산
          const momentum = momentumScore(data.history)
          const volume = volumeSpike(data.history)

          // Explosive Score (9개 지표 가중합)
          const score = explosiveScore(factors, momentum, volume)

          console.log(`✅ Alpha Score 계산 완료: ${symbol} = ${score.toFixed(4)}`)

          return {
            symbol,
            explosiveScore: parseFloat(score.toFixed(4)),
            factors: {
              price: factors.price,
              pe: factors.pe,
              pb: factors.pb,
              floatShares: factors.float,
              marketCap: factors.marketCap,
              revenueGrowth: factors.revenueGrowth,
              earningsGrowth: factors.earningsGrowth,
              analystScore: factors.analystScore,
              insiderActivity: factors.insiderActivity
            },
            metrics: {
              momentum: parseFloat(momentum.toFixed(4)),
              volume: parseFloat(volume.toFixed(2))
            },
            profile: {
              company: data.quote?.symbol || symbol,
              sector: data.metrics?.sector || null,
              industry: data.metrics?.industry || null
            }
          }
        } catch (e) {
          console.error(`❌ Alpha Score Error:`, e.message)
          return null
        }
      }

      // ========================================
      // 개별 종목 재무 데이터 함수들
      // 출처: FMP API (financialmodelingprep.com)
      // ========================================

      // 2. Earnings (실적 데이터)
      async function getEarnings(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/earnings?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Earnings 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Earnings ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Earnings 응답값 없음`)
            return null
          }

          // ✅ epsActual이 있는 가장 최신 실적 찾기
          let earnings = null
          if (Array.isArray(data)) {
            earnings = data.find(e => e.epsActual) || data[0]
          } else {
            earnings = data
          }

          return {
            symbol: symbol,
            epsActual: earnings?.epsActual || null,
            epsEstimated: earnings?.epsEstimated || null,
            revenueActual: earnings?.revenueActual || null,
            revenueEstimated: earnings?.revenueEstimated || null,
            reportDate: earnings?.date || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getEarnings ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 11. Financial Growth (성장률)
      async function getFinancialGrowth(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/financial-growth?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Financial Growth 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Financial Growth ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Financial Growth 응답값 없음`)
            return null
          }

          const growth = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            revenueGrowth: growth.revenueGrowth || null,
            netIncomeGrowth: growth.netIncomeGrowth || null,
            epsGrowth: growth.epsGrowth || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getFinancialGrowth ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 12. Income Statement (수입 명세서)
      async function getIncomeStatement(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/income-statement?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Income Statement 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Income Statement ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Income Statement 응답값 없음`)
            return null
          }

          const income = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            revenue: income.revenue || null,
            grossProfit: income.grossProfit || null,
            operatingIncome: income.operatingIncome || null,
            netIncome: income.netIncome || null,
            eps: income.eps || null,
            ebitda: income.ebitda || null,
            researchAndDevelopmentExpenses: income.researchAndDevelopmentExpenses || null,
            sellingGeneralAndAdministrativeExpenses: income.sellingGeneralAndAdministrativeExpenses || null,
            incomeBeforeTax: income.incomeBeforeTax || null,
            weightedAverageShsOut: income.weightedAverageShsOut || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getIncomeStatement ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 13. Balance Sheet (재무 상태표)
      async function getBalanceSheet(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Balance Sheet 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Balance Sheet ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Balance Sheet 응답값 없음`)
            return null
          }

          const balance = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            cashAndCashEquivalents: balance.cashAndCashEquivalents || null,
            totalAssets: balance.totalAssets || null,
            totalCurrentAssets: balance.totalCurrentAssets || null,
            totalLiabilities: balance.totalLiabilities || null,
            totalCurrentLiabilities: balance.totalCurrentLiabilities || null,
            totalStockholdersEquity: balance.totalStockholdersEquity || null,
            longTermDebt: balance.longTermDebt || null,
            shortTermDebt: balance.shortTermDebt || null,
            inventory: balance.inventory || null,
            accountsPayable: balance.accountPayables || null,
            netDebt: balance.netDebt || null,
            totalDebt: balance.totalDebt || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getBalanceSheet ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 14. Cash Flow (현금 흐름표)
      async function getCashFlow(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/cash-flow-statement?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Cash Flow 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Cash Flow ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Cash Flow 응답값 없음`)
            return null
          }

          const cashflow = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            operatingCashFlow: cashflow.operatingCashFlow || null,
            freeCashFlow: cashflow.freeCashFlow || null,
            capitalExpenditure: cashflow.capitalExpenditure || null,
            netCashProvidedByOperatingActivities: cashflow.netCashProvidedByOperatingActivities || null,
            netCashProvidedByInvestingActivities: cashflow.netCashProvidedByInvestingActivities || null,
            netCashProvidedByFinancingActivities: cashflow.netCashProvidedByFinancingActivities || null,
            netDividendsPaid: cashflow.netDividendsPaid || null,
            commonStockRepurchased: cashflow.commonStockRepurchased || null,
            stockBasedCompensation: cashflow.stockBasedCompensation || null,
            netChangeInCash: cashflow.netChangeInCash || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getCashFlow ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 16. Ratios (PE, PB)
      async function getRatios(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Ratios 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Ratios ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Ratios 응답값 없음`)
            return null
          }

          const ratios = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            priceToEarningsRatio: ratios.priceToEarningsRatio || null,
            priceToBookRatio: ratios.priceToBookRatio || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getRatios ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 21. Company Profile (Sector, Industry)
      async function getCompanyProfile(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Company Profile 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Company Profile ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Company Profile 응답값 없음`)
            return null
          }

          const profile = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            sector: profile.sector || null,
            industry: profile.industry || null,
            companyName: profile.companyName || null,
            website: profile.website || null,
            description: profile.description || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getCompanyProfile ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // 22. Shares Float (유통주식)
      async function getSharesFloat(symbol, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/shares-float?symbol=${symbol}&apikey=${FMP}`
          console.log(`📍 FMP Shares Float 호출: ${symbol}`)

          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) {
            console.error(`❌ FMP Shares Float ${symbol}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn(`⚠️ ${symbol}: Shares Float 응답값 없음`)
            return null
          }

          const shares = Array.isArray(data) ? data[0] : data
          return {
            symbol: symbol,
            floatShares: shares.floatShares || null,
            timestamp: new Date().toISOString()
          }
        } catch (e) {
          console.error(`❌ getSharesFloat ${symbol}:`, e.message)
          return null
        } finally {
          clearTimeout(timeout)
        }
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

        // Promise.allSettled()를 사용해서 한 개 실패해도 다른 데이터는 정상 반환
        const results = await Promise.allSettled([
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
          // 한국 시장 (FMP API)
          getQuote("EWY"),  // iShares MSCI South Korea ETF
          // 암호화폐 (FMP API)
          getQuote("BTCUSD"), // Bitcoin
          getQuote("ETHUSD"), // Ethereum
          getQuote("SOLUSD"), // Solana
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
          fredGet("PCEPILFE"),
          fredGet("WTREGEN"),  // TGA (재무부 일반 계정)
          fredGet("M2SL"),     // M2 통화량 (billions)
          fredGet("T10YIE"),   // 10년 기대인플레이션 (%)
          fredGet("FEDFUNDS"), // Fed 기준금리 (효과적 연방기금금리, %)
          fredGet("CPILFESL", "pc1"), // Core CPI YoY% (출처: FRED CPILFESL, units=pc1 직접 공시값)
          fredGet("CPIAUCSL", "pc1"),  // CPI YoY% (출처: FRED CPIAUCSL, units=pc1 직접 공시값)
          // 신규 FRED 경제지표 (3개)
          fredGet("PCEPI"),    // PCE Inflation Index
          fredGet("VIXCLS"),   // VIX from FRED
          fredGet("BAMLH0A0HYM2"), // High Yield OAS Spread
          // 상품 (Commodities) - FMP stable batch-quote
          getQuote("GCUSD"),   // 금 (Gold)
          getQuote("SIUSD"),   // 은 (Silver)
          getQuote("BZUSD"),   // 브렌트유 (Brent Crude) - CLUSD/USOIL null 반환, BZUSD 사용
          // 외환 (FX) - FMP stable batch-quote
          getQuote("USDKRW"),  // USD/KRW (원/달러 환율)
          getQuote("USDJPY"),  // USD/JPY
          getQuote("EURUSD"),  // EUR/USD
          yahooFinanceDXY(),   // 달러 인덱스 DXY (Yahoo Finance DX-Y.NYB)
          getYahooMarketStructure() // 시장 구조 (VVIX, MOVE, NYA)
        ])

        // allSettled 결과에서 fulfilled된 것만 추출
        const extract = (result) => result.status === 'fulfilled' ? result.value : null
        const [spy, qqq, dia, soxx, iwm, vix, hyg, lqd, vti, tlt, xlk, xlf, xle, xlv, xly, xli, xlu, xlre, ewy, btc, eth, sol, fed, rp, dgs10, dgs2, cpi, unrate, umcsent, gdpc1, indpro, payems, pcepilfe, tga, m2sl, t10yie, fedfunds, coreCpiYoyData, cpiYoyData, pcepi, vixcls, hyOas, goldQ, silverQ, oilQ, usdKrwQ, usdJpyQ, eurUsdQ, dxyQ, yahooMarketStructure] = results.map(extract)

        // 데이터 로깅
        console.log(`\n📊 ===== API 호출 결과 요약 =====`)
        console.log(`📈 미국 주식:`)
        console.log(`   SPY: ${spy?.price || '⚠️ 실패'} (change: ${spy?.changePercentage || '⚠️'}%)`)
        console.log(`   QQQ: ${qqq?.price || '⚠️ 실패'} (change: ${qqq?.changePercentage || '⚠️'}%)`)
        console.log(`   DIA: ${dia?.price || '⚠️ 실패'} (change: ${dia?.changePercentage || '⚠️'}%)`)
        console.log(`📊 섹터:`)
        console.log(`   XLK: ${xlk?.price || '⚠️ 실패'}, XLF: ${xlf?.price || '⚠️'}, XLE: ${xle?.price || '⚠️'}, XLV: ${xlv?.price || '⚠️'}`)
        console.log(`   XLY: ${xly?.price || '⚠️ 실패'}, XLI: ${xli?.price || '⚠️'}, XLU: ${xlu?.price || '⚠️'}, XLRE: ${xlre?.price || '⚠️'}`)
        console.log(`💰 채권 & 광범위:`)
        console.log(`   HYG: ${hyg?.price || '⚠️ 실패'}, LQD: ${lqd?.price || '⚠️'}, VTI: ${vti?.price || '⚠️'}, TLT: ${tlt?.price || '⚠️'}`)
        console.log(`🇰🇷 한국 시장 (FMP):`)
        console.log(`   EWY: ${ewy?.price || '⚠️ 실패'} (change: ${ewy?.changePercentage || '⚠️'}%)`)
        console.log(`🪙 암호화폐 (Binance):`)
        console.log(`   BTC: ${btc?.price || '⚠️ 실패'}, ETH: ${eth?.price || '⚠️'}, SOL: ${sol?.price || '⚠️'}`)
        console.log(`📊 FRED 경제지표:`)
        console.log(`   WALCL: ${fed?.length > 0 ? '✅' : '⚠️ 실패'}, UNRATE: ${unrate?.length > 0 ? '✅' : '⚠️'}, CPI: ${cpi?.length > 0 ? '✅' : '⚠️'}`)
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

        // 신규: 추가 경제지표
        const inflExpVal = convertFredValue("T10YIE", getLatestValue(t10yie))

        // CPI YoY: FRED units=pc1로 직접 공시값 사용 (계산 없음)
        const cpiYoY = getLatestValue(cpiYoyData)         // 출처: FRED CPIAUCSL units=pc1 (%)
        const coreCpiYoY = getLatestValue(coreCpiYoyData) // 출처: FRED CPILFESL units=pc1 (%)
        const fedRateVal = getLatestValue(fedfunds)        // 출처: FRED FEDFUNDS (%)
        const m2RawVal = getLatestValue(m2sl)     // M2SL raw (billions) - index.html이 /1,000,000으로 T 변환하므로 *1000해서 millions로 저장
        const fedRawVal = getLatestValue(fed)     // WALCL raw (millions) - index.html이 /1,000,000으로 T 변환
        const rpRawVal = getLatestValue(rp)       // RRPONTSYD raw (Billions) - FRED 원값이 이미 Billions 단위
        const tgaRawVal = getLatestValue(tga)     // WTREGEN raw (millions) - index.html이 /1,000,000으로 T 변환

        // 신규 FRED 인디케이터 (3개)
        const pcepiVal = convertFredValue("PCEPI", getLatestValue(pcepi))     // PCE Inflation Index
        const vixclsVal = convertFredValue("VIXCLS", getLatestValue(vixcls))  // VIX from FRED
        const hyOasVal = convertFredValue("BAMLH0A0HYM2", getLatestValue(hyOas)) // High Yield OAS Spread

        // EWY 가격 처리
        const ewyPrice = ewy?.price
        const ewyChange = ewy?.changePercentage

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
          ewy: ewyPrice,
          ewyChange: ewyChange,
          hyg: hyg?.price,
          lqd: lqd?.price,
          hygChange: hyg?.changePercentage,
          lqdChange: lqd?.changePercentage,
          vti: vti?.price,
          tlt: tlt?.price,
          vtiChange: vti?.changePercentage,
          tltChange: tlt?.changePercentage,
          // 암호화폐
          btc: btc?.price,
          btcChange: btc?.changePercentage,
          eth: eth?.price,
          ethChange: eth?.changePercentage,
          sol: sol?.price,
          solChange: sol?.changePercentage,
          fed: fedVal,
          rp: rpVal,
          us10y: us10y,
          us2y: us2y,
          yieldCurve: us10y && us2y ? (us10y - us2y) : null,
          // Raw FRED 값 (index.html에서 직접 단위 변환용)
          fedRaw: fedRawVal,
          rpRaw: rpRawVal,
          tgaRaw: tgaRawVal,
          // 원자재 (Commodities)
          gold: goldQ?.price,
          goldChange: goldQ?.changePercentage,
          silver: silverQ?.price,
          silverChange: silverQ?.changePercentage,
          oil: oilQ?.price,
          oilChange: oilQ?.changePercentage,
          // 외환 (FX)
          usdkrw: usdKrwQ?.price,
          usdkrwChange: usdKrwQ?.changePercentage,
          usdjpy: usdJpyQ?.price,
          usdjpyChange: usdJpyQ?.changePercentage,
          eurusd: eurUsdQ?.price,
          eurusdChange: eurUsdQ?.changePercentage,
          dxyPrice: dxyQ?.price,
          dxyChange: dxyQ?.changePercentage,
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
            CPI: cpiVal,                       // CPIAUCSL 지수 레벨 (하위호환 유지)
            CPI_YOY: cpiYoY,                  // 출처: FRED CPIAUCSL 전년동기대비 YoY %
            CORE_CPI_YOY: coreCpiYoY,         // 출처: FRED CPILFESL (식료품·에너지 제외) YoY %
            PCE_INFLATION: pcepiVal,           // 출처: FRED PCEPI (Personal Consumption Expenditures)
            FED_RATE: fedRateVal,              // 출처: FRED FEDFUNDS (효과적 연방기금금리 %)
            INFLATION_EXPECTATION: inflExpVal, // 출처: FRED T10YIE (10년 기대인플레이션)
            UNEMPLOYMENT: unrateVal,
            M2: m2RawVal ? m2RawVal * 1000 : null, // M2SL billions → millions (index.html이 /1,000,000으로 T 변환)
            REAL_RATES: us10y && inflExpVal ? parseFloat((us10y - inflExpVal).toFixed(2)) : null // 실질금리 = 10Y - 기대인플레이션
          },
          // 카드 15: Market Risk (신규)
          MARKET_RISK: {
            VIX_FRED: vixclsVal,               // 출처: FRED VIXCLS (VIX from FRED)
            HY_OAS_SPREAD: hyOasVal            // 출처: FRED BAMLH0A0HYM2 (High Yield OAS Spread)
          },
          // 카드 13: Macro Indicators
          MACRO_INDICATORS: {
            CONSUMER_SENTIMENT: umsentVal,
            REAL_GDP: gdpVal,
            INDUSTRIAL_PRODUCTION: indproVal,
            NONFARM_PAYROLLS: payelmsVal,
            PCE_INFLATION: pcepilfeVal
          },
          // 카드 16: Yahoo Market Structure (신규)
          YAHOO_MARKET_STRUCTURE: yahooMarketStructure ? {
            VVIX: yahooMarketStructure["^VVIX"] || null,        // Volatility of Volatility
            MOVE: yahooMarketStructure["^MOVE"] || null,        // Bond Market Volatility
            NYA: yahooMarketStructure["^NYA"] || null           // NYSE Composite
          } : null
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
          components: [
            { name: '유동성', value: liquidityScore, unit: 'pt' },
            { name: '변동성', value: volatilityScore, unit: 'pt' },
            { name: '신용', value: creditScore, unit: 'pt' },
            { name: '시장너비', value: breadthScore, unit: 'pt' },
            { name: '매크로', value: macroScore, unit: 'pt' }
          ],
          interpretation: totalScore >= 75 ? "기관 투자자 적극 매수 신호" : totalScore >= 60 ? "견조한 시장 환경" : totalScore >= 40 ? "중립 관망 구간" : "리스크 관리 필요",
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
          badgeClass: regime === "Risk-On" ? "bullish" : regime === "Risk-Off" ? "bearish" : "neutral",
          factors: [
            { name: '추세 점수', status: trendScore >= 65 ? '강세' : '약세', strength: trendScore },
            { name: '리스크 점수', status: riskScore >= 70 ? '낮음' : '높음', strength: riskScore },
            { name: 'SPY 방향', status: (data.spyChange || 0) >= 0 ? '상승' : '하락', strength: Math.round(Math.abs(data.spyChange || 0) * 10) }
          ],
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
          components: [
            { name: 'Fed 잔액', value: data.fed !== null && data.fed !== undefined ? data.fed : '-', unit: 'T$' },
            { name: '역레포(RRP)', value: data.rp !== null && data.rp !== undefined ? data.rp : '-', unit: 'B$' }
          ],
          interpretation: liquidityScore > 75 ? "유동성 풍부 → 위험자산 선호" : liquidityScore > 50 ? "적정 수준 유지 중" : "유동성 부족 → 안전자산 선호",
          details: {
            fed_balance: data.fed,
            reverse_repo: data.rp
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
          metrics: [
            { name: '10년물', value: data.us10y !== null ? data.us10y : null, trend: null, unit: '%' },
            { name: '2년물', value: data.us2y !== null ? data.us2y : null, trend: null, unit: '%' },
            { name: '스프레드(10Y-2Y)', value: spread !== null ? parseFloat(spread.toFixed(3)) : null, trend: null, unit: '%' },
            { name: '경기침체 확률', value: isInverted ? 75 : 20, trend: null, unit: '%' }
          ],
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
          metrics: [
            { name: 'CPI 지수', value: cpiVal !== null ? parseFloat(cpiVal.toFixed(2)) : null, trend: null, unit: '' },
            { name: '10Y 기대인플레', value: inflationExpectation !== null ? parseFloat(inflationExpectation.toFixed(2)) : null, trend: null, unit: '%' }
          ],
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
          metrics: [
            { name: 'HYG (하이일드)', value: data.hyg ? parseFloat(data.hyg.toFixed(2)) : null, trend: null, unit: '$' },
            { name: 'LQD (투자등급)', value: data.lqd ? parseFloat(data.lqd.toFixed(2)) : null, trend: null, unit: '$' },
            { name: 'HYG/LQD 스프레드', value: parseFloat(spread.toFixed(3)), trend: null, unit: '%p' }
          ],
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
          components: [
            { name: 'SPY 변화', value: spy?.changePercentage !== null && spy?.changePercentage !== undefined ? parseFloat(spy.changePercentage.toFixed(2)) : '-', unit: '%' },
            { name: 'QQQ 변화', value: qqq?.changePercentage !== null && qqq?.changePercentage !== undefined ? parseFloat(qqq.changePercentage.toFixed(2)) : '-', unit: '%' }
          ],
          interpretation: breadthScore >= 75 ? "시장 전반 상승 중 → 강세 신호" : "일부 종목만 상승 → 주의 필요",
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

        const volConfidence = regime === "Low" ? 85 : regime === "Medium" ? 65 : 40
        return {
          timestamp: new Date().toISOString(),
          dataType: "volatility_regime",
          vix: data.vix,
          regime: regime,
          state: regime,
          confidence: volConfidence,
          signal: regime === "Low" ? "⚡ 공격 모드" : regime === "Medium" ? "⚠️ 균형" : "🔴 방어 모드",
          badgeClass: regime === "Low" ? "bullish" : regime === "High" ? "bearish" : "neutral",
          factors: [
            { name: 'VIX 지수', status: regime === "Low" ? "낮음" : regime === "Medium" ? "중간" : "높음", strength: data.vix ? Math.round(100 - data.vix * 3) : 50 },
            { name: '변동성 레짐', status: regime, strength: volConfidence },
            { name: '투자 포지션', status: regime === "Low" ? "공격적" : regime === "Medium" ? "균형형" : "방어적", strength: regime === "Low" ? 80 : regime === "Medium" ? 55 : 30 }
          ],
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

        const sectorItems = sectorData.map(s => ({
          name: s.name,
          value: s.change !== null && s.change !== undefined ? parseFloat(s.change.toFixed(2)) : null,
          unit: '%'
        }))
        const sectorRankings = sectorData.map((s, i) => ({
          rank: i + 1,
          name: s.name,
          w1: s.change !== null && s.change !== undefined ? parseFloat(s.change.toFixed(2)) : null,
          m1: null,
          y1: null
        }))
        return {
          timestamp: new Date().toISOString(),
          dataType: "sector_rotation",
          top_performers: sectorData.slice(0, 3),
          weakest: sectorData.slice(-3),
          all_sectors: sectorData,
          items: sectorItems,
          rankings: sectorRankings
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

        const btcChange = bitcoin?.changePercentage
        return {
          timestamp: new Date().toISOString(),
          dataType: "dollar_liquidity",
          dxy: dxyPrice,
          signal: dxyPrice > 105 ? "💵 달러 강함" : "📉 달러 약함",
          impact: impact,
          metrics: [
            { name: 'DXY (달러인덱스)', value: dxyPrice ? parseFloat(dxyPrice.toFixed(2)) : null, trend: null, unit: '' },
            { name: 'BTC 변화', value: btcChange !== null && btcChange !== undefined ? parseFloat(btcChange.toFixed(2)) : null, trend: null, unit: '%' }
          ],
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
          score: sentiment,
          sentiment_score: sentiment,
          signal: sentiment > 70 ? "🎉 Greed" : sentiment > 50 ? "➡️ Neutral" : "😨 Fear",
          components: [
            { name: 'BTC 변화', value: btc?.changePercentage !== null && btc?.changePercentage !== undefined ? parseFloat(btc.changePercentage.toFixed(2)) : '-', unit: '%' },
            { name: 'ETH 변화', value: eth?.changePercentage !== null && eth?.changePercentage !== undefined ? parseFloat(eth.changePercentage.toFixed(2)) : '-', unit: '%' }
          ],
          interpretation: sentiment > 70 ? "과열 구간 → 수익실현 고려" : sentiment < 30 ? "공포 구간 → 매수 기회" : "중립 구간 → 관망",
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

        const spyVol = spy?.volume || 0
        const qqqVol = qqq?.volume || 0
        const smConfidence = spyVol > 80000000 ? 85 : spyVol > 60000000 ? 70 : 50
        return {
          timestamp: new Date().toISOString(),
          dataType: "smart_money",
          signal: signal,
          regime: signal === "축적" ? "Accumulation" : "Distribution",
          state: signal,
          confidence: smConfidence,
          status: signal === "축적" ? "🤖 기관 매수" : "⚠️ 기관 매도",
          badgeClass: signal === "축적" ? "bullish" : "bearish",
          factors: [
            { name: 'SPY 거래량', status: spyVol > 60000000 ? '고량' : '저량', strength: Math.min(100, Math.round(spyVol / 1000000)) },
            { name: 'QQQ 거래량', status: qqqVol > 40000000 ? '고량' : '저량', strength: Math.min(100, Math.round(qqqVol / 1000000)) },
            { name: '기관 포지션', status: signal === "축적" ? "매수 우세" : "매도 우세", strength: smConfidence }
          ],
          details: {
            spy_volume: spyVol,
            qqq_volume: qqqVol
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

        const top10 = ranked.slice(0, 7)
        return {
          timestamp: new Date().toISOString(),
          dataType: "stock_ranking",
          ranking: top10,
          items: top10.map(s => ({
            name: s.symbol,
            value: s.change !== null && s.change !== undefined ? parseFloat(s.change.toFixed(2)) : null,
            unit: '%'
          })),
          rankings: top10.map(s => ({
            rank: s.rank,
            name: s.symbol,
            price: s.price ? parseFloat(s.price.toFixed(2)) : null,
            w1: s.change !== null && s.change !== undefined ? parseFloat(s.change.toFixed(2)) : null,
            m1: null,
            y1: null,
            score: s.score
          }))
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
          assets: assets,
          categories: assets.map(a => ({
            name: a.name,
            '1d': a.change !== null && a.change !== undefined ? parseFloat(a.change.toFixed(2)) : null,
            '1w': null,
            '1m': null,
            '3m': null,
            '1y': null
          }))
        }
      }

      // 15. Real Rate Monitor
      async function getRealRateMonitor() {
        const data = await getMarketDataCached()
        const fedRate = data.fedRateVal || data.MACRO_BASE?.FED_RATE
        const inflation = data.inflExpVal || data.MACRO_BASE?.INFLATION_EXPECTATION
        const realRate = data.MACRO_BASE?.REAL_RATES
        const policy = fedRate > inflation ? "긴축" : fedRate < inflation ? "완화" : "중립"

        return {
          timestamp: new Date().toISOString(),
          dataType: "real_rate_monitor",
          policy: policy,
          signal: fedRate > inflation ? "🔴 긴축 모드" : fedRate < inflation ? "🟢 완화 모드" : "🟡 중립",
          metrics: [
            { name: 'Fed 기준금리', value: fedRate, unit: '%' },
            { name: '기대인플레이션', value: inflation, unit: '%' },
            { name: '실질금리', value: realRate, unit: '%' }
          ],
          interpretation: fedRate > inflation ? "실질금리 양수 → 긴축 신호" : "실질금리 음수 → 완화 신호",
          recommendation: fedRate > inflation ? "채권 선호, 현금 보유" : "주식, 위험자산 선호"
        }
      }

      // 16. Fed Policy Impact
      async function getFedPolicyImpact() {
        const data = await getMarketDataCached()
        const fedBalance = data.fed
        const m2 = data.MACRO_BASE?.M2
        const fedRate = data.MACRO_BASE?.FED_RATE

        const liquidityTrend = fedBalance > 7000 ? "확대" : fedBalance > 6000 ? "중립" : "축소"
        const policyStrength = (fedRate < 2) ? "강한 완화" : (fedRate < 4) ? "완화" : "중립/긴축"

        return {
          timestamp: new Date().toISOString(),
          dataType: "fed_policy_impact",
          policy_stance: policyStrength,
          signal: policyStrength === "강한 완화" ? "💰 리스크온" : policyStrength === "완화" ? "📈 약한 리스크온" : "📉 리스크오프",
          components: [
            { name: 'Fed Balance', value: fedBalance, unit: 'T$', trend: liquidityTrend },
            { name: 'M2 Money Supply', value: m2 ? (m2 / 1e6).toFixed(2) : null, unit: 'T$' },
            { name: 'Fed Rate', value: fedRate, unit: '%' }
          ],
          interpretation: policyStrength === "강한 완화" ? "유동성 풍부 상태" : "유동성 축소 중",
          impact: "자산가격 상승압력" + (liquidityTrend === "축소" ? " 약화" : " 유지")
        }
      }

      // 17. Labor Market Health
      async function getLaborMarketHealth() {
        const data = await getMarketDataCached()
        const unemployment = data.MACRO_BASE?.UNEMPLOYMENT
        const payroll = data.MACRO_INDICATORS?.NONFARM_PAYROLLS
        const sentiment = data.MACRO_INDICATORS?.CONSUMER_SENTIMENT

        const healthScore = (unemployment < 4.5) ? 80 : (unemployment < 5) ? 70 : 50
        const trend = unemployment < 4 ? "강세" : unemployment < 5 ? "중립" : "약세"

        return {
          timestamp: new Date().toISOString(),
          dataType: "labor_market_health",
          score: healthScore,
          trend: trend,
          signal: healthScore > 75 ? "💪 강세" : healthScore > 60 ? "➡️ 중립" : "⚠️ 약세",
          metrics: [
            { name: '실업률', value: unemployment, unit: '%', status: unemployment < 4.5 ? "좋음" : "주의" },
            { name: '비농업 고용', value: payroll, unit: '천명' },
            { name: '소비자심리', value: sentiment, unit: 'idx' }
          ],
          interpretation: unemployment < 4.5 ? "강한 고용 시장" : "고용 시장 약화",
          wage_pressure: unemployment < 3.8 ? "높음 (임금 상승)" : "보통"
        }
      }

      // 18. Macro Momentum
      async function getMacroMomentum() {
        const data = await getMarketDataCached()
        const gdpRaw = data.MACRO_INDICATORS?.REAL_GDP
        const indpro = data.MACRO_INDICATORS?.INDUSTRIAL_PRODUCTION
        const cpi = data.MACRO_BASE?.CPI_YOY
        const inflation_exp = data.MACRO_BASE?.INFLATION_EXPECTATION

        // GDP 정규화 (GDPC1 Billions → 경제 활력 지수)
        // 기준: 23500B+ 강함, 23000B 중간, 22500B 약함
        const gdpScore = gdpRaw > 23500 ? 85 : gdpRaw > 23000 ? 75 : gdpRaw > 22500 ? 65 : 50
        const gdpNormalized = parseFloat(((gdpRaw - 22000) / 2000 * 100).toFixed(1)) // 0-100 스케일로 변환

        const indproScore = indpro > 103 ? 85 : indpro > 102 ? 75 : 60
        const inflationScore = cpi < 3 ? 80 : cpi < 4 ? 60 : 30

        const growthScore = (gdpScore + indproScore) / 2
        const combinedScore = (growthScore + inflationScore) / 2

        return {
          timestamp: new Date().toISOString(),
          dataType: "macro_momentum",
          score: Math.round(combinedScore),
          signal: combinedScore > 70 ? "🚀 강한 성장" : combinedScore > 50 ? "📈 중간" : "📉 약한",
          components: [
            { name: '경제 활력도', value: gdpNormalized, unit: 'idx', score: Math.round(gdpScore) },
            { name: '산업생산', value: indpro, unit: 'idx', score: Math.round(indproScore) },
            { name: 'CPI YoY', value: cpi, unit: '%', score: inflationScore },
            { name: '기대인플레', value: inflation_exp, unit: '%' }
          ],
          regime: combinedScore > 70 ? "고성장 저인플레" : combinedScore > 50 ? "중성장 중인플레" : "저성장 고인플레",
          recommendation: combinedScore > 70 ? "성장주/주식 선호" : combinedScore > 50 ? "밸런스형" : "안전자산 선호",
          details: {
            gdp_raw: gdpRaw,
            industrial_production: indpro,
            cpi_yoy: cpi
          }
        }
      }

      // =============================
      // HEDGE FUND UNIVERSE SCREENER
      // =============================
      async function getHedgeFundUniverse() {
        try {
          // 📍 출처: FMP API stock-screener
          const url = `https://financialmodelingprep.com/stable/search-company-screener?marketCapMoreThan=1000000000&volumeMoreThan=1000000&priceMoreThan=10&limit=1000&apikey=${FMP}`
          const r = await fetch(url)
          if (!r.ok) {
            console.error(`❌ Stock Screener: HTTP ${r.status}`)
            return []
          }
          const data = await r.json()
          return (data || []).map(s => s.symbol).slice(0, 100) // 최대 100개로 제한
        } catch (e) {
          console.error(`❌ getHedgeFundUniverse:`, e.message)
          return []
        }
      }

      // =============================
      // GET CURRENT QUARTER
      // =============================
      function getCurrentQuarter() {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const quarter = Math.ceil(month / 3)
        return { year, quarter }
      }

      // =============================
      // ALPHA DISCOVERY ENGINE
      // =============================
      async function runAlphaDiscovery(singleSymbol) {
        try {
          // 단일 종목 또는 전체 universe 분석
          const universe = singleSymbol ? [singleSymbol] : await getHedgeFundUniverse()
          console.log(`📊 Alpha Discovery: ${universe.length}개 종목 분석 시작`)

          const results = []
          const startTime = Date.now()

          // Rate Limit: 20개 종목 × 5개 API = 100 요청 (250/day 내)
          for (let i = 0; i < Math.min(universe.length, singleSymbol ? 1 : 20); i++) {
            const symbol = universe[i]
            try {
              const data = await getAlphaData(symbol)
              if (!data) continue

              const factors = calculateFactors(data)
              if (!factors) continue

              const momentum = momentumScore(data.history)
              const volume = volumeSpike(data.history)
              const score = explosiveScore(factors, momentum, volume)

              results.push({
                symbol,
                score: parseFloat(score.toFixed(4)),
                price: parseFloat(factors.price.toFixed(2)),
                pe: parseFloat(factors.pe.toFixed(2)),
                momentum: parseFloat(momentum.toFixed(4)),
                volume: parseFloat(volume.toFixed(2)),
                revenueGrowth: parseFloat(factors.revenueGrowth.toFixed(4)),
                earningsGrowth: parseFloat(factors.earningsGrowth.toFixed(4)),
                analystScore: parseFloat(factors.analystScore.toFixed(2)),
                insiderActivity: factors.insiderActivity
              })
            } catch (e) {
              console.error(`❌ ${symbol}: ${e.message}`)
            }

            // Rate limit 관리 (250/day)
            if (i % 10 === 9) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }

          results.sort((a, b) => b.score - a.score)

          const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
          console.log(`✅ Alpha Discovery 완료: ${results.length}개 종목, ${elapsedTime}초`)

          return {
            timestamp: new Date().toISOString(),
            dataType: "alpha_discovery",
            universe_size: universe.length,
            analyzed: results.length,
            execution_time_sec: parseFloat(elapsedTime),
            top_20: results.slice(0, 20)
          }
        } catch (e) {
          console.error(`❌ runAlphaDiscovery:`, e.message)
          return {
            timestamp: new Date().toISOString(),
            dataType: "alpha_discovery",
            error: e.message,
            top_20: []
          }
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
            EWY: {
              price: marketData.ewy ? parseFloat(marketData.ewy.toFixed(2)) : null,
              changePercentage: marketData.ewyChange ? parseFloat(marketData.ewyChange.toFixed(2)) : null
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
          // 카드 3: 암호화폐
          CRYPTO: {
            BTC: {
              price: marketData.btc ? parseFloat(marketData.btc.toFixed(2)) : null,
              changePercentage: marketData.btcChange ? parseFloat(marketData.btcChange.toFixed(2)) : null
            },
            ETH: {
              price: marketData.eth ? parseFloat(marketData.eth.toFixed(2)) : null,
              changePercentage: marketData.ethChange ? parseFloat(marketData.ethChange.toFixed(2)) : null
            },
            SOL: {
              price: marketData.sol ? parseFloat(marketData.sol.toFixed(2)) : null,
              changePercentage: marketData.solChange ? parseFloat(marketData.solChange.toFixed(2)) : null
            }
          },
          // 카드 5: 원자재 - index.html COMMODITIES.GOLD.price 등에서 사용
          COMMODITIES: {
            GOLD: marketData.gold ? {
              price: parseFloat(marketData.gold.toFixed(0)),
              changePercentage: marketData.goldChange != null ? parseFloat(marketData.goldChange.toFixed(2)) : null
            } : null,
            SILVER: marketData.silver ? {
              price: parseFloat(marketData.silver.toFixed(2)),
              changePercentage: marketData.silverChange != null ? parseFloat(marketData.silverChange.toFixed(2)) : null
            } : null,
            OIL: marketData.oil ? {
              price: parseFloat(marketData.oil.toFixed(2)),
              changePercentage: marketData.oilChange != null ? parseFloat(marketData.oilChange.toFixed(2)) : null
            } : null
          },
          // 카드 6: 외환 - index.html FX.USDJPY.price 등에서 사용
          FX: {
            USDKRW: marketData.usdkrw ? {
              price: parseFloat(marketData.usdkrw.toFixed(0)),
              changePercentage: marketData.usdkrwChange != null ? parseFloat(marketData.usdkrwChange.toFixed(2)) : null
            } : null,
            USDJPY: marketData.usdjpy ? {
              price: parseFloat(marketData.usdjpy.toFixed(2)),
              changePercentage: marketData.usdjpyChange != null ? parseFloat(marketData.usdjpyChange.toFixed(2)) : null
            } : null,
            EURUSD: marketData.eurusd ? {
              price: parseFloat(marketData.eurusd.toFixed(4)),
              changePercentage: marketData.eurusdChange != null ? parseFloat(marketData.eurusdChange.toFixed(2)) : null
            } : null,
            DXY: marketData.dxyPrice ? {
              price: parseFloat(marketData.dxyPrice.toFixed(2)),
              changePercentage: marketData.dxyChange != null ? parseFloat(marketData.dxyChange.toFixed(2)) : null
            } : null
          },
          // 카드 7: 유동성 - index.html이 raw FRED 값을 직접 단위 변환함
          // FED_BALANCE: raw millions → index.html이 /1,000,000 → T
          // REVERSE_REPO: FRED 원값 Billions → index.html 변환 없이 직접 표시
          // TGA: raw millions → index.html이 /1,000,000 → T
          LIQUIDITY: {
            FED_BALANCE: marketData.fedRaw || null,
            REVERSE_REPO: marketData.rpRaw || null,
            TGA: marketData.tgaRaw || null
          },
          RATES: {
            US10Y: marketData.us10y ? parseFloat(marketData.us10y.toFixed(2)) : null,
            US2Y: marketData.us2y ? parseFloat(marketData.us2y.toFixed(2)) : null,
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
      // /alpha endpoint - Alpha Discovery Engine (9개 인디케이터 기반 점수)
      else if (pathname === "/alpha") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const alphaData = await getAlphaScore(stockSymbol)
          if (alphaData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "alpha",
              symbol: stockSymbol,
              data: alphaData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Alpha score calculation failed for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/earnings endpoint - 실적 데이터
      else if (pathname === "/fundamentals/earnings") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const earningsData = await getEarnings(stockSymbol)
          if (earningsData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "earnings",
              symbol: stockSymbol,
              data: earningsData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Earnings data not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/growth endpoint - 성장률 데이터
      else if (pathname === "/fundamentals/growth") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const growthData = await getFinancialGrowth(stockSymbol)
          if (growthData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "financial_growth",
              symbol: stockSymbol,
              data: growthData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Growth data not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/income endpoint - 수입 명세서
      else if (pathname === "/fundamentals/income") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const incomeData = await getIncomeStatement(stockSymbol)
          if (incomeData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "income_statement",
              symbol: stockSymbol,
              data: incomeData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Income statement not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/balance endpoint - 재무 상태표
      else if (pathname === "/fundamentals/balance") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const balanceData = await getBalanceSheet(stockSymbol)
          if (balanceData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "balance_sheet",
              symbol: stockSymbol,
              data: balanceData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Balance sheet not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/cashflow endpoint - 현금 흐름표
      else if (pathname === "/fundamentals/cashflow") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const cashflowData = await getCashFlow(stockSymbol)
          if (cashflowData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "cash_flow",
              symbol: stockSymbol,
              data: cashflowData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Cash flow statement not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/ratios endpoint - PE, PB 비율
      else if (pathname === "/fundamentals/ratios") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const ratiosData = await getRatios(stockSymbol)
          if (ratiosData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "ratios",
              symbol: stockSymbol,
              data: ratiosData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Ratios not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/profile endpoint - 회사 프로필 (sector, industry)
      else if (pathname === "/fundamentals/profile") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const profileData = await getCompanyProfile(stockSymbol)
          if (profileData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "company_profile",
              symbol: stockSymbol,
              data: profileData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Company profile not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /fundamentals/shares endpoint - 유통주식
      else if (pathname === "/fundamentals/shares") {
        const stockSymbol = url.searchParams.get('symbol')
        if (stockSymbol) {
          const sharesData = await getSharesFloat(stockSymbol)
          if (sharesData) {
            response = {
              timestamp: new Date().toISOString(),
              dataType: "shares_float",
              symbol: stockSymbol,
              data: sharesData
            }
          } else {
            response = {
              timestamp: new Date().toISOString(),
              error: `Shares float not available for ${stockSymbol}`
            }
          }
        } else {
          response = {
            timestamp: new Date().toISOString(),
            error: "symbol parameter required"
          }
        }
      }
      // /feargreed endpoint - CNN Fear & Greed Index (서버사이드 호출, CORS 없음)
      else if (pathname === "/feargreed") {
        try {
          // 출처: CNN Fear & Greed Index 공식 API
          const r = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          })
          if (!r.ok) throw new Error(`CNN HTTP ${r.status}`)
          const d = await r.json()
          const fg = d?.fear_and_greed
          if (!fg || fg.score === undefined) throw new Error('CNN structure mismatch')
          response = {
            score: Math.round(fg.score),
            rating: fg.rating || null,
            previousClose: fg.previous_close ? Math.round(fg.previous_close) : null,
            timestamp: new Date().toISOString(),
            source: 'CNN'
          }
          return new Response(JSON.stringify(response), {
            headers: {
              'content-type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400'  // 24시간 캐시
            }
          })
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message, score: null }), {
            status: 502,
            headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          })
        }
      }
      // 루트 경로 처리
      else if (pathname === "/" || pathname === "/analysis") {
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          message: "26개 엔드포인트 사용 가능 (18개 분석 + 8개 재무데이터)",
          endpoints: {
            analysis: [
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
              "/analysis/market-heatmap",
              "/analysis/real-rate-monitor",
              "/analysis/fed-policy-impact",
              "/analysis/labor-market-health",
              "/analysis/macro-momentum"
            ],
            fundamentals: [
              "/fundamentals/earnings?symbol=SYMBOL",
              "/fundamentals/growth?symbol=SYMBOL",
              "/fundamentals/income?symbol=SYMBOL",
              "/fundamentals/balance?symbol=SYMBOL",
              "/fundamentals/cashflow?symbol=SYMBOL",
              "/fundamentals/ratios?symbol=SYMBOL",
              "/fundamentals/profile?symbol=SYMBOL",
              "/fundamentals/shares?symbol=SYMBOL"
            ],
            market: [
              "/market",
              "/alpha?symbol=SYMBOL",
              "/feargreed"
            ]
          }
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
      } else if (pathname === "/analysis/real-rate-monitor") {
        response = await getRealRateMonitor()
      } else if (pathname === "/analysis/fed-policy-impact") {
        response = await getFedPolicyImpact()
      } else if (pathname === "/analysis/labor-market-health") {
        response = await getLaborMarketHealth()
      } else if (pathname === "/analysis/macro-momentum") {
        response = await getMacroMomentum()

      // =============================
      // EARNINGS & ALPHA DISCOVERY
      // =============================
      } else if (pathname === "/earnings") {
        const symbol = url.searchParams.get('symbol')
        if (symbol) {
          response = await runAlphaDiscovery(symbol)
        } else {
          response = await runAlphaDiscovery()
        }

      } else if (pathname === "/alpha/discovery") {
        response = await runAlphaDiscovery()

      } else if (action === 'metadata') {
        response = {
          timestamp: new Date().toISOString(),
          dataType: "metadata",
          message: "26개 엔드포인트 사용 가능 (18개 분석 + 8개 재무데이터)",
          endpoints: {
            analysis: [
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
            fundamentals: [
              "/fundamentals/earnings?symbol=SYMBOL",
              "/fundamentals/growth?symbol=SYMBOL",
              "/fundamentals/income?symbol=SYMBOL",
              "/fundamentals/balance?symbol=SYMBOL",
              "/fundamentals/cashflow?symbol=SYMBOL",
              "/fundamentals/ratios?symbol=SYMBOL",
              "/fundamentals/profile?symbol=SYMBOL",
              "/fundamentals/shares?symbol=SYMBOL"
            ],
            market: [
              "/market",
              "/alpha?symbol=SYMBOL",
              "/feargreed"
            ],
            discovery: [
              "/alpha/discovery"
            ]
          }
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
          message: "26개 엔드포인트 사용 가능 (18개 분석 + 8개 재무데이터)",
          endpoints: {
            analysis: [
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
            fundamentals: [
              "/fundamentals/earnings?symbol=SYMBOL",
              "/fundamentals/growth?symbol=SYMBOL",
              "/fundamentals/income?symbol=SYMBOL",
              "/fundamentals/balance?symbol=SYMBOL",
              "/fundamentals/cashflow?symbol=SYMBOL",
              "/fundamentals/ratios?symbol=SYMBOL",
              "/fundamentals/profile?symbol=SYMBOL",
              "/fundamentals/shares?symbol=SYMBOL"
            ],
            market: [
              "/market",
              "/alpha?symbol=SYMBOL",
              "/feargreed"
            ],
            discovery: [
              "/alpha/discovery"
            ]
          },
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
