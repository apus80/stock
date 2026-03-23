/* ============================================================
   METRICZ 모듈 (모듈 레벨 상수 및 캐시 갱신 로직)
   - SP500_UNIVERSE: S&P500 대표 180개 종목
   - cron으로 6시간마다 KV에 갱신 (20종목 × 4배치 = 80 call/wave)
   - /metricz-all 엔드포인트에서 KV 캐시를 읽어 스코어링
============================================================ */

// ── S&P500 전종목 (~500종목, 2025/2026 기준) ──────────────────────────────
// FMP API /stable/sp500-constituent 실패 시 사용하는 Fallback (전체 S&P500 커버)
const SP500_UNIVERSE = [
  // 정보기술 (Information Technology ~66)
  'AAPL','MSFT','NVDA','AVGO','ORCL','CRM','ADBE','AMD','QCOM','TXN',
  'AMAT','LRCX','MU','NOW','INTU','PANW','CSCO','IBM','KLAC','PLTR',
  'MRVL','NXPI','FTNT','MCHP','TER','ON','MPWR','ANSS','CDNS','DDOG',
  'ZS','STX','WDC','NTAP','JNPR','GLW','SWKS','HPQ','HPE','CDW',
  'KEYS','IT','GDDY','ZBRA','AKAM','PTC','GEN','EPAM','ANET','FSLR',
  'ENPH','DELL','CTSH','ACN','SNPS','VRSN','PAYC','WDAY','FICO','NTNX',
  'FFIV','TRMB','VEEV','MANH','INTC','TTD',
  // 커뮤니케이션 서비스 (Communication Services ~22)
  'META','GOOGL','GOOG','NFLX','DIS','CMCSA','T','VZ','TMUS','CHTR',
  'WBD','EA','TTWO','OMC','IPG','FOXA','FOX','LYV','MTCH','PARA',
  'NWSA','NWS',
  // 헬스케어 (Health Care ~62)
  'LLY','UNH','JNJ','MRK','ABBV','TMO','ABT','DHR','BMY','AMGN',
  'GILD','ISRG','VRTX','REGN','BSX','CI','CVS','ELV','HCA','BIIB',
  'ZBH','DXCM','ALGN','HOLX','PODD','CRL','WST','MTD','A','IQV',
  'SYK','EW','RMD','BDX','BAX','MCK','EHC','VTRS','MOH','CNC',
  'HUM','HSIC','DGX','LH','INCY','BIO','WAT','MRNA','PFE','MDT',
  'STE','GEHC','RVTY','TFX','SOLV','TECH','PKI','COO','IDXX','PDCO',
  'CTLT','EXAS',
  // 금융 (Financials ~68)
  'JPM','BAC','WFC','GS','MS','C','AXP','BLK','V','MA',
  'SCHW','CME','COF','USB','PNC','TFC','CB','MMC','AON','ICE',
  'SPGI','MCO','MET','PRU','AFL','AIG','ALL','PGR','TRV','HIG',
  'WRB','CINF','FITB','HBAN','KEY','CMA','RF','MTB','CFG','EG',
  'ACGL','TROW','BEN','IVZ','STT','NTRS','FDS','AMP','RJF','LNC',
  'MKTX','CG','APO','BX','KKR','ARES','FHN','FNF','FAF','WTW',
  'FLT','WEX','BR','CBOE','NDAQ','EFX','SYF','ALLY',
  // 임의소비재 (Consumer Discretionary ~55)
  'AMZN','TSLA','HD','MCD','NKE','SBUX','LOW','BKNG','TJX','ROST',
  'ULTA','DHI','LEN','TOL','PHM','NVR','YUM','DRI','ABNB','MGM',
  'HLT','MAR','RCL','CCL','NCLH','GM','F','ETSY','EBAY','VFC',
  'PVH','TPR','RL','GRMN','EXPE','DG','DLTR','BBWI','POOL','BWA',
  'AZO','ORLY','APTV','LVS','WYNN','DPZ','CMG','LULU','MTN','GPC',
  'KMX','LKQ','CPRI','HAS','MAT',
  // 필수소비재 (Consumer Staples ~36)
  'WMT','COST','PG','KO','PEP','MO','PM','CL','KMB','GIS',
  'MDLZ','STZ','HRL','SYY','TSN','CAG','CPB','MKC','K','SJM',
  'CHD','EL','BG','INGR','TAP','ADM','LW','REYN','POST','CLX',
  'HSY','MNST','KDP','KVUE','COTY','THS',
  // 에너지 (Energy ~23)
  'XOM','CVX','COP','EOG','SLB','MPC','VLO','PSX','OXY','DVN',
  'HAL','BKR','HES','MRO','FANG','APA','LNG','EQT','AR','KMI',
  'WMB','OKE','TRGP',
  // 산업재 (Industrials ~78)
  'CAT','DE','RTX','BA','HON','GE','LMT','NOC','GD','UPS',
  'FDX','CSX','NSC','UNP','WM','RSG','EMR','ETN','PH','ROK',
  'AME','XYL','EXPD','JBHT','CHRW','KNX','ODFL','GWW','FAST','SWK',
  'SNA','PNR','RRX','GNRC','TT','JCI','IR','CARR','OTIS','WCN',
  'FTV','NDSN','LDOS','SAIC','CACI','VRT','AXON','HUBB','ALLE','MAS',
  'AOS','LII','WAB','GEV','VRSK','DAL','UAL','AAL','LUV','ALK',
  'TDG','HWM','HII','TXT','AGCO','PCAR','TREX','BCO','RXO','XPO',
  'SAIA','L','MSM','RBC','PWR','ITW','MHK','JBLU',
  // 소재 (Materials ~29)
  'LIN','APD','NEM','FCX','NUE','STLD','DOW','DD','PPG','SHW',
  'ECL','EMN','CE','CF','MOS','IFF','IEX','BLL','AMCR','IP',
  'AVY','PKG','SEE','WRK','ATI','RS','CMC','MLM','VMC',
  // 부동산 (Real Estate ~31)
  'PLD','AMT','CCI','EQIX','SPG','O','WELL','AVB','EQR','DLR',
  'ARE','VTR','PSA','EXR','CUBE','MAA','UDR','CPT','BXP','VICI',
  'INVH','SBA','SBAC','CBRE','IRM','STAG','FR','RHP','HST','NNN','REG',
  // 유틸리티 (Utilities ~28)
  'NEE','DUK','SO','D','AEP','SRE','XEL','WEC','ES','ETR',
  'PCG','EXC','PPL','CMS','AEE','AWK','CNP','NI','LNT','CEG',
  'VST','EIX','FE','NRG','EVRG','DTE','PEG','AES',
]

const METRICZ_KV_KEY    = 'metricz_universe_cache'
const DISCOVERY_KV_KEY  = 'alpha_discovery_cache'
const BREAKOUT_KV_KEY   = 'breakout_discovery_cache'
const SP500_KV_KEY      = 'sp500_constituent_cache'   // 24h TTL — S&P500 구성 종목 캐시

// 낮을수록 좋은 지표 (퍼센타일 역산)
const LOWER_IS_BETTER = new Set([
  'peRatioTTM', 'priceToBookRatioTTM', 'priceToSalesRatioTTM',
  'enterpriseValueOverEBITDATTM', 'debtEquityRatioTTM',
])

// 지표 → 소스 엔드포인트 매핑
const METRIC_SOURCE_MAP = {
  returnOnEquityTTM:            'ratios',
  operatingProfitMarginTTM:     'ratios',
  returnOnAssetsTTM:            'ratios',
  netProfitMarginTTM:           'ratios',
  peRatioTTM:                   'ratios',
  priceToBookRatioTTM:          'ratios',
  priceToSalesRatioTTM:         'ratios',
  dividendYieldTTM:             'ratios',
  payoutRatioTTM:               'ratios',
  debtEquityRatioTTM:           'ratios',
  currentRatioTTM:              'ratios',
  enterpriseValueOverEBITDATTM: 'keymetrics',
  freeCashFlowYieldTTM:         'keymetrics',
  revenueGrowth:                'growth',
  epsgrowth:                    'growth',
  operatingIncomeGrowth:        'growth',
  assetGrowth:                  'growth',
  beta:                         'quote',
}

// 배치 헬퍼: items를 batchSize 단위로 나눠 순차 실행 (wave당 80 calls 제한)
// ── S&P500 전종목 유니버스 (FMP API + KV 캐시) ────────────────────────────
// 출처: FMP /stable/sp500-constituent (Starter 플랜 포함 Reference Data)
// KV TTL: 24h (S&P500 구성 변경 빈도 낮음, 월/분기 단위)
async function getSP500Symbols(kv, apiKey) {
  // 1. KV 캐시 확인 (24h TTL)
  if (kv) {
    try {
      const cached = await kv.get(SP500_KV_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        const ageMs = Date.now() - new Date(parsed.timestamp).getTime()
        if (ageMs < 24 * 3600 * 1000 && parsed.symbols?.length > 100) {
          console.log(`✅ S&P500 KV 캐시 히트: ${parsed.symbols.length}종목`)
          return parsed.symbols
        }
      }
    } catch(e) { console.warn('⚠️ S&P500 KV 읽기 실패:', e.message) }
  }
  // 2-a. FMP stable endpoint 시도
  try {
    const data = await fmpGet(`https://financialmodelingprep.com/stable/sp500-constituent?apikey=${apiKey}`)
    if (data && Array.isArray(data) && data.length > 100) {
      const symbols = data.map(s => s.symbol).filter(Boolean)
      console.log(`✅ FMP stable S&P500: ${symbols.length}종목`)
      if (kv) await kv.put(SP500_KV_KEY, JSON.stringify({ timestamp: new Date().toISOString(), symbols }), { expirationTtl: 24 * 3600 })
      return symbols
    }
    console.warn('⚠️ stable/sp500-constituent 실패 응답:', JSON.stringify(data)?.slice(0, 200))
  } catch(e) { console.warn('⚠️ stable/sp500-constituent 예외:', e.message) }
  // 2-b. FMP v3 endpoint 시도 (alternative)
  try {
    const data = await fmpGet(`https://financialmodelingprep.com/api/v3/sp500_constituent?apikey=${apiKey}`)
    if (data && Array.isArray(data) && data.length > 100) {
      const symbols = data.map(s => s.symbol).filter(Boolean)
      console.log(`✅ FMP v3 S&P500: ${symbols.length}종목`)
      if (kv) await kv.put(SP500_KV_KEY, JSON.stringify({ timestamp: new Date().toISOString(), symbols }), { expirationTtl: 24 * 3600 })
      return symbols
    }
    console.warn('⚠️ v3/sp500_constituent 실패 응답:', JSON.stringify(data)?.slice(0, 200))
  } catch(e) { console.warn('⚠️ v3/sp500_constituent 예외:', e.message) }
  // 3. Fallback: 확장 hardcoded ~500종목 (FMP API 미지원 플랜 또는 장애 시)
  console.warn(`⚠️ S&P500 API 실패 → hardcoded ${SP500_UNIVERSE.length}종목 사용`)
  return SP500_UNIVERSE
}

async function batchProcess(items, batchSize, fn, delayMs = 0) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const wave = items.slice(i, i + batchSize)
    const waveResults = await Promise.allSettled(wave.map(fn))
    results.push(...waveResults)
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  return results
}

// ── Breakout 점수 계산 (순수 함수 — 클로저 불필요, module-level) ─────────────
function calculateBreakoutScore(q) {
  if (!q || !q.price) return null
  const price = q.price
  const yearHigh = q.yearHigh || price
  const yearLow = q.yearLow || price * 0.7
  const volume = q.volume || 0
  const avgVolume = q.avgVolume || volume || 1
  const dayLow = q.dayLow || price
  const dayHigh = q.dayHigh || price
  const priceAvg50 = q.priceAvg50 || price
  const priceAvg200 = q.priceAvg200 || price
  const changePct = q.changesPercentage || q.changePercentage || 0
  const eps = q.eps || 0
  const pe = (q.pe && q.pe > 0) ? q.pe : (price > 0 && eps > 0) ? price / eps : 0
  const marketCap = q.marketCap || 0
  const highPct = yearHigh > 0 ? (price / yearHigh) * 100 : 50
  const highScore = Math.max(0, Math.min(100, (highPct - 70) * (100 / 30)))
  const volRatio = avgVolume > 0 ? volume / avgVolume : 1
  const volScore = Math.max(0, Math.min(100, (volRatio - 0.5) * 100))
  const momScore = Math.max(0, Math.min(100, (changePct + 5) * 10))
  const ma50Ratio = priceAvg50 > 0 ? price / priceAvg50 : 1
  const ma50Score = Math.max(0, Math.min(100, (ma50Ratio - 0.9) * 500))
  const goldenRatio = priceAvg200 > 0 ? priceAvg50 / priceAvg200 : 1
  const goldenScore = Math.max(0, Math.min(100, (goldenRatio - 0.95) * 1000))
  const yearRange = yearHigh - yearLow
  const yearPosition = yearRange > 0 ? (price - yearLow) / yearRange * 100 : 50
  const rangeScore = Math.max(0, Math.min(100, yearPosition))
  const dayRange = dayHigh - dayLow
  const dayPosition = dayRange > 0 ? (price - dayLow) / dayRange * 100 : 50
  const pressureScore = Math.max(0, Math.min(100, dayPosition))
  let peScore = 50
  if (pe > 0) {
    if (pe < 15)       peScore = 90
    else if (pe < 20)  peScore = 75
    else if (pe < 30)  peScore = 55
    else if (pe < 40)  peScore = 35
    else               peScore = 15
  }
  const totalScore = highScore*0.20 + volScore*0.20 + momScore*0.15 + ma50Score*0.15
                   + goldenScore*0.08 + rangeScore*0.08 + pressureScore*0.04 + peScore*0.10
  let signal, signalLabel
  if (totalScore >= 75)      { signal = 'BREAKOUT';     signalLabel = '돌파 임박' }
  else if (totalScore >= 60) { signal = 'ACCUMULATION'; signalLabel = '매집 단계' }
  else if (totalScore >= 45) { signal = 'NEUTRAL';      signalLabel = '중립' }
  else                       { signal = 'WEAKNESS';     signalLabel = '약세' }
  return {
    symbol: q.symbol || q.name, name: q.name || q.symbol,
    price: parseFloat(price.toFixed(2)), change: parseFloat(changePct.toFixed(2)),
    pe: pe > 0 ? parseFloat(pe.toFixed(1)) : null,
    breakoutScore: parseFloat(totalScore.toFixed(1)), signal, signalLabel,
    signals: {
      highProximity: parseFloat(highPct.toFixed(1)), volumeRatio: parseFloat(volRatio.toFixed(2)),
      momentum: parseFloat(changePct.toFixed(2)), ma50Above: price > priceAvg50,
      goldenCross: priceAvg50 > priceAvg200, yearRangePosition: parseFloat(yearPosition.toFixed(1)),
      buyPressure: parseFloat(dayPosition.toFixed(1))
    },
    technicals: {
      yearHigh: parseFloat(yearHigh.toFixed(2)), yearLow: parseFloat(yearLow.toFixed(2)),
      priceAvg50: parseFloat(priceAvg50.toFixed(2)), priceAvg200: parseFloat(priceAvg200.toFixed(2)),
      volume, avgVolume, pe: pe > 0 ? parseFloat(pe.toFixed(1)) : null, marketCap
    },
    components: {
      highScore: parseFloat(highScore.toFixed(1)), volScore: parseFloat(volScore.toFixed(1)),
      momScore: parseFloat(momScore.toFixed(1)), ma50Score: parseFloat(ma50Score.toFixed(1)),
      goldenScore: parseFloat(goldenScore.toFixed(1)), rangeScore: parseFloat(rangeScore.toFixed(1)),
      pressureScore: parseFloat(pressureScore.toFixed(1)), peScore: parseFloat(peScore.toFixed(1))
    }
  }
}

// ── Breakout 캐시 갱신 (module-level — cron + 실시간 fallback 공용) ──────────
// 출처: FMP /stable/quote (Starter 플랜) + METRICZ_KV PE 주입
async function refreshBreakoutCache(env) {
  const kv = env.METRICZ_KV
  const apiKey = env.FMP_API_KEY
  if (!apiKey || !kv) return null

  // S&P500 전종목 유니버스 (FMP constituent API → KV 캐시)
  const stocks = await getSP500Symbols(kv, apiKey)

  // METRICZ_KV에서 PE 로드 (ratios + key-metrics-ttm 기반, 신뢰도 높음)
  let metriczPE = {}
  try {
    const metriczRaw = await kv.get(METRICZ_KV_KEY)
    if (metriczRaw) {
      const metriczData = JSON.parse(metriczRaw).stocks || {}
      for (const [sym, data] of Object.entries(metriczData)) {
        if (data.peRatioTTM && data.peRatioTTM > 0) metriczPE[sym] = data.peRatioTTM
      }
      console.log(`✅ Breakout: metricz PE ${Object.keys(metriczPE).length}개 로드`)
    }
  } catch(e) { console.warn('⚠️ Breakout metricz PE 로드 실패:', e.message) }

  const results = []
  const startTime = Date.now()
  const WAVE = 15  // 15개씩 병렬, 300ms 딜레이 → Starter 300calls/min 준수

  for (let i = 0; i < stocks.length; i += WAVE) {
    const wave = stocks.slice(i, i + WAVE)
    const waveResults = await Promise.allSettled(wave.map(async sym => {
      try {
        const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${apiKey}`)
        if (!r.ok) return null
        const j = await r.json()
        const q = Array.isArray(j) ? j[0] : j
        if (!q?.price) return null
        if (metriczPE[sym]) q.pe = metriczPE[sym]  // METRICZ_KV PE 주입
        return calculateBreakoutScore(q)
      } catch { return null }
    }))
    for (const r of waveResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value)
    }
    if (i + WAVE < stocks.length) await new Promise(r => setTimeout(r, 300))
  }

  results.sort((a, b) => b.breakoutScore - a.breakoutScore)
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const breakoutResult = {
    timestamp: new Date().toISOString(),
    dataType: 'breakout_discovery',
    universe_size: stocks.length,
    analyzed: results.length,
    execution_time_sec: parseFloat(elapsed),
    top_15: results.slice(0, 15)
  }
  try {
    await kv.put(BREAKOUT_KV_KEY, JSON.stringify(breakoutResult), { expirationTtl: 8 * 3600 })
    console.log(`✅ Breakout KV 갱신: ${results.length}/${stocks.length}종목, ${elapsed}s`)
  } catch(e) { console.warn('⚠️ Breakout KV 쓰기 실패:', e.message) }
  return breakoutResult
}

// 단일 종목 FMP fetch 헬퍼 (타임아웃 9초)
async function fmpGet(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      if (r.status === 429) {
        clearTimeout(timer)
        if (attempt < retries) {
          const wait = (attempt + 1) * 2000
          console.warn(`⚠️ 429 rate limit: ${url.split('?')[0]}, retry ${attempt+1} in ${wait}ms`)
          await new Promise(resolve => setTimeout(resolve, wait))
          continue
        }
        console.error(`❌ 429 rate limit exhausted: ${url.split('?')[0]}`)
        return null
      }
      if (!r.ok) {
        clearTimeout(timer)
        console.warn(`⚠️ HTTP ${r.status}: ${url.split('?')[0]}`)
        return null
      }
      const data = await r.json()
      clearTimeout(timer)
      return data
    } catch(e) {
      clearTimeout(timer)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      return null
    }
  }
  return null
}

// 종목 전체 지표 fetch (Starter 플랜 기준, 3 endpoints)
// ✅ /stable/ratios            PE, PB, PS, currentRatio, margins, dividendYield, debt ratios
// ✅ /stable/key-metrics-ttm   ROE, ROA, payoutRatio, debtEquity, EV/EBITDA, FCF yield
// ✅ /stable/financial-growth  revenueGrowth, epsGrowth, operatingIncomeGrowth
async function fetchAllMetricz(sym, apiKey) {
  const BASE = 'https://financialmodelingprep.com/stable'
  // 3 엔드포인트 병렬 호출 (chunk 15종목 × 3 = 45 subrequests < 50 한도)
  const settled = await Promise.allSettled([
    fmpGet(`${BASE}/ratios?symbol=${sym}&apikey=${apiKey}`),               // PE/PB/PS/margins/currentRatio/dividendYield
    fmpGet(`${BASE}/key-metrics-ttm?symbol=${sym}&apikey=${apiKey}`),      // ROE/ROA/payoutRatio/debtEquity/EV/FCF
    fmpGet(`${BASE}/financial-growth?symbol=${sym}&apikey=${apiKey}`),     // 성장성
  ])

  const unwrap = (s) => s.status === 'fulfilled' && s.value ? (Array.isArray(s.value) ? s.value[0] : s.value) : null

  const r = unwrap(settled[0])  // ratios
  const k = unwrap(settled[1])  // key-metrics-ttm
  const g = unwrap(settled[2])  // financial-growth

  // PE: ratios.priceToEarningsRatio 우선, key-metrics-ttm fallback
  const pbPrimary = r?.priceToBookRatio   || r?.pb || r?.priceToBookRatioTTM
  const psPrimary = r?.priceToSalesRatio  || r?.ps || r?.priceToSalesRatioTTM
  const pePrimary = (r?.priceToEarningsRatio && r.priceToEarningsRatio > 0) ? r.priceToEarningsRatio
                  : (r?.peRatio            && r.peRatio > 0)             ? r.peRatio
                  : (r?.pe                 && r.pe > 0)                  ? r.pe
                  : (k?.peRatioTTM         && k.peRatioTTM > 0)         ? k.peRatioTTM
                  : (k?.peRatio            && k.peRatio > 0)             ? k.peRatio
                  : null

  return {
    symbol: sym,
    name:   sym,
    // 수익성 — ROE/ROA는 /stable/key-metrics-ttm 전용 (ratios에 없음)
    returnOnEquityTTM:            k?.returnOnEquityTTM            ?? k?.returnOnEquity            ?? null,
    operatingProfitMarginTTM:     r?.operatingProfitMargin        ?? r?.operatingProfitMarginTTM  ?? null,
    returnOnAssetsTTM:            k?.returnOnAssetsTTM            ?? k?.returnOnAssets            ?? null,
    netProfitMarginTTM:           r?.netProfitMargin              ?? r?.netProfitMarginTTM        ?? null,
    // 밸류에이션
    peRatioTTM:                   pePrimary,
    priceToBookRatioTTM:          (pbPrimary && pbPrimary > 0) ? pbPrimary : null,
    priceToSalesRatioTTM:         (psPrimary && psPrimary > 0) ? psPrimary : null,
    // 배당·건전성 — payoutRatio/debtEquity는 key-metrics-ttm 우선
    dividendYieldTTM:             r?.dividendYield ?? r?.divYield ?? k?.dividendYieldTTM ?? null,
    payoutRatioTTM:               k?.payoutRatioTTM   ?? k?.payoutRatio   ?? r?.dividendPayoutRatio ?? null,
    debtEquityRatioTTM:           (() => {
                                    const v = k?.debtToEquityTTM ?? k?.debtEquityRatioTTM ?? k?.debtToEquity
                                           ?? r?.debtEquityRatio ?? r?.debtToEquityRatio
                                    return (v != null && v !== 0) ? v : null
                                  })(),
    currentRatioTTM:              r?.currentRatio  ?? r?.currentRatioTTM  ?? null,
    // EV/EBITDA·FCF — key-metrics-ttm 우선
    enterpriseValueOverEBITDATTM: k?.enterpriseValueOverEBITDATTM ?? k?.evToEbitdaTTM ?? k?.evToEbitda
                                  ?? r?.enterpriseValueMultiple ?? null,
    freeCashFlowYieldTTM:         k?.freeCashFlowYieldTTM ?? k?.freeCashFlowYield
                                  ?? r?.freeCashFlowYield ?? null,
    // 성장성 (/stable/financial-growth)
    revenueGrowth:                g?.revenueGrowth         ?? null,
    epsgrowth:                    g?.epsGrowth ?? g?.epsgrowth ?? g?.earningsGrowth ?? null,
    operatingIncomeGrowth:        g?.operatingIncomeGrowth ?? g?.operatingCashFlowGrowth ?? null,
    assetGrowth:                  g?.assetGrowth           ?? null,
    // 리스크 — ratios에서 추출
    beta:                         null,
  }
}

// ── KV 캐시 갱신 (cron용, chunk 지원) ───────────────────────────────────────
// Cloudflare Workers subrequest 한도 대응: chunk 단위 처리
// Free plan: 50 subrequests, Paid plan: 1000 subrequests
// 종목당 2 API calls (ratios + key-metrics-ttm) → chunk당 최대 20종목(40 calls)
async function refreshMetriczCache(env, chunkIndex = -1) {
  const apiKey = env.FMP_API_KEY
  const kv     = env.METRICZ_KV
  if (!apiKey || !kv) {
    console.error('❌ refreshMetriczCache: FMP_API_KEY 또는 METRICZ_KV 없음')
    return { success: 0, total: 0 }
  }

  // S&P500 전종목 유니버스 로드 (FMP constituent API → KV 캐시)
  const universe = await getSP500Symbols(kv, apiKey)
  const startTime = Date.now()

  // chunk 설정: 15종목/chunk × 3endpoints = 45 subrequests (50한도 이내)
  const CHUNK_SIZE = 15
  const totalChunks = Math.ceil(universe.length / CHUNK_SIZE)

  // 기존 KV 데이터 로드 (chunk 모드에서 병합용)
  let existingStocks = {}
  let existingCount = 0
  try {
    const existing = await kv.get(METRICZ_KV_KEY)
    if (existing) {
      const parsed = JSON.parse(existing)
      existingStocks = parsed.stocks || {}
      existingCount = Object.keys(existingStocks).length
    }
  } catch(e) { /* 기존 데이터 없으면 빈 객체 */}

  // chunkIndex=-1이면 전체 처리 (paid plan용), 아니면 해당 chunk만 처리
  let startIdx, endIdx
  if (chunkIndex >= 0) {
    startIdx = chunkIndex * CHUNK_SIZE
    endIdx = Math.min(startIdx + CHUNK_SIZE, universe.length)
    if (startIdx >= universe.length) {
      console.log(`⚠️ chunk ${chunkIndex} 범위 초과 (총 ${universe.length}종목, ${totalChunks} chunks)`)
      return { success: 0, total: universe.length, chunk: chunkIndex, totalChunks }
    }
  } else {
    startIdx = 0
    endIdx = universe.length
  }

  const targetSymbols = universe.slice(startIdx, endIdx)
  console.log(`🔄 metricz 캐시 갱신: ${targetSymbols.length}종목 (${startIdx}~${endIdx-1}), chunk=${chunkIndex}, 3 endpoints/stock`)

  // 3종목/wave × 3endpoints = 9 calls/wave, 2000ms 딜레이
  // rate: 9/2 × 60 = 270 calls/min → Starter 300 한도 이내
  const results = await batchProcess(targetSymbols, 3, sym => fetchAllMetricz(sym, apiKey), 2000)

  // 기존 데이터에 새 데이터 병합
  let newSuccess = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      const sym = targetSymbols[i]
      // 유효한 데이터만 병합 (최소 1개 필드가 non-null)
      const v = r.value
      const hasData = v.peRatioTTM != null || v.returnOnEquityTTM != null || v.operatingProfitMarginTTM != null
      if (hasData) {
        existingStocks[sym] = v
        newSuccess++
      } else if (!existingStocks[sym]) {
        existingStocks[sym] = v  // null 데이터라도 저장 (빈 항목 방지)
      }
    }
  })

  const payload = {
    timestamp: new Date().toISOString(),
    count: Object.keys(existingStocks).length,
    stocks: existingStocks,
  }

  await kv.put(METRICZ_KV_KEY, JSON.stringify(payload), { expirationTtl: 12 * 3600 })
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ metricz chunk ${chunkIndex}: ${newSuccess}/${targetSymbols.length}종목 성공, 누적 ${Object.keys(existingStocks).length}종목, ${elapsed}s`)
  return { success: newSuccess, total: targetSymbols.length, chunk: chunkIndex, totalChunks, cumulative: Object.keys(existingStocks).length }
}

// ── Discovery 캐시 갱신 (cron용, SP500 상위 80종목 × 4 API = 320 calls) ──
async function refreshDiscoveryCache(env) {
  const apiKey = env.FMP_API_KEY
  const kv     = env.METRICZ_KV
  if (!apiKey || !kv) {
    console.error('❌ refreshDiscoveryCache: FMP_API_KEY 또는 METRICZ_KV 없음')
    return
  }

  // 출처: FMP API /stable/quote (Starter 플랜 확인)
  const BASE    = 'https://financialmodelingprep.com/stable'
  // S&P500 전종목 유니버스 (FMP constituent API → KV 캐시)
  const SYMBOLS = await getSP500Symbols(kv, apiKey)

  // metricz KV에서 PE 데이터 로드 (quote pe가 null/0일 때 fallback)
  let metriczStocks = {}
  try {
    const metriczRaw = await kv.get(METRICZ_KV_KEY)
    if (metriczRaw) metriczStocks = JSON.parse(metriczRaw).stocks || {}
  } catch(e) { console.warn('metricz KV 로드 실패 (PE fallback 없음):', e.message) }

  const results = []

  for (let i = 0; i < SYMBOLS.length; i += 10) {
    const wave = SYMBOLS.slice(i, i + 10)
    const waveResults = await Promise.allSettled(wave.map(async (symbol) => {
      try {
        const qRaw = await fmpGet(`${BASE}/quote?symbol=${symbol}&apikey=${apiKey}`)
        const q = Array.isArray(qRaw) ? (qRaw[0] || {}) : (qRaw || {})
        if (!q.price) return null

        const price   = q.price    || 0
        const ma50    = q.priceAvg50  || price
        const ma200   = q.priceAvg200 || price
        const yLow    = q.yearLow   || price * 0.7
        const yHigh   = q.yearHigh  || price * 1.3
        const vol     = q.volume    || 0
        const avgVol  = (q.avgVolume > 0) ? q.avgVolume : null  // null이면 비교 불가
        const mom     = q.changePercentage || 0   // 당일 % 변동

        // PE: quote.pe → price/eps 계산 → metricz KV fallback
        const peFromQuote   = (q.pe && q.pe > 0) ? q.pe
                            : (price > 0 && q.eps && q.eps > 0) ? price / q.eps   // price÷eps 계산
                            : 0
        const peFromMetricz = metriczStocks[symbol]?.peRatioTTM > 0 ? metriczStocks[symbol].peRatioTTM : 0
        const pe = peFromQuote > 0 ? peFromQuote : peFromMetricz

        // 기술적 지표 (모두 % 단위)
        const ma50trend  = ma50  > 0 ? (price - ma50)  / ma50  * 100 : 0
        const range      = yHigh - yLow
        const str52w     = range > 0 ? (price - yLow) / range * 100 : 50

        // 거래량 급증: vol=0 또는 avgVol 없으면 null (장 마감/주말 판단 불가)
        const volSurge = (vol > 0 && avgVol > 0) ? (vol / avgVol - 1) * 100 : null

        // 종합 점수 (volSurge 없으면 0으로 처리)
        const vsScore = volSurge != null ? Math.min(50, Math.max(-20, volSurge)) : 0
        const score = mom       * 0.30
                    + ma50trend * 0.25
                    + (str52w - 50) * 0.25
                    + vsScore       * 0.20

        return {
          symbol,
          price,
          volume: vol,
          momentum:   parseFloat(mom.toFixed(2)),
          ma50trend:  parseFloat(ma50trend.toFixed(2)),
          str52w:     parseFloat(str52w.toFixed(1)),
          volSurge:   volSurge != null ? parseFloat(volSurge.toFixed(1)) : null,  // 장 마감 시 null
          pe:         parseFloat((pe || 0).toFixed(1)),
          score:      parseFloat(score.toFixed(2))
        }
      } catch {
        return null
      }
    }))
    results.push(...waveResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(v => v))
    if (i + 10 < SYMBOLS.length) await new Promise(r => setTimeout(r, 200))
  }

  results.sort((a, b) => b.score - a.score)
  const top_20 = results.slice(0, 20)
  // all_stocks: 전체 분석 결과 저장 (ai-analysis-3 위젯이 각자 재정렬하여 사용)
  const payload = {
    timestamp: new Date().toISOString(),
    universe_size: SYMBOLS.length,
    analyzed: results.length,
    execution_time_sec: 0,
    top_20,
    all_stocks: results   // 전체 결과 (180종목)
  }
  await kv.put(DISCOVERY_KV_KEY, JSON.stringify(payload), { expirationTtl: 8 * 3600 })
  console.log(`✅ discovery 캐시 갱신 완료: ${results.length}/${SYMBOLS.length}종목 (top_20 + all_stocks 저장)`)
}

// ── 퍼센타일 스코어링 ────────────────────────────────────────────
function metriczScore(stocksArray, userLogic) {
  return stocksArray.map(stock => {
    let totalScore = 0
    userLogic.forEach(({ metric, weight }) => {
      if (!weight) return
      const val = stock[metric]
      if (val === null || val === undefined || !isFinite(val)) return

      const allVals = stocksArray
        .map(s => s[metric])
        .filter(v => v !== null && v !== undefined && isFinite(v))
      if (allVals.length < 2) return

      const below = allVals.filter(v => v < val).length
      const pct   = below / (allVals.length - 1) * 100
      const score = LOWER_IS_BETTER.has(metric) ? 100 - pct : pct
      totalScore += score * (weight / 100)
    })
    return {
      symbol: stock.symbol,
      name:   stock.name,
      score:  parseFloat(totalScore.toFixed(2)),
    }
  })
}

// ── Catalyst Surge: module-level helpers ────────────────────────────────────
// fetchFMP: path-based FMP wrapper reusing existing fmpGet (timeout + null safety)
async function fetchFMP(endpoint, env) {
  const API_KEY = env.FMP_API_KEY
  const url = endpoint.includes('?')
    ? `https://financialmodelingprep.com${endpoint}&apikey=${API_KEY}`
    : `https://financialmodelingprep.com${endpoint}?apikey=${API_KEY}`
  return await fmpGet(url)
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function calculateEMA(data, period) {
  const k = 2 / (period + 1)
  let ema = [data[0]]
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k))
  }
  return ema
}

function calculateRSI(data, period) {
  let gains = [], losses = []
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  let rsi = []
  for (let i = period; i < gains.length; i++) {
    const avgGain = average(gains.slice(i - period, i))
    const avgLoss = average(losses.slice(i - period, i))
    const rs = avgGain / (avgLoss || 1)
    rsi.push(100 - 100 / (1 + rs))
  }
  return Array(period).fill(50).concat(rsi)
}

function calculateBollinger(data, period) {
  const width = []
  for (let i = period; i < data.length; i++) {
    const slice = data.slice(i - period, i)
    const avg = average(slice)
    const std = Math.sqrt(average(slice.map(v => (v - avg) ** 2)))
    width.push((avg + 2 * std - (avg - 2 * std)) / avg)
  }
  return { width: Array(period).fill(0).concat(width) }
}

function calculateATR(data) {
  const trs = []
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    )
    trs.push(tr)
  }
  const atr = average(trs.slice(-14))
  const price = data[data.length - 1].close
  return { atrPct: (atr / price) * 100 }
}

// CSS 최대값: C(21)×0.4 + T(50)×0.35 + S(12)×0.25 = 28.9
const CSS_MAX = 21 * 0.4 + 50 * 0.35 + 12 * 0.25

// css: 0~100 정규화 값 (raw / CSS_MAX * 100) 기준 등급 반환
function csGetGrade(css) {
  if (css >= 75) return "🔥 STRONG BUY"
  if (css >= 55) return "✅ BUY"
  if (css >= 40) return "⚡ WATCH"
  if (css >= 25) return "⚠️ HOLD"
  return "❌ AVOID"
}

async function csGetTop80(env) {
  // S&P500 전종목 사용 (Starter 플랜 + KV 캐시) — Stage1 병렬 처리로 timeout 방지
  const symbols = await getSP500Symbols(env.METRICZ_KV, env.FMP_API_KEY)
  return symbols.map(s => ({ symbol: s }))
}

async function csGetTechnical(symbol, env) {
  const [histRaw, quoteRaw] = await Promise.all([
    fetchFMP(`/stable/historical-price-eod?symbol=${symbol}&limit=150`, env),
    fetchFMP(`/stable/quote?symbol=${symbol}`, env)
  ])

  // FMP 응답 형식 정규화: 직접 배열 or {historical: [...]}
  const hist = Array.isArray(histRaw) ? histRaw
    : (Array.isArray(histRaw?.historical) ? histRaw.historical : null)

  // historical 데이터 부족 시 quote 기반 간이 기술 분석 fallback
  if (!hist || hist.length < 60) {
    const q = Array.isArray(quoteRaw) ? quoteRaw[0] : quoteRaw
    if (!q?.price) return { total: 0 }
    const volRatio = q.volume / (q.avgVolume || q.volume || 1)
    const isBreakout = (q.changePercentage || 0) > 1.5   // fix: changesPercentage → changePercentage
                    && volRatio > 1.5
                    && q.price > (q.priceAvg50 || 0)
    const rsi = 50 // 중립 기본값 (RSI 계산 불가)
    let score = 0
    const ma50 = q.priceAvg50 || 0
    const ma200 = q.priceAvg200 || 0
    if (q.price > ma50) score += 5
    else if (ma50 > 0 && q.price >= ma50 * 0.95) score += 2  // MA50 5%내
    if (q.price > ma200) score += 5
    else if (ma200 > 0 && q.price >= ma200 * 0.93) score += 2  // MA200 7%내
    if (volRatio > 2) score += 6
    else if (volRatio > 1.5) score += 3
    const chgPct = q.changePercentage || 0
    if (chgPct > 1) score += 5
    else if (chgPct > 0) score += 2
    else if (chgPct > -1) score += 1  // 소폭 하락도 부분점수
    if (isBreakout) score += 10
    // 52주 고점 근접 (yearHigh 필드 활용)
    const y52h = q.yearHigh || 0
    if (y52h > 0 && q.price >= y52h * 0.85) score += 5
    else if (y52h > 0 && q.price >= y52h * 0.75) score += 2
    return { rsi, atr_pct: 2, volumeRatio: volRatio, isBreakout, total: Math.min(score, 50) }
  }

  const closes = hist.map(d => d.close).reverse()
  const volumes = hist.map(d => d.volume).reverse()
  const last = closes.length - 1

  const rsiArr = calculateRSI(closes, 14)
  const rsi = rsiArr[last]

  const ema20 = calculateEMA(closes, 20)
  const ema50 = calculateEMA(closes, 50)
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macd = ema12[last] - ema26[last]

  const bb = calculateBollinger(closes, 20)
  const bbWidth = bb.width[last]
  const bbAvg = average(bb.width.slice(-50))

  const { atrPct } = calculateATR(hist)

  const volAvg = average(volumes.slice(-20))
  const volNow = volumes[last]

  const high20 = Math.max(...closes.slice(-20))
  const high60 = Math.max(...closes.slice(-60))

  const isBreakout =
    closes[last] >= high20 * 0.99 &&
    volNow > volAvg * 1.8 &&
    bbWidth < bbAvg * 0.8

  let score = 0
  // MA 위치 (하락장: 부분 점수)
  if (closes[last] > ema20[last]) score += 5
  else if (closes[last] > ema50[last]) score += 2   // EMA20 아래지만 EMA50 위: 부분점수
  if (closes[last] > ema50[last]) score += 5
  else if (closes[last] > ema50[last] * 0.93) score += 2 // EMA50 7%내: 지지선 근접
  // RSI: 30~75 범위로 확대 (하락장 RSI<45도 부분점수)
  if (rsi >= 45 && rsi <= 65) score += 6   // 최적 구간
  else if (rsi >= 30 && rsi < 45) score += 3  // 과매도 → 반등 기대
  else if (rsi > 65 && rsi <= 75) score += 3  // 강한 모멘텀
  // MACD
  if (macd > 0) score += 5
  else if (macd > -(closes[last] * 0.002)) score += 2  // MACD 0 근접 (전환 임박)
  // BB 수축 (변동성 압축 후 폭발 기대)
  if (bbWidth < bbAvg * 0.8) score += 4
  // 거래량 급증
  if (volNow > volAvg * 2) score += 6
  else if (volNow > volAvg * 1.5) score += 3
  // ATR (변동성)
  if (atrPct > 2) score += 3
  else if (atrPct > 1.5) score += 1
  // 돌파 신호
  if (isBreakout) score += 10
  // 52주/60일 고점 근접
  if (closes[last] >= high60 * 0.9) score += 5
  else if (closes[last] >= high60 * 0.8) score += 2

  return { rsi, atr_pct: atrPct, volumeRatio: volNow / volAvg, isBreakout, total: Math.min(score, 50) }
}

async function csGetSmartMoney(symbol, tech, env) {
  const [insider, analyst] = await Promise.all([
    fetchFMP(`/stable/insider-trading?symbol=${symbol}`, env),
    fetchFMP(`/stable/analyst-stock-recommendations?symbol=${symbol}`, env)
  ])

  let insiderScore = 0
  if (insider?.length) {
    let buy = 0, sell = 0
    insider.slice(0, 20).forEach(d => {
      if (d.transactionType === "P") buy++
      if (d.transactionType === "S") sell++
    })
    if (buy > sell * 2) insiderScore = 4
    else if (buy > sell) insiderScore = 2
  }

  let analystScore = 0
  if (analyst?.[0]) {
    const a = analyst[0]
    if (a.strongBuy > 5) analystScore = 4
    else if (a.buy > 5) analystScore = 2
  }

  return { total: insiderScore + analystScore + (tech.isBreakout ? 4 : 1) }
}

async function csGetCatalyst(symbol, env) {
  const [earningsRaw, incomeRaw, ratiosRaw, balanceRaw, cashflowRaw, quoteRaw] = await Promise.all([
    fetchFMP(`/stable/earnings?symbol=${symbol}`, env),
    fetchFMP(`/stable/income-statement?symbol=${symbol}&limit=5`, env),
    fetchFMP(`/stable/ratios-ttm?symbol=${symbol}`, env),
    fetchFMP(`/stable/balance-sheet-statement?symbol=${symbol}&limit=1`, env),
    fetchFMP(`/stable/cash-flow-statement?symbol=${symbol}&limit=1`, env),
    fetchFMP(`/stable/quote?symbol=${symbol}`, env)
  ])

  // 배열/객체 모두 정규화
  const norm = (v) => Array.isArray(v) ? v : (v ? [v] : [])
  const earnings  = norm(earningsRaw)
  const income    = norm(incomeRaw)
  const balance   = norm(balanceRaw)
  const cashflow  = norm(cashflowRaw)
  const quote     = norm(quoteRaw)
  // ratios-ttm은 배열 또는 객체 → 첫 번째 요소로 통일
  const ratios = Array.isArray(ratiosRaw) ? (ratiosRaw[0] || {}) : (ratiosRaw || {})

  // earnings/income 없으면 재무 점수 0으로 반환 (필터 탈락하지 않도록 de/revGrowth 중립값)
  if (!earnings[0]) return { total: 0, de: 1, revGrowth: 0 }

  const epsSurprise = earnings[0].epsActual != null && earnings[0].epsEstimated != null
    ? (earnings[0].epsActual - earnings[0].epsEstimated) / Math.abs(earnings[0].epsEstimated || 1)
    : 0

  const revGrowth = income[0]?.revenue && income[1]?.revenue
    ? (income[0].revenue - income[1].revenue) / Math.abs(income[1].revenue)
    : 0

  const pe = ratios.priceToEarningsRatioTTM || 30

  const fcfYield = cashflow[0]?.freeCashFlow && quote[0]?.marketCap
    ? cashflow[0].freeCashFlow / quote[0].marketCap
    : 0

  const de = balance[0]?.totalDebt && balance[0]?.totalStockholdersEquity
    ? balance[0].totalDebt / balance[0].totalStockholdersEquity
    : 1

  let score = 0
  if (epsSurprise > 0.05) score += 6   // EPS beat > 5%
  if (revGrowth > 0.05) score += 5     // 수익 성장 > 5%
  if (pe < 30) score += 3              // PE < 30
  if (fcfYield > 0.02) score += 3      // FCF 수익률 > 2%
  if (de < 1.0) score += 4             // D/E < 1.0

  return { epsSurprise, revGrowth, fcfYield, de, total: score }
}

function csApplyFilters({ tech, catalyst }) {
  if (tech.rsi > 80 || tech.rsi < 20) return false           // 극단적 과매수/과매도만 제외
  if ((catalyst.de || 0) > 3.0) return false                 // 극단적 레버리지만 제외
  if ((catalyst.revGrowth || 0) < -0.20) return false        // 20% 이상 매출 급감만 제외
  // isBreakout 하드게이트 제거 → 횡보/하락장에서도 분석 가능
  return true
}

async function csGetBacktest(symbol, env) {
  const histRaw = await fetchFMP(`/stable/historical-price-eod?symbol=${symbol}&limit=150`, env)
  const hist = Array.isArray(histRaw) ? histRaw
    : (Array.isArray(histRaw?.historical) ? histRaw.historical : null)
  if (!hist || !hist.length) return { trades: 0, winRate: 0, avgReturn: 0 }

  let wins = 0, total = 0, totalReturn = 0
  for (let i = 100; i < hist.length - 5; i++) {
    const entry = hist[i].close
    const exit = hist[i + 5].close
    const ret = ((exit - entry) / entry) * 100
    totalReturn += ret
    total++
    if (ret > 0) wins++
  }

  return {
    trades: total,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    avgReturn: total > 0 ? totalReturn / total : 0
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const FMP = env.FMP_API_KEY
      const FRED = env.FRED_KEY
      const ITICK = env.ITICK_TOKEN

      // 환경 변수 검증
          // console.log(`🔑 환경변수 확인:`)
          // console.log(`   FMP_API_KEY: ${FMP ? '✅ 설정됨' : '❌ 없음'}`)
          // console.log(`   FRED_KEY: ${FRED ? '✅ 설정됨' : '❌ 없음'}`)
          // console.log(`   ITICK_TOKEN: ${ITICK ? '✅ 설정됨' : '❌ 없음'}`)

      // CORS preflight (POST 엔드포인트용)
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          }
        })
      }

      // URL 파싱
      const url = new URL(request.url)
      const pathname = url.pathname.toLowerCase()
      const action = url.searchParams.get('action')
      const symbol = url.searchParams.get('symbol')
      const series = url.searchParams.get('series')

          // console.log(`📊 요청: pathname="${pathname}", action="${action}", url="${request.url}"`)

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
          // console.log(`📍 FMP API 호출: ${sym}`)
          // console.log(`   🔗 URL: ${url.substring(0, url.lastIndexOf('?'))}`)
          // console.log(`   🔑 API Key: ${FMP ? 'SET' : 'NOT SET'}`)

          const r = await fetch(url, { signal: controller.signal })
          // console.log(`   📊 Status: ${r.status} ${r.statusText}`)
          // console.log(`   Headers: Content-Type=${r.headers.get('content-type')}`)

          if (!r.ok) {
            console.error(`❌ FMP ${sym}: HTTP ${r.status} ${r.statusText}`)
            const errText = await r.text()
            console.error(`   📝 Response Body (first 500 chars):`)
            console.error(`   ${errText.substring(0, 500)}`)
            if (errText.length > 500) console.error(`   ... (${errText.length - 500} more chars)`)
            return null
          }

          const j = await r.json()
          // console.log(`📦 FMP ${sym} 응답:`)
          // console.log(`   Type: ${Array.isArray(j) ? 'Array' : typeof j}`)
          // console.log(`   Length: ${Array.isArray(j) ? j.length : 'N/A'}`)
          if (typeof j === 'object') {
            const keys = Object.keys(j || {})
          // console.log(`   Keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`)
          }
          // console.log(`   Full Response: ${JSON.stringify(j).substring(0, 200)}`)

          // FMP v3/quote는 Array 반환
          if (!j || (Array.isArray(j) && j.length === 0)) {
            console.warn(`⚠️ ${sym}: 응답값 없음 (null 또는 empty array)`)
            return null
          }

          // 응답을 정규화 (Array 또는 Object 모두 처리)
          const quote = Array.isArray(j) ? j[0] : j
          // console.log(`   Quote object keys: ${Object.keys(quote || {}).join(', ')}`)
          // console.log(`   Price value: ${quote?.price}`)

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
            timestamp: quote.timestamp,
            marketCap: quote.marketCap || null // 시가총액 (선택사항)
          }

          // console.log(`✅ ${sym}: price=${normalized.price}, change=${normalized.changePercentage}%`)
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

      // 시가총액 전용 함수 (정확한 marketCap 가져오기)
      async function getMarketCapData(sym, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          // 📍 출처: FMP API /profile (시가총액 정확 데이터)
          const url = `https://financialmodelingprep.com/api/v3/profile/${sym}?apikey=${FMP}`
          const r = await fetch(url, { signal: controller.signal })

          if (!r.ok) {
            console.warn(`⚠️ FMP profile ${sym}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()
          const profile = Array.isArray(data) ? data[0] : data

          if (!profile || !profile.marketCap) {
            console.warn(`⚠️ ${sym}: marketCap 필드 없음`)
            return null
          }

          return {
            symbol: sym,
            marketCap: profile.marketCap  // 정확한 시가총액 (단위: USD)
          }
        } catch (e) {
          console.warn(`⚠️ ${sym} marketCap fetch error: ${e.message}`)
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
          // console.log(`📍 FMP API 호출 (한국): ${fmpSymbol}`)
          // console.log(`   🔗 URL: ${url.substring(0, url.lastIndexOf('?'))}`)

          const r = await fetch(url, { signal: controller.signal })
          // console.log(`   📊 Status: ${r.status} ${r.statusText}`)

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
          // console.log(`✅ FMP 한국 ${fmpSymbol}: price=${result.price}, change=${result.changePercentage}%`)
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
            console.log(`✅ FRED ${series}: ${obs.length}개 데이터포인트`)
          } else {
            console.warn(`⚠️ FRED ${series}: 데이터 없음 (observations=[])`)
          // console.log(`✅ FRED ${series}: ${obs.length} obs, latest=${obs[obs.length-1].value}`)
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
          // console.log(`✅ Yahoo DXY: price=${meta.regularMarketPrice}, change%=${meta.regularMarketChangePercent}`)
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
        "BAMLH0A0HYM2": { divisor: 1, unit: "%" },  // High Yield OAS Spread
        "NAPM": { divisor: 1, unit: "idx" },       // ✅ Manufacturing PMI (index)
        "NAPMNOI": { divisor: 1, unit: "idx" },    // ✅ Services PMI (index)
        "RSAFS": { divisor: 1, unit: "$" },        // ✅ Advance Retail Sales (billions) - YoY 계산용
        // macro-index.html 신규 FRED 지표
        "DFEDTARU": { divisor: 1, unit: "%" },     // Fed 금리 상단
        "DFEDTARL": { divisor: 1, unit: "%" },     // Fed 금리 하단
        "EFFR": { divisor: 1, unit: "%" },          // 실효연방기금금리
        "REAINTRATREARAT10Y": { divisor: 1, unit: "%" }, // 실질 금리 10년물
        "MORTGAGE30US": { divisor: 1, unit: "%" }, // 30년 고정 모기지 금리
        "MICH": { divisor: 1, unit: "%" },          // 기대 인플레이션 (미시간대 1년)
        "IPMAN": { divisor: 1, unit: "idx" },       // 제조업 생산 지수
        "HOUST": { divisor: 1, unit: "K" },         // 신규 주택착공건수 (천 건)
        "DTWEXAFEGS": { divisor: 1, unit: "idx" }, // 달러 인덱스 (FRED)
        "T10Y2Y": { divisor: 1, unit: "%" },        // 장단기 금리차 (10Y-2Y)
        "SAHMREALTIME": { divisor: 1, unit: "%" }, // 샴 법칙 침체 지표
        "CP": { divisor: 1, unit: "B" }             // 기업 이익 (YoY%로 pc1 사용)
      }

      // 📍 Alpha Discovery Engine - 9개 인디케이터 기반 점수 계산
      // 출처: verify-9-indicators.js 검증 로직 (로컬 테스트 통과)

      async function fetchFMP(endpoint, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com${endpoint}&apikey=${FMP}`
          // console.log(`📍 FMP API 호출: ${endpoint}`)
          const r = await fetch(url, { signal: controller.signal })
          // console.log(`   📊 Status: ${r.status}`)

          if (!r.ok) {
            console.error(`❌ FMP ${endpoint}: HTTP ${r.status}`)
            return null
          }

          const data = await r.json()

          // 🔍 DEBUG: 각 API별 응답 확인
          if (endpoint.includes('quote')) {
            console.log(`   📦 quote 응답 형식: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
            if (Array.isArray(data) && data[0]) {
              const quote = data[0]
              const keys = Object.keys(quote)
              console.log(`   📋 quote 필드 수: ${keys.length}`)
              console.log(`   📋 모든 필드: ${keys.join(', ')}`)
              console.log(`   💰 주요값:`)
              console.log(`      price=${quote.price}`)
              console.log(`      pe=${quote.pe}, peRatio=${quote.peRatio}`)
              console.log(`      pb=${quote.pb}, priceToBook=${quote.priceToBook}`)
              console.log(`      dayLow=${quote.dayLow}, dayHigh=${quote.dayHigh}`)
              console.log(`      epsTrailingTwelveMonths=${quote.epsTrailingTwelveMonths}`)
              console.log(`      sector=${quote.sector}, industry=${quote.industry}`)
            }
          } else if (endpoint.includes('key-metrics')) {
            console.log(`   ⚠️  key-metrics 응답 수신 (유료 엔드포인트)`)
          } else if (endpoint.includes('historical')) {
            console.log(`   📦 historical 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
          // console.log(`   📦 quote 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
            if (Array.isArray(data) && data[0]) {
              const quote = data[0]
          // console.log(`   📋 quote 필드: ${Object.keys(quote).slice(0, 30).join(', ')}`)
          // console.log(`   💰 주요값: price=${quote.price}, pe=${quote.pe}, pb=${quote.priceToBook}, epsTrailingTwelveMonths=${quote.epsTrailingTwelveMonths}`)
          // console.log(`   📊 전체: ${JSON.stringify(quote).substring(0, 200)}`)
            }
          } else if (endpoint.includes('key-metrics')) {
          // console.log(`   📦 key-metrics 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
            if (Array.isArray(data) && data[0]) {
              const fields = Object.keys(data[0]).filter(k => k.includes('Ratio') || k.includes('Growth') || k.includes('Cap') || k.includes('Shares'))
          // console.log(`   📋 필드: peRatio=${data[0].peRatio}, priceToBookRatio=${data[0].priceToBookRatio}, floatShares=${data[0].floatShares}`)
          // console.log(`   📈 성장률: revenueGrowth=${data[0].revenueGrowth}, earningsGrowth=${data[0].earningsGrowth}`)
            }
          } else if (endpoint.includes('historical')) {
          // console.log(`   📦 historical 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'} - 최근 3개: ${data.substring ? data : JSON.stringify(data).substring(0, 100)}`)
          } else if (endpoint.includes('insider')) {
          // console.log(`   📦 insider 응답: ${Array.isArray(data) ? `Array[${data.length}]` : 'Object'}`)
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
          // ✅ 필요한 모든 데이터 병렬 호출 (Balance Sheet 추가!)
          const [quoteRes, ratiosRes, growthRes, incomeRes, balanceRes, profileRes] = await Promise.allSettled([
            fetchFMP(`/stable/quote?symbol=${symbol}`),
            getRatios(symbol),
            getFinancialGrowth(symbol),
            getIncomeStatement(symbol),
            getBalanceSheet(symbol),
            getCompanyProfile(symbol)
          ])

          const extract = (r) => r.status === 'fulfilled' ? r.value : null

          const quoteData = extract(quoteRes)
          const quote = quoteData ? (Array.isArray(quoteData) ? quoteData[0] : quoteData) : null

          const ratios = extract(ratiosRes)?.data || extract(ratiosRes)

          const growth = extract(growthRes)
          const income = extract(incomeRes)
          const balance = extract(balanceRes)
          const profile = extract(profileRes)

          console.log(`\n📍 [${symbol}] getAlphaData 결과:`)
          console.log(`   Quote: ${quote ? `✅ price=${quote.price}` : '❌ null'}`)
          console.log(`   Ratios: ${ratios ? `✅ pe=${ratios.priceToEarningsRatio}` : '❌ null'}`)
          console.log(`   Growth: ${growth ? `✅ revGrowth=${growth.revenueGrowth}, epsGrowth=${growth.epsGrowth}` : '❌ null'}`)
          console.log(`   Income: ${income ? `✅ revenue=${income.revenue}` : '❌ null'}`)
          console.log(`   Profile: ${profile ? `✅ sector=${profile.sector}` : '❌ null'}`)

          return {
            quote: quote,
            ratios: ratios,
            growth: growth,
            income: income,
            balance: balance,      // ✅ 추가 (ROE 계산용)
            profile: profile
          }
        } catch (e) {
          console.error(`❌ getAlphaData ${symbol}:`, e.message)
          return null
        }
      }

      function calculateFactors(data) {
        if (!data || !data.quote) return null

        const quote = data.quote
        const ratios = data.ratios
        const growth = data.growth
        const income = data.income
        const balance = data.balance    // ✅ 추가 (ROE 계산용)
        const profile = data.profile

        // 🔍 DEBUG: 실제 API 응답 데이터 확인
        console.log(`\n📊 [${quote?.symbol}] === 📥 입력 데이터 (data 객체) ===`)
        console.log(`Quote fields: ${Object.keys(quote || {}).slice(0,15).join(', ')}`)
        console.log(`Ratios fields: ${Object.keys(ratios || {}).slice(0,10).join(', ')}`)
        console.log(`Growth fields: ${Object.keys(growth || {}).slice(0,10).join(', ')}`)
        console.log(`Income fields: ${Object.keys(income || {}).slice(0,10).join(', ')}`)
        console.log(`Profile fields: ${Object.keys(profile || {}).slice(0,10).join(', ')}`)

        console.log(`\n📊 [${quote?.symbol}] === 🔢 실제 값들 ===`)
        console.log(`Quote: price=${quote?.price}, pe=${quote?.pe}, pb=${quote?.pb}, dayLow=${quote?.dayLow}, dayHigh=${quote?.dayHigh}`)
        console.log(`Ratios: priceToEarningsRatio=${ratios?.priceToEarningsRatio}, priceToBookRatio=${ratios?.priceToBookRatio}`)
        console.log(`Growth: revenueGrowth=${growth?.revenueGrowth}, epsGrowth=${growth?.epsGrowth}, netIncomeGrowth=${growth?.netIncomeGrowth}`)
        console.log(`Income: revenue=${income?.revenue}, netIncome=${income?.netIncome}, grossProfit=${income?.grossProfit}, operatingIncome=${income?.operatingIncome}`)
        console.log(`Profile: sector=${profile?.sector}, industry=${profile?.industry}`)

        // ✅ 기본 정보 (quote에서)
        const price = quote?.price || 0
        const symbol = quote?.symbol || 'N/A'
        const dayLow = quote?.dayLow || price
        const dayHigh = quote?.dayHigh || price

        console.log(`   ✅ 기본정보: price=${price}, dayLow=${dayLow}, dayHigh=${dayHigh}`)

        // ✅ 비율 지표
        // 우선순위: ratios (/fundamentals/ratios) > quote > 기본값
        // ⚠️ 0 값은 무효한 데이터 → null 취급
        const pe = (ratios?.priceToEarningsRatio && ratios.priceToEarningsRatio > 0)
          ? ratios.priceToEarningsRatio
          : (quote?.pe && quote.pe > 0 ? quote.pe : 50)
        const pb = (ratios?.priceToBookRatio && ratios.priceToBookRatio > 0)
          ? ratios.priceToBookRatio
          : (quote?.priceToBook && quote.priceToBook > 0 ? quote.priceToBook : quote?.pb && quote.pb > 0 ? quote.pb : 10)
        // ✅ ROE = Net Income / Shareholders' Equity
        // balance.totalStockholdersEquity 사용 (income에는 없음!)
        const roe = (income && income.netIncome && balance && balance.totalStockholdersEquity && balance.totalStockholdersEquity > 0)
          ? (income.netIncome / balance.totalStockholdersEquity) * 100
          : 15  // 기본값

        console.log(`   📈 PE 로직: ratios.PE=${ratios?.priceToEarningsRatio} → ${pe === ratios?.priceToEarningsRatio ? '✅ ratios 사용' : pe === quote?.pe ? '⚠️ quote 사용' : '❌ 기본값 50'}`)
        console.log(`   📈 PB 로직: ratios.PB=${ratios?.priceToBookRatio} → ${pb === ratios?.priceToBookRatio ? '✅ ratios 사용' : pb === quote?.priceToBook || pb === quote?.pb ? '⚠️ quote 사용' : '❌ 기본값 10'}`)
        console.log(`   ✅ 최종 비율지표: pe=${pe}, pb=${pb}, roe=${roe}`)

        // ✅ 성장률 지표 (Financial Growth API에서 가져옴)
        let revenueGrowth = growth?.revenueGrowth ?? 0
        let epsGrowth = growth?.epsGrowth ?? growth?.earningsGrowth ?? growth?.netIncomeGrowth ?? 0

        console.log(`   📈 Growth 로직:`)
        console.log(`      - revenueGrowth: growth.revenueGrowth=${growth?.revenueGrowth} → 최종값=${revenueGrowth}`)
        console.log(`      - epsGrowth: growth.epsGrowth=${growth?.epsGrowth}, earningsGrowth=${growth?.earningsGrowth}, netIncomeGrowth=${growth?.netIncomeGrowth} → 최종값=${epsGrowth}`)
        console.log(`   ✅ 최종 성장률: revenueGrowth=${revenueGrowth}, epsGrowth=${epsGrowth}`)

        // ✅ 수익성 지표 (Income Statement에서 계산)
        let netMargin = 10    // 기본값
        let grossMargin = 40  // 기본값
        let operatingMargin = 15  // 기본값

        // ✅ null check 강화 - 각 필드별로 체크
        if (income && income.revenue) {
          if (income.netIncome) {
            netMargin = (income.netIncome / income.revenue) * 100
          }
          if (income.grossProfit) {
            grossMargin = (income.grossProfit / income.revenue) * 100
          }
          if (income.operatingIncome) {
            operatingMargin = (income.operatingIncome / income.revenue) * 100
          }
        }

        // ✅ 섹터 정보 (Profile에서)
        const sector = profile?.sector || quote?.sector || 'N/A'

        console.log(`   ✅ 수익성: netMargin=${netMargin.toFixed(2)}%, grossMargin=${grossMargin.toFixed(2)}%`)
        console.log(`   ℹ️  섹터: ${sector}`)

        // ✅ 가격 모멘텀 근사 (dayLow/dayHigh 사용)
        // quote에 dayLow/dayHigh가 없으면 대체 계산 불가능 → 0
        // 하지만 최소한 유효한 값이 있을 때만 계산
        const dailyMomentum = (quote?.dayLow && quote?.dayHigh && dayHigh > dayLow)
          ? (price - dayLow) / dayLow
          : 0

        // ✅ 거래량 (quote에서)
        const volume = quote?.volume || 0

        // ✅ Float 및 Market Cap (quote에서)
        const float = quote?.sharesFloat || quote?.floatShares || null
        const marketCap = quote?.marketCap || null

        return {
          symbol,
          price,
          pe,
          pb,
          roe,
          revenueGrowth,
          epsGrowth,
          profitMargin: netMargin,
          operatingMargin,
          sector,
          momentum: dailyMomentum,
          volume: volume,
          dayLow,
          dayHigh,
          float: float,
          marketCap: marketCap,
          analystScore: 0,
          insiderActivity: 0
        }
      }

      // Explosive Score (100점 만점 정규화)
      function explosiveScore(factors) {
        if (!factors) return 0

        // ✅ 1. 성장률 정규화 (0~100, 상한선 적용)
        // 데이터가 소수점 형태(0.1=10%)일 경우 * 100, 백분율 형태(10)일 경우 그대로 사용
        const normalizeGrowth = (g) => {
          const value = g || 0
          // 소수점 형태 판별: 1보다 작으면 * 100
          const normalized = value < 1 ? value * 100 : value
          return Math.max(0, Math.min(100, normalized))
        }
        const revenueScore = normalizeGrowth(factors.revenueGrowth)
        const epsScore = normalizeGrowth(factors.epsGrowth)

        // ⚠️ 기본값 문제 수정: quote에서만 데이터를 받으므로 profitMargin, roe는 기본값만 존재
        // 따라서 이 점수들은 모든 종목에서 동일
        // 대신 PE, PB, Momentum 점수에 더 큰 가중치를 줌
        const profitScore = Math.min(100, (factors.profitMargin || 10) * 5)
        const roiScore = Math.min(100, (factors.roe || 15) * 5)

        // ✅ 2. 밸류에이션 정규화 (PE/PB 낮을수록 높음, 범위 확장)
        // PE 정규화: PE 10을 100점, PE 50을 0점
        const peScore = Math.max(0, Math.min(100, 100 - (factors.pe || 50) / 0.4))
        // PB 정규화: PB 1을 100점, PB 10을 0점
        const pbScore = Math.max(0, Math.min(100, 100 - (factors.pb || 10) / 0.1))

        // ✅ 3. 모멘텀 정규화 (0~100, 10%를 100점)
        const momentumScore = Math.min(100, Math.max(0, (factors.momentum || 0) * 1000))

        console.log(`   📊 Score 계산 상세:`)
        console.log(`      - Revenue: ${revenueScore.toFixed(1)} (가중 ${(revenueScore*0.15).toFixed(1)})`)
        console.log(`      - EPS:     ${epsScore.toFixed(1)} (가중 ${(epsScore*0.15).toFixed(1)})`)
        console.log(`      - PE:      ${peScore.toFixed(1)} (가중 ${(peScore*0.3).toFixed(1)})`)
        console.log(`      - PB:      ${pbScore.toFixed(1)} (가중 ${(pbScore*0.25).toFixed(1)})`)
        console.log(`      - Momentum:${momentumScore.toFixed(1)} (가중 ${(momentumScore*0.15).toFixed(1)})`)

        // ✅ 최종 점수 (가중합 → 100점 만점)
        // 변경: revenueScore, epsScore 가중치 증가
        //      profitScore, roiScore 제거 (항상 동일한 기본값)
        //      peScore, pbScore, momentumScore 가중치 증가 (quote 필드에서 계산 가능)
        const score =
          revenueScore * 0.15 +        // 수익성장 (15%)
          epsScore * 0.15 +            // EPS성장 (15%)
          peScore * 0.30 +             // PE 가치 (30%) ← 증가
          pbScore * 0.25 +             // PB 가치 (25%) ← 증가
          momentumScore * 0.15         // 모멘텀 (15%) ← 증가
          // profitScore, roiScore 제거 (기본값만 존재해서 모든 종목이 동일)

        return Math.max(0, Math.min(100, score))
      }

      // 9개 인디케이터 기반 Explosive Score 계산 (가중합)
      async function getAlphaScore(symbol) {
        try {
          console.log(`\n🔍 ===== Alpha Score 계산: ${symbol} =====`)

          const data = await getAlphaData(symbol)
          if (!data) {
            console.warn(`⚠️ ${symbol}: getAlphaData() 반환값 null`)
            return null
          }

          console.log(`\n📊 1️⃣ getAlphaData() 결과:`)
          console.log(`   Quote: symbol=${data.quote?.symbol}, price=${data.quote?.price}, pe=${data.quote?.pe}, pb=${data.quote?.pb}`)
          console.log(`   Ratios: pe=${data.ratios?.priceToEarningsRatio}, pb=${data.ratios?.priceToBookRatio}`)
          console.log(`   Growth: revGrowth=${data.growth?.revenueGrowth}, epsGrowth=${data.growth?.epsGrowth}`)
          console.log(`   Income: revenue=${data.income?.revenue}, netIncome=${data.income?.netIncome}`)
          console.log(`   Profile: sector=${data.profile?.sector}`)

          const factors = calculateFactors(data)
          if (!factors) {
            console.warn(`⚠️ ${symbol}: 지표 계산 실패`)
            return null
          }

          console.log(`\n📊 2️⃣ calculateFactors() 결과:`)
          console.log(`   pe=${factors.pe}, pb=${factors.pb}`)
          console.log(`   revenueGrowth=${factors.revenueGrowth}, epsGrowth=${factors.epsGrowth}`)
          console.log(`   profitMargin=${factors.profitMargin}, sector=${factors.sector}`)

          // ✅ Explosive Score 계산 (7개 지표 가중합)
          const score = explosiveScore(factors)

          console.log(`\n📊 3️⃣ explosiveScore() 결과: ${score.toFixed(2)}`)

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
              earningsGrowth: factors.epsGrowth,
              analystScore: factors.analystScore,
              insiderActivity: factors.insiderActivity
            },
            metrics: {
              momentum: parseFloat((factors.momentum || 0).toFixed(4)),
              volume: factors.volume ? parseFloat(factors.volume.toFixed(2)) : 0
            },
            profile: {
              company: factors.symbol,
              sector: factors.sector || data.quote?.sector || null,
              industry: data.quote?.industry || null
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
          // console.log(`📍 FMP Earnings 호출: ${symbol}`)

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
          // console.log(`📍 FMP Financial Growth 호출: ${symbol}`)

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
            // ✅ FMP API는 camelCase만 지원 (소문자 fallback 제거)
            revenueGrowth: growth.revenueGrowth || null,
            netIncomeGrowth: growth.netIncomeGrowth || null,
            // ⚠️ epsGrowth가 없을 수 있음 → earningsGrowth, netIncomeGrowth로 대체
            epsGrowth: growth.epsGrowth || growth.earningsGrowth || growth.netIncomeGrowth || null,
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
          // console.log(`📍 FMP Income Statement 호출: ${symbol}`)

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
          // console.log(`📍 FMP Balance Sheet 호출: ${symbol}`)

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
            accountPayables: balance.accountPayables || null,
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
          // console.log(`📍 FMP Cash Flow 호출: ${symbol}`)

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
          // 📍 출처: FMP API /stable/ratios (무료 플랜 동작 확인)
          // ✅ /fundamentals/ratios는 작동 안함 → /stable/ratios 사용
          const url = `https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&apikey=${FMP}`
          // console.log(`📍 FMP Ratios 호출: ${symbol}`)

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
            data: {
              symbol: symbol,
              // ✅ 0은 invalid 데이터 → null로 처리
              priceToEarningsRatio: (ratios.priceToEarningsRatio && ratios.priceToEarningsRatio > 0) ? ratios.priceToEarningsRatio
                                  : (ratios.peRatio            && ratios.peRatio > 0)             ? ratios.peRatio
                                  : null,
              priceToBookRatio: (ratios.priceToBookRatio && ratios.priceToBookRatio > 0) ? ratios.priceToBookRatio : null,
              // ✅ 추가 필드들 (fallback용)
              pe: (ratios.pe && ratios.pe > 0) ? ratios.pe : null,
              pb: (ratios.pb && ratios.pb > 0) ? ratios.pb : null,
              divYield: ratios.dividendYield || null,
              timestamp: new Date().toISOString()
            }
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
          // console.log(`📍 FMP Company Profile 호출: ${symbol}`)

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
          // console.log(`📍 FMP Shares Float 호출: ${symbol}`)

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
          // console.log("📦 캐시 사용 (경과: " + (now - cacheTimestamp) + "ms)")
          return cachedMarketData
        }

          // console.log("🔄 신규 API 호출")
        cachedMarketData = await getMarketData()
        cacheTimestamp = now
        return cachedMarketData
      }

      // Helper functions to extract dates and values from FRED observations
      function getDates(fredArray) {
        if (!fredArray || !Array.isArray(fredArray) || fredArray.length === 0) {
          console.warn('⚠️ getDates: 입력이 비어있거나 배열이 아님', fredArray)
          return []
        }
        const dates = fredArray.map(obs => obs?.date).filter(d => d)
        console.log(`✅ getDates: ${dates.length}개 데이터포인트 추출`)
        return dates
      }

      function getValues(fredArray) {
        if (!fredArray || !Array.isArray(fredArray) || fredArray.length === 0) {
          console.warn('⚠️ getValues: 입력이 비어있거나 배열이 아님', fredArray)
          return []
        }
        const values = fredArray
          .map(obs => {
            const val = obs?.value
            if (val && val !== '.' && val !== '') {
              const num = parseFloat(val)
              return isNaN(num) ? null : num
            }
            return null
          })
          .filter(v => v !== null)
        console.log(`✅ getValues: ${values.length}개 데이터포인트 추출`)
        return values
      }

      // Build economic indicators object with historical dates and values for charting
      function buildEconomicIndicators(
        fedfunds, cpiYoyData, coreCpiYoyData, pcepilfe,
        payems, unrate, dgs10, dgs2, umcsent, mfgPmi
      ) {
        // Helper to get latest value
        const getLast = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : null
        const getSecondLast = (arr) => arr && arr.length > 1 ? arr[arr.length - 2] : null

        // Extract dates and values
        const fedDates = getDates(fedfunds)
        const fedValues = getValues(fedfunds)
        const cpiDates = getDates(cpiYoyData)
        const cpiValues = getValues(cpiYoyData)
        const coreCpiDates = getDates(coreCpiYoyData)
        const coreCpiValues = getValues(coreCpiYoyData)
        const pcepilDates = getDates(pcepilfe)
        const pcepilValues = getValues(pcepilfe)
        const payemsDates = getDates(payems)
        const payemsValues = getValues(payems)
        const unrateDates = getDates(unrate)
        const unrateValues = getValues(unrate)
        const dgs10Dates = getDates(dgs10)
        const dgs10Values = getValues(dgs10)
        const dgs2Dates = getDates(dgs2)
        const dgs2Values = getValues(dgs2)
        const umsentDates = getDates(umcsent)
        const umsentValues = getValues(umcsent)
        const mfgPmiDates = getDates(mfgPmi)
        const mfgPmiValues = getValues(mfgPmi)

        // Calculate spread (10Y - 2Y)
        const spreadDates = dgs10Dates
        const spreadValues = dgs10Values.map((val, idx) => {
          const dgs2Val = dgs2Values[idx]
          return val && dgs2Val ? parseFloat((val - dgs2Val).toFixed(3)) : null
        }).filter(v => v !== null)

        return {
          fedfunds: {
            label: 'Fed Funds Rate',
            icon: '📊',
            unit: '%',
            freq: 'Daily',
            isHighGood: false,
            threshold: 2.0,
            color: '#FF6B6B',
            current: getLast(fedValues),
            prev: getSecondLast(fedValues),
            change: (getLast(fedValues) && getSecondLast(fedValues))
              ? parseFloat((getLast(fedValues) - getSecondLast(fedValues)).toFixed(3))
              : null,
            dates: fedDates,
            values: fedValues
          },
          cpi: {
            label: 'CPI YoY',
            icon: '📈',
            unit: '%',
            freq: 'Monthly',
            isHighGood: false,
            threshold: 2.0,
            color: '#FF8C42',
            current: getLast(cpiValues),
            prev: getSecondLast(cpiValues),
            change: (getLast(cpiValues) && getSecondLast(cpiValues))
              ? parseFloat((getLast(cpiValues) - getSecondLast(cpiValues)).toFixed(3))
              : null,
            dates: cpiDates,
            values: cpiValues
          },
          core_cpi: {
            label: 'Core CPI YoY',
            icon: '📊',
            unit: '%',
            freq: 'Monthly',
            isHighGood: false,
            threshold: 2.0,
            color: '#4ECDC4',
            current: getLast(coreCpiValues),
            prev: getSecondLast(coreCpiValues),
            change: (getLast(coreCpiValues) && getSecondLast(coreCpiValues))
              ? parseFloat((getLast(coreCpiValues) - getSecondLast(coreCpiValues)).toFixed(3))
              : null,
            dates: coreCpiDates,
            values: coreCpiValues
          },
          core_pce: {
            label: 'Core PCE YoY',
            icon: '💰',
            unit: '%',
            freq: 'Monthly',
            isHighGood: false,
            threshold: 2.0,
            color: '#95E1D3',
            current: getLast(pcepilValues),
            prev: getSecondLast(pcepilValues),
            change: (getLast(pcepilValues) && getSecondLast(pcepilValues))
              ? parseFloat((getLast(pcepilValues) - getSecondLast(pcepilValues)).toFixed(3))
              : null,
            dates: pcepilDates,
            values: pcepilValues
          },
          payems: {
            label: 'Nonfarm Payrolls',
            icon: '👥',
            unit: 'K',
            freq: 'Monthly',
            isHighGood: true,
            threshold: 150000,
            color: '#38B6FF',
            current: getLast(payemsValues),
            prev: getSecondLast(payemsValues),
            change: (getLast(payemsValues) && getSecondLast(payemsValues))
              ? parseFloat((getLast(payemsValues) - getSecondLast(payemsValues)).toFixed(0))
              : null,
            dates: payemsDates,
            values: payemsValues
          },
          unrate: {
            label: 'Unemployment Rate',
            icon: '📉',
            unit: '%',
            freq: 'Monthly',
            isHighGood: false,
            threshold: 4.0,
            color: '#FF6B9D',
            current: getLast(unrateValues),
            prev: getSecondLast(unrateValues),
            change: (getLast(unrateValues) && getSecondLast(unrateValues))
              ? parseFloat((getLast(unrateValues) - getSecondLast(unrateValues)).toFixed(3))
              : null,
            dates: unrateDates,
            values: unrateValues
          },
          dgs10: {
            label: '10Y Treasury Yield',
            icon: '📊',
            unit: '%',
            freq: 'Daily',
            isHighGood: false,
            threshold: 3.0,
            color: '#FFD93D',
            current: getLast(dgs10Values),
            prev: getSecondLast(dgs10Values),
            change: (getLast(dgs10Values) && getSecondLast(dgs10Values))
              ? parseFloat((getLast(dgs10Values) - getSecondLast(dgs10Values)).toFixed(3))
              : null,
            dates: dgs10Dates,
            values: dgs10Values
          },
          spread: {
            label: 'Yield Curve (10Y-2Y)',
            icon: '📈',
            unit: '%',
            freq: 'Daily',
            isHighGood: true,
            threshold: 0.0,
            color: '#6BCB77',
            current: getLast(spreadValues),
            prev: getSecondLast(spreadValues),
            change: (getLast(spreadValues) && getSecondLast(spreadValues))
              ? parseFloat((getLast(spreadValues) - getSecondLast(spreadValues)).toFixed(3))
              : null,
            dates: spreadDates,
            values: spreadValues
          },
          umcsent: {
            label: 'Consumer Sentiment',
            icon: '😊',
            unit: 'idx',
            freq: 'Monthly',
            isHighGood: true,
            threshold: 65.0,
            color: '#A8E6CF',
            current: getLast(umsentValues),
            prev: getSecondLast(umsentValues),
            change: (getLast(umsentValues) && getSecondLast(umsentValues))
              ? parseFloat((getLast(umsentValues) - getSecondLast(umsentValues)).toFixed(2))
              : null,
            dates: umsentDates,
            values: umsentValues
          },
          mfg_pmi: {
            label: 'Manufacturing PMI',
            icon: '🔧',
            unit: '',
            freq: 'Monthly',
            isHighGood: true,
            threshold: 50.0,
            color: '#14b8a6',
            current: getLast(mfgPmiValues),
            prev: getSecondLast(mfgPmiValues),
            change: (getLast(mfgPmiValues) && getSecondLast(mfgPmiValues))
              ? parseFloat((getLast(mfgPmiValues) - getSecondLast(mfgPmiValues)).toFixed(2))
              : null,
            dates: mfgPmiDates,
            values: mfgPmiValues
          },
          // ── debug dashboard 기대 키 별칭 (widgetcheck.html ECON_IND 필드명 호환) ──
          payrolls: {
            label: 'Nonfarm Payrolls',
            icon: '👥',
            unit: 'K',
            current: getLast(payemsValues),
            prev: getSecondLast(payemsValues),
            change: (getLast(payemsValues) && getSecondLast(payemsValues))
              ? parseFloat((getLast(payemsValues) - getSecondLast(payemsValues)).toFixed(0))
              : null
          },
          unemployment: {
            label: 'Unemployment Rate',
            icon: '📉',
            unit: '%',
            current: getLast(unrateValues),
            prev: getSecondLast(unrateValues),
            change: (getLast(unrateValues) && getSecondLast(unrateValues))
              ? parseFloat((getLast(unrateValues) - getSecondLast(unrateValues)).toFixed(3))
              : null
          },
          us10y: {
            label: '10Y Treasury Yield',
            icon: '📊',
            unit: '%',
            current: getLast(dgs10Values),
            prev: getSecondLast(dgs10Values),
            change: (getLast(dgs10Values) && getSecondLast(dgs10Values))
              ? parseFloat((getLast(dgs10Values) - getSecondLast(dgs10Values)).toFixed(3))
              : null
          },
          us2y: {
            label: '2Y Treasury Yield',
            icon: '📊',
            unit: '%',
            current: getLast(dgs2Values),
            prev: getSecondLast(dgs2Values),
            change: (getLast(dgs2Values) && getSecondLast(dgs2Values))
              ? parseFloat((getLast(dgs2Values) - getSecondLast(dgs2Values)).toFixed(3))
              : null
          },
          sentiment: {
            label: 'Consumer Sentiment',
            icon: '😊',
            unit: 'idx',
            current: getLast(umsentValues),
            prev: getSecondLast(umsentValues),
            change: (getLast(umsentValues) && getSecondLast(umsentValues))
              ? parseFloat((getLast(umsentValues) - getSecondLast(umsentValues)).toFixed(2))
              : null
          },
          pmi: {
            label: 'Manufacturing PMI',
            icon: '🔧',
            unit: '',
            current: getLast(mfgPmiValues),
            prev: getSecondLast(mfgPmiValues),
            change: (getLast(mfgPmiValues) && getSecondLast(mfgPmiValues))
              ? parseFloat((getLast(mfgPmiValues) - getSecondLast(mfgPmiValues)).toFixed(2))
              : null
          },
        }
      }

      async function getMarketData() {
          // console.log("🔄 모든 시장 데이터 API 호출 시작...")
          // console.log(`📍 환경: FMP=${FMP ? '✅' : '❌'}, FRED=${FRED ? '✅' : '❌'}`)

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
          yahooFinanceDXY(),  // 달러 인덱스 DXY (Yahoo Finance DX-Y.NYB)
          // ISM PMI & Retail (FRED에서 가져오기)
          fredGet("NAPM"),     // ✅ Manufacturing PMI (NAPM)
          // macro-index.html 용 신규 FRED 지표
          fredGet("DFEDTARU"),             // 1-1) Fed 금리 상단 (lin)
          fredGet("DFEDTARL"),             // 1-2) Fed 금리 하단 (lin)
          fredGet("EFFR"),                 // 1-3) 실효연방기금금리 (lin)
          fredGet("REAINTRATREARAT10Y"),    // 1-6) 실질 금리 10년물 (lin)
          fredGet("MORTGAGE30US"),         // 1-7) 30년 고정 모기지 금리 (lin)
          fredGet("MICH"),                 // 2-4) 기대 인플레이션 미시간대 1년 (lin)
          fredGet("PCEPILFE", "pc1"),      // 2-3) 근원 PCE YoY% (pc1)
          fredGet("PAYEMS", "chg"),        // 3-3) 비농업 고용 전월 대비 변화 (chg)
          fredGet("IPMAN"),                // 3-5) 제조업 생산 지수 (lin)
          fredGet("HOUST"),                // 3-6) 신규 주택착공건수 (lin)
          fredGet("DTWEXAFEGS"),           // 4-3) 달러 인덱스 FRED (lin)
          fredGet("M2SL", "pc1"),          // 4-2) M2 YoY% (pc1)
          fredGet("T10Y2Y"),               // 5-1) 장단기 금리차 FRED (lin)
          fredGet("SAHMREALTIME"),         // 5-2) 샴 법칙 침체 지표 (lin)
          fredGet("CP", "pc1")             // 5-4) 기업 이익 YoY% (pc1)
        ])

        // allSettled 결과에서 fulfilled된 것만 추출
        const extract = (result) => result.status === 'fulfilled' ? result.value : null
        const [spy, qqq, dia, soxx, iwm, vix, hyg, lqd, vti, tlt, xlk, xlf, xle, xlv, xly, xli, xlu, xlre, ewy, btc, eth, sol, fed, rp, dgs10, dgs2, cpi, unrate, umcsent, gdpc1, indpro, payems, pcepilfe, tga, m2sl, t10yie, fedfunds, coreCpiYoyData, cpiYoyData, pcepi, vixcls, hyOas, goldQ, silverQ, oilQ, usdKrwQ, usdJpyQ, eurUsdQ, dxyQ, mfgPmi, dfedtaru, dfedtarl, effr, reaintrate, mortgage30, mich, pcepilfeYoy, payemsChg, ipman, houst, dtwexafegs, m2slYoy, t10y2y, sahmrealtime, cpYoy] = results.map(extract)

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

        // macro-index.html 용 신규 FRED 지표 처리
        const dfedtaruVal = getLatestValue(dfedtaru)      // Fed 금리 상단 (%)
        const dfedtarlVal = getLatestValue(dfedtarl)      // Fed 금리 하단 (%)
        const effrVal = getLatestValue(effr)              // 실효연방기금금리 (%)
        const reaintrateVal = getLatestValue(reaintrate)  // 실질 금리 10년물 (%)
        const mortgage30Val = getLatestValue(mortgage30)  // 30년 고정 모기지 금리 (%)
        const michVal = getLatestValue(mich)              // 기대 인플레이션 미시간대 1년 (%)
        const pcepilfeYoyVal = getLatestValue(pcepilfeYoy) // 근원 PCE YoY% (pc1)
        const payemsChgVal = getLatestValue(payemsChg)   // 비농업 고용 전월 대비 변화 (chg)
        const ipmanVal = getLatestValue(ipman)            // 제조업 생산 지수
        const houstVal = getLatestValue(houst)            // 신규 주택착공건수 (K)
        const dtwexafegsVal = getLatestValue(dtwexafegs)  // 달러 인덱스 FRED
        const m2slYoyVal = getLatestValue(m2slYoy)        // M2 YoY% (pc1)
        const t10y2yVal = getLatestValue(t10y2y)          // 장단기 금리차 (10Y-2Y)
        const sahmVal = getLatestValue(sahmrealtime)      // 샴 법칙 침체 지표
        const cpYoyVal = getLatestValue(cpYoy)            // 기업 이익 YoY% (pc1)

        // EWY 가격 처리
        const ewyPrice = ewy?.price
        const ewyChange = ewy?.changePercentage

        // Build economic indicators with historical dates and values
        const economicIndicators = buildEconomicIndicators(
          fedfunds, cpiYoyData, coreCpiYoyData, pcepilfe,
          payems, unrate, dgs10, dgs2, umcsent, mfgPmi
        )

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
          // ETF Smart Money - Volume (거래량)
          spyVolume: spy?.volume,
          qqqVolume: qqq?.volume,
          iwmVolume: iwm?.volume,
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
            PCE_INFLATION: pcepilfeVal,
            MFG_PMI: convertFredValue("NAPM", getLatestValue(mfgPmi))      // ✅ Manufacturing PMI (출처: FRED NAPM)
          },
          // Economic Indicators with historical chart data (dates + values)
          ECONOMIC_INDICATORS: economicIndicators,
          // macro-index.html 용 MACRO_INDEX 데이터 (5개 카테고리)
          MACRO_INDEX: {
            // 1. 통화 정책 및 시장 금리
            RATES: {
              FED_UPPER: dfedtaruVal,       // DFEDTARU (lin)
              FED_LOWER: dfedtarlVal,       // DFEDTARL (lin)
              EFFR: effrVal,               // EFFR (lin)
              US10Y: us10y,                // DGS10 (lin)
              US2Y: us2y,                  // DGS2 (lin)
              REAL_RATE_10Y: reaintrateVal, // REAINTRATREARAT10Y (lin)
              MORTGAGE30: mortgage30Val    // MORTGAGE30US (lin)
            },
            // 2. 물가 및 인플레이션
            INFLATION: {
              CPI_YOY: cpiYoY,             // CPIAUCSL (pc1)
              CORE_CPI_YOY: coreCpiYoY,    // CPILFESL (pc1)
              CORE_PCE_YOY: pcepilfeYoyVal, // PCEPILFE (pc1)
              INFLATION_EXPECTATION_1Y: michVal // MICH (lin)
            },
            // 3. 고용 및 실물 경제 성장
            ECONOMY: {
              REAL_GDP: gdpVal,                  // GDPC1 (lin)
              UNEMPLOYMENT: unrateVal,           // UNRATE (lin)
              PAYEMS_CHG: payemsChgVal,          // PAYEMS (chg)
              INDUSTRIAL_PRODUCTION: indproVal,  // INDPRO (lin)
              MFG_PRODUCTION: ipmanVal,          // IPMAN (lin)
              HOUSING_STARTS: houstVal,          // HOUST (lin)
              CONSUMER_SENTIMENT: umsentVal      // UMCSENT (lin)
            },
            // 4. 시장 유동성 및 통화
            LIQUIDITY: {
              FED_BALANCE: fedVal,              // WALCL (lin, T단위)
              M2_YOY: m2slYoyVal,              // M2SL (pc1)
              DOLLAR_INDEX: dtwexafegsVal,     // DTWEXAFEGS (lin)
              REVERSE_REPO: rpVal,             // RRPONTSYD (lin, B단위)
              TGA: tgaRawVal ? parseFloat((tgaRawVal / 1000000).toFixed(3)) : null // WTREGEN (T단위)
            },
            // 5. 경기 침체 및 신용 위험
            RISK: {
              YIELD_CURVE: t10y2yVal,          // T10Y2Y (lin)
              SAHM_RULE: sahmVal,              // SAHMREALTIME (lin)
              HY_SPREAD: hyOasVal,             // BAMLH0A0HYM2 (lin)
              CORP_PROFITS_YOY: cpYoyVal       // CP (pc1)
            }
          }
        }
      }

      // ── /metricz-all: KV 캐시 기반 퀀트 스코어링 ──────────────────────────
      // POST { userLogic: [{ metric, weight }] }
      // → KV에서 180종목 데이터 로드 → 퍼센타일 스코어링 → 내림차순 반환
      // KV 미준비 시 SP500_UNIVERSE 중 40종목 실시간 폴백
      async function getMetriczAll(request) {
        let body
        try { body = await request.json() } catch(e) { return { error: 'Invalid JSON body' } }
        const { userLogic } = body || {}
        if (!Array.isArray(userLogic) || userLogic.length === 0) {
          return { error: 'userLogic array is required' }
        }

        // 1️⃣ KV에서 캐시 로드
        let stocksArray = null
        let cacheInfo   = { source: 'kv', timestamp: null, count: 0 }
        const kv = env.METRICZ_KV

        if (kv) {
          try {
            const cached = await kv.get(METRICZ_KV_KEY)
            if (cached) {
              const parsed = JSON.parse(cached)
              stocksArray  = Object.values(parsed.stocks || {})
              cacheInfo    = { source: 'kv', timestamp: parsed.timestamp, count: stocksArray.length }
            }
          } catch(e) {
            console.warn('⚠️ KV 읽기 실패, 실시간 폴백:', e.message)
          }
        }

        // 2️⃣ KV 없으면 상위 30종목 실시간 폴백 (wave당 8×3=24 calls, 300ms 딜레이)
        if (!stocksArray || stocksArray.length === 0) {
          const FALLBACK = SP500_UNIVERSE.slice(0, 30)
          const results = await batchProcess(FALLBACK, 8, sym => fetchAllMetricz(sym, FMP), 300)
          stocksArray = results
            .map((r, i) => r.status === 'fulfilled' ? r.value : { symbol: FALLBACK[i], name: FALLBACK[i] })
            .filter(Boolean)
          cacheInfo = { source: 'live_fallback', timestamp: new Date().toISOString(), count: stocksArray.length }
        }

        // 3️⃣ 스코어링 및 반환
        const scored = metriczScore(stocksArray, userLogic)
        scored.sort((a, b) => b.score - a.score)

        return {
          cache:    cacheInfo,
          universe: stocksArray.length,
          results:  scored,
        }
      }

      // ── /macroindex: macro-index.html 용 FRED 시계열 (기본 3년) ──────────
      async function getMacroIndexHistory(reqUrl) {
        // obs_start 파라미터 (기본: 3년 전)
        const startParam = reqUrl.searchParams.get('start')
        let obsStart = startParam
        if (!obsStart) {
          const d = new Date()
          d.setFullYear(d.getFullYear() - 3)
          obsStart = d.toISOString().split('T')[0]
        }

        // [code, units, divisor]  divisor: 1 = 그대로, 1e6 = millions→T, 1e3 = millions→B
        const SERIES = [
          // 1. 통화 정책 및 시장 금리
          ['DFEDTARU',           'lin', 1],
          ['DFEDTARL',           'lin', 1],
          ['EFFR',               'lin', 1],
          ['DGS10',              'lin', 1],
          ['DGS2',               'lin', 1],
          ['REAINTRATREARAT10Y', 'lin', 1],
          ['MORTGAGE30US',       'lin', 1],
          // 2. 물가 및 인플레이션
          ['CPIAUCSL',           'pc1', 1],
          ['CPILFESL',           'pc1', 1],
          ['PCEPILFE',           'pc1', 1],
          ['MICH',               'lin', 1],
          // 3. 경제 성장
          ['GDP',                'lin', 1],   // 명목 GDP (billions current $) — GDPC1은 실질GDP
          ['UNRATE',             'lin', 1],
          ['PAYEMS',             'chg', 1],   // 월간 변화 (thousands)
          ['INDPRO',             'lin', 1],
          ['IPMAN',              'lin', 1],
          ['HOUST',              'lin', 1],
          ['UMCSENT',            'lin', 1],
          // 4. 유동성
          ['WALCL',              'lin', 1e6], // millions → T
          ['M2SL',               'pc1', 1],
          ['DTWEXAFEGS',         'lin', 1],
          ['RRPONTSYD',          'lin', 1e3], // millions → B
          ['WTREGEN',            'lin', 1e6], // millions → T
          // 5. 리스크
          ['T10Y2Y',             'lin', 1],
          ['SAHMREALTIME',       'lin', 1],
          ['BAMLH0A0HYM2',       'lin', 1],
          ['CP',                 'pc1', 1],
        ]

        // 병렬 FRED 호출 (observation_start 포함 → 3년치만 요청, 응답 수십배 축소)
        // fredGet 대신 직접 URL 빌드: 전체 히스토리 호출 시 일별 시리즈 수만 관측치 반환 → Worker 타임아웃 원인
        async function fredHistGet(series, units) {
          const ctrl  = new AbortController()
          const timer = setTimeout(() => ctrl.abort(), 12000)
          try {
            const unitsParam = (units && units !== 'lin') ? `&units=${units}` : ''
            const u = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED}&file_type=json&observation_start=${obsStart}${unitsParam}`
            const r = await fetch(u, { signal: ctrl.signal })
            if (!r.ok) return []
            const j = await r.json()
            return j.observations || []
          } catch(e) {
            return []
          } finally {
            clearTimeout(timer)
          }
        }

        const results = await Promise.allSettled(
          SERIES.map(([code, units]) => fredHistGet(code, units))
        )

        const out = { timestamp: new Date().toISOString() }

        SERIES.forEach(([code, , divisor], i) => {
          const obs = results[i].status === 'fulfilled' ? results[i].value : []
          // obsStart 이후 데이터만 필터 + '.' 값 제거
          const filtered = obs.filter(o => o.date >= obsStart && o.value !== '.' && o.value !== '')
          const dates  = filtered.map(o => o.date)
          const values = filtered.map(o => {
            const raw = parseFloat(o.value)
            return divisor !== 1 ? parseFloat((raw / divisor).toFixed(4)) : raw
          })
          const latest = values.length ? values[values.length - 1] : null
          const prev   = values.length > 1 ? values[values.length - 2] : null
          out[code] = {
            value:  latest,
            change: (latest !== null && prev !== null) ? parseFloat((latest - prev).toFixed(4)) : null,
            dates,
            values,
          }
        })

        return out
      }

      // 1. Institutional Market Score
      async function getInstitutionalScore() {
        const data = await getMarketDataCached()
        const liquidityScore = (data.fed && data.fed > 7) ? 18 : 15
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
          recommendation: regime === "Risk-On" ? "적극 투자" : regime === "Risk-Off" ? "현금 보유" : "균형형",
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
        const liquidityScore = (data.fed > 7) ? 85 : (data.fed > 6) ? 70 : 50

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
        const gdp = data.MACRO_INDICATORS?.REAL_GDP
        const indpro = data.MACRO_INDICATORS?.INDUSTRIAL_PRODUCTION
        const cpi = data.MACRO_BASE?.CPI_YOY
        const inflation_exp = data.MACRO_BASE?.INFLATION_EXPECTATION

        const growthScore = gdp > 2 ? 80 : gdp > 1 ? 60 : 30
        const inflationScore = cpi < 3 ? 80 : cpi < 4 ? 60 : 30
        const combinedScore = (growthScore + inflationScore) / 2

        return {
          timestamp: new Date().toISOString(),
          dataType: "macro_momentum",
          score: Math.round(combinedScore),
          signal: combinedScore > 70 ? "🚀 강한 성장" : combinedScore > 50 ? "📈 중간" : "📉 약한",
          components: [
            { name: '실질 GDP', value: gdp, unit: '%', score: growthScore },
            { name: '산업생산', value: indpro, unit: 'idx', score: growthScore },
            { name: 'CPI YoY', value: cpi, unit: '%', score: inflationScore },
            { name: '기대인플레', value: inflation_exp, unit: '%' }
          ],
          regime: combinedScore > 70 ? "고성장 저인플레" : combinedScore > 50 ? "중성장 중인플레" : "저성장 고인플레",
          recommendation: combinedScore > 70 ? "성장주/주식 선호" : combinedScore > 50 ? "밸런스형" : "안전자산 선호"
        }
      }

      // =============================
      // S&P 500 TOP 90 UNIVERSE
      // =============================
      async function getHedgeFundUniverse() {
        // S&P500 전종목 (FMP constituent API → KV 캐시 → fallback: 180종목)
        return getSP500Symbols(env.METRICZ_KV, FMP)
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
          // console.log(`📊 Alpha Discovery: ${universe.length}개 종목 분석 시작`)

          const results = []
          const startTime = Date.now()

          // ✅ API 최적화: 90개 종목 × 2개 API = 180 요청/일 (제한: 250/일)
          for (let i = 0; i < Math.min(universe.length, singleSymbol ? 1 : 90); i++) {
            const symbol = universe[i]
            try {
              const data = await getAlphaData(symbol)
              if (!data) continue

              const factors = calculateFactors(data)
              if (!factors) continue

              // ✅ 최적화: momentum/volume 계산 제거
              const score = explosiveScore(factors)

              results.push({
                symbol,
                score: parseFloat(score.toFixed(2)),
                price: parseFloat(factors.price.toFixed(2)),
                pe: parseFloat(factors.pe.toFixed(2)),
                pb: parseFloat(factors.pb.toFixed(2)),
                roe: parseFloat(factors.roe.toFixed(2)),
                debtToEquity: parseFloat(factors.debtToEquity.toFixed(2)),
                sector: factors.sector,
                revenueGrowth: parseFloat(factors.revenueGrowth.toFixed(4)),
                epsGrowth: parseFloat(factors.epsGrowth.toFixed(4)),
                profitMargin: parseFloat(factors.profitMargin.toFixed(2)),
                operatingMargin: parseFloat(factors.operatingMargin.toFixed(2)),
                momentum: parseFloat((factors.momentum * 100).toFixed(2))
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
          const top20 = results.slice(0, 20)  // ✅ top_20 정의 추가

          const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
          // console.log(`✅ Alpha Discovery 완료: ${results.length}개 종목, ${elapsedTime}초`)

          return {
            timestamp: new Date().toISOString(),
            dataType: "alpha_discovery",
            universe_size: universe.length,
            analyzed: results.length,
            execution_time_sec: parseFloat(elapsedTime),
            top_20: top20
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

      // =============================
      // BREAKOUT DISCOVERY ENGINE
      // 📍 단기 돌파 후보 발굴 (1~3주, 목표 20%)
      // 출처: FMP API /stable/quote (무료 플랜)
      // =============================

      async function getFullQuote(sym, timeoutMs = 10000) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const url = `https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${FMP}`
          const r = await fetch(url, { signal: controller.signal })
          if (!r.ok) return null
          const j = await r.json()
          if (!j || (Array.isArray(j) && j.length === 0)) return null
          const q = Array.isArray(j) ? j[0] : j
          if (!q || !q.price) return null
          return q
        } catch (e) {
          return null
        } finally {
          clearTimeout(timeout)
        }
      }

      // calculateBreakoutScore → module-level 함수 사용 (클로저 범위에서도 접근 가능)

      async function runBreakoutDiscovery() {
        try {
          // KV 캐시 확인 (8h TTL) — 히트 시 즉시 반환
          const kv = env.METRICZ_KV
          if (kv) {
            try {
              const cached = await kv.get(BREAKOUT_KV_KEY)
              if (cached) {
                const parsed = JSON.parse(cached)
                const ageMs = Date.now() - new Date(parsed.timestamp).getTime()
                if (ageMs < 8 * 3600 * 1000) {
                  console.log(`✅ Breakout KV 캐시 히트 (${(ageMs/60000).toFixed(0)}분 전 갱신)`)
                  return parsed
                }
              }
            } catch(e) { console.warn('⚠️ Breakout KV 읽기 실패:', e.message) }
          }
          // 캐시 만료/없음: module-level refreshBreakoutCache로 갱신
          return await refreshBreakoutCache(env)
        } catch (e) {
          console.error(`❌ runBreakoutDiscovery:`, e.message)
          return { timestamp: new Date().toISOString(), dataType: 'breakout_discovery', error: e.message, top_15: [] }
        }
      }

      // =============================
      // ALPHA SCANNER ENGINE (헤지펀드급 7-모듈 스코어링)
      // 📍 단기 알파: S&P500 Top 80, 1~3주, 목표 20%
      // 데이터 소스: FMP fundamentals + FRED macro
      // =============================

      // 1️⃣ Earnings Momentum Score (25%)
      function calcEarningsMomentum(earnings, growth) {
        if (!earnings) return { score: 0, epsSurprise: null, revSurprise: null }
        let score = 0
        const epsA = earnings.epsActual
        const epsE = earnings.epsEstimated
        const revA = earnings.revenueActual
        const revE = earnings.revenueEstimated

        // EPS Surprise
        let epsSurprise = null
        if (epsA && epsE && epsE !== 0) {
          epsSurprise = ((epsA / epsE) - 1) * 100
          const ratio = epsA / epsE
          if (ratio >= 1.20) score += 30
          else if (ratio >= 1.10) score += 20
          else if (ratio >= 1.05) score += 10
          else if (ratio >= 1.0) score += 5
        }

        // Revenue Surprise
        let revSurprise = null
        if (revA && revE && revE !== 0) {
          revSurprise = ((revA / revE) - 1) * 100
          const ratio = revA / revE
          if (ratio >= 1.20) score += 30
          else if (ratio >= 1.10) score += 20
          else if (ratio >= 1.05) score += 10
          else if (ratio >= 1.0) score += 5
        }

        // Bonus: positive surprise + positive epsGrowth
        const epsGrowth = growth?.epsGrowth || 0
        if (epsSurprise > 0 && epsGrowth > 0) score += 10

        return {
          score: Math.min(100, score),
          epsSurprise: epsSurprise != null ? parseFloat(epsSurprise.toFixed(2)) : null,
          revSurprise: revSurprise != null ? parseFloat(revSurprise.toFixed(2)) : null
        }
      }

      // 2️⃣ Fundamental Acceleration (20%)
      function calcFundamentalAccel(growth, income) {
        if (!growth && !income) return { score: 0 }
        let score = 0

        const revGrowth = growth?.revenueGrowth || 0
        const epsGrowth = growth?.epsGrowth || 0
        const niGrowth = growth?.netIncomeGrowth || 0

        // Revenue growth positive & accelerating
        if (revGrowth > 0.20) score += 25
        else if (revGrowth > 0.10) score += 20
        else if (revGrowth > 0.05) score += 15
        else if (revGrowth > 0) score += 10

        // EPS growth accelerating
        if (epsGrowth > 0.20) score += 25
        else if (epsGrowth > 0.10) score += 20
        else if (epsGrowth > 0.05) score += 15
        else if (epsGrowth > 0) score += 10

        // Net income growth
        if (niGrowth > 0.15) score += 20
        else if (niGrowth > 0.05) score += 10
        else if (niGrowth > 0) score += 5

        // Margin expansion: operatingIncome/revenue
        if (income?.revenue && income?.operatingIncome) {
          const opMargin = income.operatingIncome / income.revenue
          if (opMargin > 0.30) score += 15
          else if (opMargin > 0.20) score += 10
          else if (opMargin > 0.10) score += 5
        }

        return { score: Math.min(100, score), revenueGrowth: revGrowth, epsGrowth, niGrowth }
      }

      // 3️⃣ Balance Sheet Strength (10%)
      function calcBalanceStrength(balance, income) {
        if (!balance) return { score: 0 }
        let score = 0
        const ebitda = income?.ebitda || 1
        const netDebt = balance.netDebt || 0
        const cash = balance.cashAndCashEquivalents || 0
        const shortDebt = balance.shortTermDebt || 0
        const totalDebt = balance.totalDebt || 0

        // netDebt / ebitda < 2 → strong
        if (ebitda > 0) {
          const leverage = netDebt / ebitda
          if (leverage < 0) score += 40  // net cash position
          else if (leverage < 1) score += 35
          else if (leverage < 2) score += 25
          else if (leverage < 3) score += 10
        }

        // cash > shortTermDebt → strong
        if (cash > shortDebt && shortDebt > 0) score += 30
        else if (cash > 0) score += 15

        // Low total debt relative to assets
        if (balance.totalAssets && balance.totalAssets > 0) {
          const debtRatio = totalDebt / balance.totalAssets
          if (debtRatio < 0.2) score += 30
          else if (debtRatio < 0.4) score += 20
          else if (debtRatio < 0.6) score += 10
        }

        return { score: Math.min(100, score) }
      }

      // 4️⃣ Cash Flow Quality (15%)
      function calcCashFlowQuality(cashflow, income) {
        if (!cashflow) return { score: 0, fcf: null }
        let score = 0
        const fcf = cashflow.freeCashFlow || 0
        const ocf = cashflow.operatingCashFlow || 0
        const ni = income?.netIncome || 0
        const sbc = cashflow.stockBasedCompensation || 0
        const buybacks = cashflow.commonStockRepurchased || 0

        // freeCashFlow > 0
        if (fcf > 0) {
          score += 30
          // FCF relative to market cap proxy (revenue)
          if (income?.revenue && income.revenue > 0) {
            const fcfMargin = fcf / income.revenue
            if (fcfMargin > 0.20) score += 20
            else if (fcfMargin > 0.10) score += 15
            else if (fcfMargin > 0.05) score += 10
          }
        }

        // operatingCashFlow > netIncome → quality earnings
        if (ocf > ni && ni > 0) score += 20

        // Buybacks present → shareholder return
        if (buybacks < 0) score += 15  // negative = repurchased

        // Penalty: high stock-based compensation
        if (sbc > 0 && income?.revenue && income.revenue > 0) {
          const sbcRatio = sbc / income.revenue
          if (sbcRatio > 0.10) score -= 15
          else if (sbcRatio > 0.05) score -= 5
        }

        return { score: Math.max(0, Math.min(100, score)), fcf }
      }

      // 5️⃣ Float Compression (10%)
      function calcFloatCompression(shares, growth) {
        if (!shares || !shares.floatShares) return { score: 0, floatCategory: 'Unknown' }
        const floatShares = shares.floatShares
        let score = 0
        let floatCategory = 'Large'

        // Float size scoring
        if (floatShares < 100e6) { score += 50; floatCategory = 'Micro' }
        else if (floatShares < 500e6) { score += 40; floatCategory = 'Small' }
        else if (floatShares < 2e9) { score += 25; floatCategory = 'Medium' }
        else if (floatShares < 10e9) { score += 15; floatCategory = 'Large' }
        else { score += 5; floatCategory = 'Mega' }

        // Combine with growth → squeeze potential
        const revGrowth = growth?.revenueGrowth || 0
        const epsGrowth = growth?.epsGrowth || 0
        if ((revGrowth > 0.10 || epsGrowth > 0.10) && floatShares < 2e9) {
          score += 30  // high growth + tight float = squeeze
        }
        if ((revGrowth > 0.20 || epsGrowth > 0.20) && floatShares < 500e6) {
          score += 20  // extreme squeeze potential
        }

        return { score: Math.min(100, score), floatCategory }
      }

      // 6️⃣ Valuation Sweet Spot (10%)
      function calcValuationScore(ratios, growth) {
        if (!ratios) return { score: 0 }
        let score = 0
        const pe = ratios.priceToEarningsRatio || 0
        const pb = ratios.priceToBookRatio || 0
        const revGrowth = growth?.revenueGrowth || 0

        // PE sweet spot: 15~60
        if (pe > 0 && pe <= 15) score += 40  // deep value
        else if (pe > 15 && pe <= 30) score += 35  // reasonable
        else if (pe > 30 && pe <= 60) score += 20  // growth premium
        else if (pe > 60 && revGrowth > 0.20) score += 15  // high PE but justified by growth
        else if (pe > 60) score += 0  // overvalued without growth

        // PB scoring
        if (pb > 0 && pb <= 3) score += 30
        else if (pb > 3 && pb <= 8) score += 20
        else if (pb > 8 && pb <= 15) score += 10
        else score += 5

        // PEG-like: penalize ultra high PE without growth
        if (pe > 80 && revGrowth < 0.10) score -= 20

        return { score: Math.max(0, Math.min(100, score)) }
      }

      // 7️⃣ Macro Overlay (10%)
      function calcMacroOverlay(macroData) {
        if (!macroData) return { score: 50, riskMode: 'NEUTRAL', multiplier: 1.0 }
        let score = 0
        const vix = macroData.vix || 20
        const hySpread = macroData.hySpread || 4
        const us10y = macroData.us10y || 4

        // VIX scoring
        if (vix < 15) score += 40
        else if (vix < 20) score += 30
        else if (vix < 25) score += 15
        else score += 0

        // HY spread: falling = risk-on
        if (hySpread < 3) score += 30
        else if (hySpread < 5) score += 20
        else if (hySpread < 7) score += 10

        // 10Y yield stability
        if (us10y < 4.5) score += 30
        else if (us10y < 5.0) score += 20
        else score += 10

        const riskMode = score >= 70 ? 'RISK_ON' : score >= 40 ? 'NEUTRAL' : 'RISK_OFF'
        const multiplier = riskMode === 'RISK_OFF' ? 0.7 : riskMode === 'RISK_ON' ? 1.0 : 0.85

        return { score: Math.min(100, score), riskMode, multiplier }
      }

      // 종합 Alpha Scanner 점수 계산
      function calcTotalAlphaScore(modules) {
        const raw =
          (modules.earnings?.score || 0) * 0.25 +
          (modules.fundamental?.score || 0) * 0.20 +
          (modules.balance?.score || 0) * 0.10 +
          (modules.cashflow?.score || 0) * 0.15 +
          (modules.float?.score || 0) * 0.10 +
          (modules.valuation?.score || 0) * 0.10 +
          (modules.macro?.score || 0) * 0.10

        // Macro overlay multiplier
        const multiplier = modules.macro?.multiplier || 1.0
        const total = raw * multiplier

        // Breakout probability estimation
        let breakoutProb = 0
        if (total >= 80) breakoutProb = 85
        else if (total >= 70) breakoutProb = 65
        else if (total >= 60) breakoutProb = 45
        else if (total >= 50) breakoutProb = 25
        else breakoutProb = 10

        return {
          totalScore: parseFloat(total.toFixed(1)),
          momentumScore: parseFloat(((modules.earnings?.score || 0) * 0.25).toFixed(1)),
          qualityScore: parseFloat((
            (modules.fundamental?.score || 0) * 0.20 +
            (modules.balance?.score || 0) * 0.10 +
            (modules.cashflow?.score || 0) * 0.15
          ).toFixed(1)),
          squeezeScore: parseFloat(((modules.float?.score || 0) * 0.10).toFixed(1)),
          breakoutProbability: breakoutProb,
          macroMultiplier: multiplier
        }
      }

      async function runAlphaScanner() {
        try {
          const startTime = Date.now()
          const universe = await getHedgeFundUniverse()  // S&P500 전종목 (FMP constituent API)
          const stocks = universe  // 전체 종목 스크리닝 (Step1 quote만, deep은 top20)

          // Step 1: Macro data (1 call, shared across all stocks)
          let macroData = null
          try {
            // 출처: getMarketDataCached() → flat 구조 (vix, us10y 등) + 중첩 구조 (MARKET_RISK)
            const mktData = await getMarketDataCached()
            macroData = {
              vix: mktData?.vix || 20,
              hySpread: mktData?.MARKET_RISK?.HY_OAS_SPREAD || 4,
              us10y: mktData?.us10y || 4
            }
          } catch (e) { console.error('Macro fetch failed:', e.message) }

          const macroModule = calcMacroOverlay(macroData)

          // Step 2: Quick screen - get full quotes for all 80
          const quoteResults = []
          for (let i = 0; i < stocks.length; i++) {
            try {
              const q = await getFullQuote(stocks[i])
              if (q && q.price) quoteResults.push({ symbol: stocks[i], quote: q })
            } catch (e) { /* skip */ }
            if (i % 15 === 14) await new Promise(r => setTimeout(r, 300))
          }

          // Step 3: Deep analysis for top candidates (batch of 15)
          // Sort by preliminary momentum (daily change) to prioritize
          quoteResults.sort((a, b) => {
            const aChange = Math.abs(a.quote.changesPercentage || 0)
            const bChange = Math.abs(b.quote.changesPercentage || 0)
            return bChange - aChange
          })

          const candidates = quoteResults.slice(0, 20) // deep analyze top 20
          const results = []

          for (let i = 0; i < candidates.length; i++) {
            const { symbol, quote } = candidates[i]
            try {
              // Parallel fetch of all fundamentals
              const [earningsRes, growthRes, incomeRes, balanceRes, cashflowRes, ratiosRes, profileRes, sharesRes] =
                await Promise.allSettled([
                  getEarnings(symbol),
                  getFinancialGrowth(symbol),
                  getIncomeStatement(symbol),
                  getBalanceSheet(symbol),
                  getCashFlow(symbol),
                  getRatios(symbol),
                  getCompanyProfile(symbol),
                  getSharesFloat(symbol)
                ])

              const extract = (r) => r.status === 'fulfilled' ? r.value : null
              const earnings = extract(earningsRes)
              const growth = extract(growthRes)
              const income = extract(incomeRes)
              const balance = extract(balanceRes)
              const cashflow = extract(cashflowRes)
              const ratios = extract(ratiosRes)?.data || extract(ratiosRes)
              const profile = extract(profileRes)
              const shares = extract(sharesRes)

              // Calculate all 7 modules
              const earningsModule = calcEarningsMomentum(earnings, growth)
              const fundamentalModule = calcFundamentalAccel(growth, income)
              const balanceModule = calcBalanceStrength(balance, income)
              const cashflowModule = calcCashFlowQuality(cashflow, income)
              const floatModule = calcFloatCompression(shares, growth)
              const valuationModule = calcValuationScore(ratios, growth)

              const modules = {
                earnings: earningsModule,
                fundamental: fundamentalModule,
                balance: balanceModule,
                cashflow: cashflowModule,
                float: floatModule,
                valuation: valuationModule,
                macro: macroModule
              }

              const total = calcTotalAlphaScore(modules)

              // Filter: totalScore >= 5 (very relaxed to ensure we get results)
              if (total.totalScore < 5) continue

              results.push({
                symbol,
                companyName: profile?.companyName || quote.name || symbol,
                sector: profile?.sector || quote.sector || '-',
                price: parseFloat((quote.price || 0).toFixed(2)),
                change: parseFloat((quote.changesPercentage || 0).toFixed(2)),
                totalScore: total.totalScore,
                momentumScore: total.momentumScore,
                qualityScore: total.qualityScore,
                squeezeScore: total.squeezeScore,
                breakoutProbability: total.breakoutProbability,
                macroMultiplier: total.macroMultiplier,
                signals: {
                  epsSurprise: earningsModule.epsSurprise,
                  revSurprise: earningsModule.revSurprise,
                  revenueGrowth: fundamentalModule.revenueGrowth ? parseFloat((fundamentalModule.revenueGrowth * 100).toFixed(1)) : null,
                  epsGrowth: fundamentalModule.epsGrowth ? parseFloat((fundamentalModule.epsGrowth * 100).toFixed(1)) : null,
                  freeCashFlow: cashflowModule.fcf,
                  floatCategory: floatModule.floatCategory,
                  pe: ratios?.priceToEarningsRatio ? parseFloat(ratios.priceToEarningsRatio.toFixed(1)) : null,
                  pb: ratios?.priceToBookRatio ? parseFloat(ratios.priceToBookRatio.toFixed(1)) : null
                },
                modules: {
                  earnings: earningsModule.score,
                  fundamental: fundamentalModule.score,
                  balance: balanceModule.score,
                  cashflow: cashflowModule.score,
                  float: floatModule.score,
                  valuation: valuationModule.score,
                  macro: macroModule.score
                },
                macroOverlay: {
                  riskMode: macroModule.riskMode,
                  vix: macroData?.vix || null,
                  hySpread: macroData?.hySpread || null
                }
              })
            } catch (e) {
              console.error(`❌ AlphaScanner ${symbol}: ${e.message}`)
            }

            if (i % 5 === 4) await new Promise(r => setTimeout(r, 300))
          }

          results.sort((a, b) => b.totalScore - a.totalScore)

          // ✅ 최소 20개는 반환 (결과 없음 방지)
          const top20 = results.length > 0
            ? results.slice(0, 20)
            : candidates.slice(0, 20).map(c => ({  // fallback: 상위 20개 후보 (점수 0으로 처리)
                symbol: c.symbol,
                companyName: c.quote.name || c.symbol,
                sector: c.quote.sector || '-',
                price: parseFloat((c.quote.price || 0).toFixed(2)),
                change: parseFloat((c.quote.changesPercentage || 0).toFixed(2)),
                totalScore: 0,  // 점수 계산 실패했으므로 0
                momentumScore: 0,
                qualityScore: 0,
                squeezeScore: 0,
                breakoutProbability: 50,  // 기본값
                macroMultiplier: 1,
                signals: {},
                modules: { earnings: 0, fundamental: 0, balance: 0, cashflow: 0, float: 0, valuation: 0, macro: 0 },
                macroOverlay: { riskMode: 'NEUTRAL', vix: macroData?.vix || null, hySpread: macroData?.hySpread || null }
              }))

          return {
            timestamp: new Date().toISOString(),
            dataType: 'alpha_scanner',
            universe_size: stocks.length,
            deep_analyzed: candidates.length,
            qualified: results.length,
            execution_time_sec: parseFloat(((Date.now() - startTime) / 1000).toFixed(1)),
            macro: {
              riskMode: macroModule.riskMode,
              multiplier: macroModule.multiplier,
              score: macroModule.score,
              vix: macroData?.vix || null,
              hySpread: macroData?.hySpread || null,
              us10y: macroData?.us10y || null
            },
            top_20: top20
          }
        } catch (e) {
          console.error(`❌ runAlphaScanner:`, e.message)
          return {
            timestamp: new Date().toISOString(),
            dataType: 'alpha_scanner',
            error: e.message,
            top_20: []
          }
        }
      }

      // ── 심플 Alpha Discovery (KV 캐시 우선, 폴백 10종목 실시간) ───
      async function fetchAlphaDiscoverySimple() {
        const kv = env.METRICZ_KV
        const forceRefresh = url.searchParams.get('force') === 'true'

        // 1️⃣ KV 캐시 확인 → 있으면 즉시 반환 (force=true 시 캐시 무시)
        if (kv && !forceRefresh) {
          try {
            const cached = await kv.get(DISCOVERY_KV_KEY)
            if (cached) {
              const parsed = JSON.parse(cached)
              // 스테일 캐시 감지: ma50trend 필드가 없으면 구버전 캐시 → 무시
              const hasValidData = parsed.top_20?.some(s => s.ma50trend !== undefined)
              if (!hasValidData) {
                console.warn('⚠️ Discovery KV 캐시가 구버전 (ma50trend 없음) - 실시간 폴백으로 전환')
                // fall through to real-time fetch
              } else {
                // top_20 정렬 보정 (구버전 캐시 호환)
                if (parsed.top_20?.length > 20) {
                  parsed.top_20 = parsed.top_20.sort((a, b) => b.score - a.score).slice(0, 20)
                }
                // all_stocks: 신버전 캐시에 있으면 그대로, 없으면 top_20으로 대체
                if (!parsed.all_stocks) {
                  parsed.all_stocks = parsed.top_20
                }
                return parsed
              }
            }
          } catch(e) {
            console.warn('⚠️ Discovery KV 읽기 실패:', e.message)
          }
        }

        // 2️⃣ KV 없으면 상위 10종목 실시간 폴백 (출처: FMP /stable/quote 무료 플랜)
        const BASE    = 'https://financialmodelingprep.com/stable'
        const SYMBOLS = SP500_UNIVERSE.slice(0, 10)
        const results = await Promise.all(
          SYMBOLS.map(async (symbol) => {
            try {
              const qRaw = await fmpGet(`${BASE}/quote?symbol=${symbol}&apikey=${FMP}`)
              const q = Array.isArray(qRaw) ? (qRaw[0] || {}) : (qRaw || {})
              if (!q.price) return null

              const price   = q.price    || 0
              const ma50    = q.priceAvg50  || price
              const ma200   = q.priceAvg200 || price
              const yLow    = q.yearLow   || price * 0.7
              const yHigh   = q.yearHigh  || price * 1.3
              const vol     = q.volume    || 0
              const avgVol  = (q.avgVolume > 0) ? q.avgVolume : null
              const peRaw   = (q.pe && q.pe > 0) ? q.pe
                            : (price > 0 && q.eps && q.eps > 0) ? price / q.eps
                            : 0
              const mom     = q.changePercentage || 0

              const ma50trend  = ma50  > 0 ? (price - ma50)  / ma50  * 100 : 0
              const range      = yHigh - yLow
              const str52w     = range > 0 ? (price - yLow) / range * 100 : 50
              // 장 마감/주말: vol=0 또는 avgVol 없으면 null
              const volSurge   = (vol > 0 && avgVol > 0) ? (vol / avgVol - 1) * 100 : null
              const vsScore    = volSurge != null ? Math.min(50, Math.max(-20, volSurge)) : 0

              const score = mom       * 0.30
                          + ma50trend * 0.25
                          + (str52w - 50) * 0.25
                          + vsScore   * 0.20

              return {
                symbol,
                price,
                volume: vol,
                momentum:  parseFloat(mom.toFixed(2)),
                ma50trend: parseFloat(ma50trend.toFixed(2)),
                str52w:    parseFloat(str52w.toFixed(1)),
                volSurge:  volSurge != null ? parseFloat(volSurge.toFixed(1)) : null,
                pe:        parseFloat((peRaw || 0).toFixed(1)),
                score:     parseFloat(score.toFixed(2))
              }
            } catch {
              return null
            }
          })
        )
        const items = results.filter(v => v).sort((a, b) => b.score - a.score)
        return { top_20: items, all_stocks: items, analyzed: items.length, universe_size: 10, execution_time_sec: 0 }
      }

      // ── 심플 Macro Data (FRED 3개) ────────────────────────────────
      async function fetchMacroData() {
        const get = async (id) => {
          const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${FRED}&file_type=json`)
          const json = await res.json()
          const last = json.observations?.at(-1)
          return parseFloat(last?.value) || 0
        }
        return {
          fedBal: await get("WALCL"),
          m2: await get("M2SL"),
          reverseRepo: await get("RRPONTSYD")
        }
      }

      // ── 심플 Alpha Scanner ────────────────────────────────────────
      async function fetchAlphaScannerSimple() {
        const discovery = await fetchAlphaDiscoverySimple()
        // 이미 score가 계산된 데이터 사용 (refreshDiscoveryCache가 계산)
        // 기존 구버전 캐시(revenueGrowth 등) 호환성을 위한 fallback 점수 계산
        const safe = (v) => isNaN(v) || v == null ? 0 : v
        const all = (discovery.top_20 || []).map(s => {
          // 신버전: ma50trend 있으면 기존 score 사용
          // 구버전: revenueGrowth/epsGrowth/roe로 재계산
          const score = s.ma50trend !== undefined
            ? (s.score || 0)
            : (safe(s.revenueGrowth) * 100 * 0.25 +
               safe(s.epsGrowth) * 100 * 0.25 +
               safe(s.roe) * 100 * 0.2 +
               safe(s.momentum) * 100 * 0.2 -
               safe(s.pe) * 0.1)
          return { ...s, score }
        })
        all.sort((a, b) => b.score - a.score)
        return { top_20: all.slice(0, 20), analyzed: discovery.analyzed, universe_size: discovery.universe_size }
      }

      /* ================================
         경로 기반 라우팅
      ================================ */
      let response

      // /market endpoint - 시장 데이터
      if (pathname === "/market") {
        const marketData = await getMarketData()

        // Put/Call Ratio 로드 (CBOE CSV)
        let putCallRatio = null
        try {
          const csvText = await fetch('https://www.cboe.com/publish/scheduledtask/mktdata/datahouse/totaloptionsvolume.csv')
            .then(r => r.text())
            .catch(() => null)
          if (csvText) {
            const lines = csvText.trim().split('\n').filter(l => l.trim().length > 0)
            const lastLine = lines[lines.length - 1].split(',')
            const pc = parseFloat(lastLine[lastLine.length - 1])
            if (!isNaN(pc) && pc > 0 && pc < 10) {
              putCallRatio = parseFloat(pc.toFixed(2))
            }
          }
        } catch (e) {
          // Put/Call Ratio 로드 실패 시 null 유지
        }

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
              changePercentage: marketData.spyChange ? parseFloat(marketData.spyChange.toFixed(2)) : null,
              volume: marketData.spyVolume || null
            },
            NASDAQ: {
              price: marketData.qqq ? parseFloat(marketData.qqq.toFixed(2)) : null,
              changePercentage: marketData.qqqChange ? parseFloat(marketData.qqqChange.toFixed(2)) : null,
              volume: marketData.qqqVolume || null
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
              changePercentage: marketData.iwmChange ? parseFloat(marketData.iwmChange.toFixed(2)) : null,
              volume: marketData.iwmVolume || null
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
          // 카드 9: 옵션 지표
          OPTIONS: {
            PUT_CALL_RATIO: putCallRatio  // CBOE CSV에서 로드
          },
          // 카드 10-14: Sectors, Credit, Breadth, Macro
          SECTORS: marketData.SECTORS || {},
          CREDIT: marketData.CREDIT || {},
          BREADTH: marketData.BREADTH || {},
          MACRO_BASE: marketData.MACRO_BASE || {},
          MACRO_INDICATORS: marketData.MACRO_INDICATORS || {},
          // 경제 지표 (dates + values 포함 차트용)
          ECONOMIC_INDICATORS: marketData.ECONOMIC_INDICATORS || {},
          // macro-index.html 용 신규 FRED 지표 (5개 카테고리)
          MACRO_INDEX: marketData.MACRO_INDEX || {}
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
      // /top7 endpoint - 시총 상위 7개 (실시간 가격)
      else if (pathname === "/top7") {
        try {
          // ✅ 최신 시총순위 (2026년 기준)
          // 출처: FMP API /stable/quote (무료 플랜 확인됨)
          const topSymbols = ['MSFT', 'AAPL', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META']

          console.log(`[/top7] 시작: ${topSymbols.length}개 종목 조회`)

          // 1️⃣ 실시간 가격 데이터 호출 (일부 실패해도 진행)
          // ⏱️ timeout: 8초 (클라이언트 timeout은 5초, 여유 있게)
          const quoteResults = await Promise.allSettled(
            topSymbols.map(sym => getQuote(sym, 8000))
          )

          // DEBUG: 각 종목별 결과 확인
          quoteResults.forEach((result, idx) => {
            const sym = topSymbols[idx]
            const q = result.status === 'fulfilled' ? result.value : null
            console.log(`   [${sym}] ${q ? `✅ price=${q.price}` : '❌ null'}`)
          })

          // 2️⃣ 데이터 변환 (null 체크)
          const data = quoteResults
            .map((result, idx) => {
              const q = result.status === 'fulfilled' ? result.value : null
              return {
                symbol: topSymbols[idx],
                price: q && q.price ? parseFloat(q.price.toFixed(2)) : null,
                changePercentage: q && q.changePercentage ? parseFloat(q.changePercentage.toFixed(2)) : null,
                volume: q?.volume || null,
                marketCap: q?.marketCap || 0  // 시가총액 (정렬용)
              }
            })
            .filter(item => item.price !== null)  // 데이터 없는 항목 제외
            .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))  // 시가총액 기준 내림차순 정렬
            .map((item, idx) => ({
              rank: idx + 1,
              symbol: item.symbol,
              price: item.price,
              changePercentage: item.changePercentage,
              volume: item.volume,
              marketCap: item.marketCap
            }))

          // 3️⃣ 응답
          response = {
            timestamp: new Date().toISOString(),
            dataType: "top7",
            message: "시총 상위 7개 (FMP 실시간 가격)",
            count: data.length,
            data: data
          }

          console.log(`[/top7] ✅ ${data.length}/${topSymbols.length}개 종목 로드됨`)
        } catch (err) {
          console.error('[/top7] Error:', err.message)
          response = {
            timestamp: new Date().toISOString(),
            dataType: "top7",
            error: err.message,
            data: []
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
      // /feargreed endpoint - Alternative.me Fear & Greed Index
      else if (pathname === "/feargreed") {
        try {
          // 출처: Alternative.me Fear & Greed Index API (무료, 안정적)
          const r = await fetch('https://api.alternative.me/fng/?limit=1')
          if (!r.ok) throw new Error(`Alternative.me HTTP ${r.status}`)
          const d = await r.json()
          const data = d?.data?.[0]
          if (!data || data.value === undefined) throw new Error('Alternative.me structure mismatch')
          response = {
            score: Math.round(parseInt(data.value)),
            rating: data.value_classification || null,
            timestamp: new Date().toISOString(),
            source: 'Alternative.me'
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
      // FRED 단일 시리즈 조회 (?series=WALCL 형태) — 루트 경로보다 먼저 처리
      else if (series) {
        // 타임아웃 15초, 실패 시 1회 재시도 (2초 대기)
        let fredData = await fredGet(series, null, 15000)
        if (!fredData || fredData.length === 0) {
          await new Promise(r => setTimeout(r, 2000))
          fredData = await fredGet(series, null, 15000)
        }
        const raw = getLatestValue(fredData)
        const value = convertFredValue(series, raw)

        response = {
          timestamp: new Date().toISOString(),
          dataType: "fred_single",
          series: series,
          value: value
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
        try { response = await getInstitutionalScore() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/market-regime") {
        try { response = await getMarketRegime() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/liquidity-pulse") {
        try { response = await getLiquidityPulse() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/yield-curve-monitor") {
        try { response = await getYieldCurveMonitor() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/inflation-pressure") {
        try { response = await getInflationPressure() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/credit-stress") {
        try { response = await getCreditStress() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/market-breadth") {
        try { response = await getMarketBreadth() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/volatility-regime") {
        try { response = await getVolatilityRegime() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/sector-rotation") {
        try { response = await getSectorRotation() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/dollar-liquidity") {
        try { response = await getDollarLiquidity() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/crypto-sentiment") {
        try { response = await getCryptoSentiment() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/smart-money") {
        try { response = await getSmartMoney() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/stock-ranking") {
        try { response = await getStockRanking() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/market-heatmap") {
        try { response = await getMarketHeatmap() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/real-rate-monitor") {
        try { response = await getRealRateMonitor() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/fed-policy-impact") {
        try { response = await getFedPolicyImpact() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/labor-market-health") {
        try { response = await getLaborMarketHealth() } catch(e) { response = {error: e.message, endpoint: pathname} }
      } else if (pathname === "/analysis/macro-momentum") {
        try { response = await getMacroMomentum() } catch(e) { response = {error: e.message, endpoint: pathname} }

      // =============================
      // EARNINGS & ALPHA DISCOVERY
      // =============================
      } else if (pathname === "/earnings") {
        try {
          const symbol = url.searchParams.get('symbol')
          if (symbol) {
            response = await runAlphaDiscovery(symbol)
          } else {
            response = await runAlphaDiscovery()
          }
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      } else if (pathname === "/alpha/discovery") {
        try {
          response = await fetchAlphaDiscoverySimple()
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      // /macro - FRED 유동성 3종 (fedBal, m2, reverseRepo)
      } else if (pathname === "/macro") {
        try {
          response = await fetchMacroData()
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      // /alpha/alpha-scanner - 심플 퀀트 스코어링
      } else if (pathname === "/alpha/alpha-scanner") {
        try {
          response = await fetchAlphaScannerSimple()
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      // /alpha/breakout - 단기 돌파 후보 발굴 (1~3주 목표)
      } else if (pathname === "/alpha/breakout") {
        try {
          response = await runBreakoutDiscovery()
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      // /macroindex - macro-index.html 용 FRED 시계열 (3년 히스토리)
      } else if (pathname === "/macroindex") {
        try {
          response = await getMacroIndexHistory(url)
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      // /metricz-refresh - KV 캐시 수동 갱신 (최대 2분 소요)
      // /sp500-check - S&P500 constituent API 동작 확인 (KV 캐시 + FMP API 테스트)
      } else if (pathname === "/sp500-check") {
        try {
          const kv = env.METRICZ_KV
          const apiKey = env.FMP_API_KEY
          const t0 = Date.now()

          // KV 캐시 상태 확인
          let kvStatus = null
          if (kv) {
            const cached = await kv.get(SP500_KV_KEY)
            if (cached) {
              const parsed = JSON.parse(cached)
              const ageMin = ((Date.now() - new Date(parsed.timestamp).getTime()) / 60000).toFixed(0)
              kvStatus = { hit: true, count: parsed.symbols?.length, age_min: parseInt(ageMin), timestamp: parsed.timestamp }
            } else {
              kvStatus = { hit: false, message: 'KV 캐시 없음 (아직 cron 미실행 or TTL 만료)' }
            }
          }

          // FMP API 직접 호출 테스트 (항상 실행 - 진단용)
          const force = url.searchParams.get('force') === '1'
          let stableStatus = null, v3Status = null
          if (force || !kvStatus?.hit) {
            // stable endpoint 테스트
            const d1 = await fmpGet(`https://financialmodelingprep.com/stable/sp500-constituent?apikey=${apiKey}`)
            if (d1 && Array.isArray(d1) && d1.length > 0) {
              stableStatus = { ok: true, count: d1.length, first_5: d1.slice(0,5).map(s=>s.symbol) }
            } else {
              stableStatus = { ok: false, raw: JSON.stringify(d1)?.slice(0,300) }
            }
            // v3 endpoint 테스트
            const d2 = await fmpGet(`https://financialmodelingprep.com/api/v3/sp500_constituent?apikey=${apiKey}`)
            if (d2 && Array.isArray(d2) && d2.length > 0) {
              v3Status = { ok: true, count: d2.length, first_5: d2.slice(0,5).map(s=>s.symbol) }
            } else {
              v3Status = { ok: false, raw: JSON.stringify(d2)?.slice(0,300) }
            }
          }

          // getSP500Symbols() 최종 결과
          const symbols = await getSP500Symbols(kv, apiKey)
          const elapsed = ((Date.now() - t0) / 1000).toFixed(2)
          const usingHardcoded = symbols.length === SP500_UNIVERSE.length

          response = {
            ok: true,
            elapsed_sec: parseFloat(elapsed),
            universe_count: symbols.length,
            source: usingHardcoded ? 'hardcoded_fallback' : kvStatus?.hit ? 'kv_cache' : 'fmp_api',
            first_10: symbols.slice(0, 10),
            last_10: symbols.slice(-10),
            kv_cache: kvStatus,
            fmp_stable: stableStatus || { skipped: true, hint: 'KV 캐시 히트로 API 호출 skip. ?force=1 로 강제 테스트 가능' },
            fmp_v3: v3Status || { skipped: true },
            note: usingHardcoded
              ? `⚠️ FMP API 미지원(Starter 플랜 제한) → hardcoded ${SP500_UNIVERSE.length}종목 사용중`
              : `✅ S&P500 ${symbols.length}개 로드 성공`
          }
        } catch(e) {
          response = { error: e.message, endpoint: pathname }
        }

      // /metricz-refresh - metricz KV 캐시 수동 갱신 (단일 chunk만)
      // ?chunk=0 : chunk 0만 처리 (20종목, ~40 subrequests)
      // 전체 갱신은 /metricz-refresh-all 사용 (브라우저에서 순차 호출)
      } else if (pathname === "/metricz-refresh") {
        try {
          const chunkParam = url.searchParams.get('chunk')
          const chunkIdx = parseInt(chunkParam) || 0
          const result = await refreshMetriczCache(env, chunkIdx)
          response = { ok: true, ...result, message: `chunk ${chunkIdx} 갱신 완료` }
        } catch(e) {
          response = { error: e.message, endpoint: pathname }
        }

      // /metricz-refresh-all - 전체 갱신 (브라우저 순차 호출 방식)
      // 각 chunk가 별도 HTTP 요청 → subrequest 한도 문제 회피
      } else if (pathname === "/metricz-refresh-all") {
        const workerHost = url.origin
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Metricz Full Refresh</title>
<style>
body{background:#0a0e17;color:#e0e0e0;font-family:'Courier New',monospace;padding:20px;max-width:800px;margin:0 auto}
h2{color:#00d4aa}
.log{background:#111;border:1px solid #333;border-radius:8px;padding:15px;margin:10px 0;max-height:500px;overflow-y:auto;font-size:13px}
.ok{color:#00d4aa}.err{color:#ff6b6b}.warn{color:#ffd93d}.info{color:#6bc5f7}
.progress{background:#222;border-radius:10px;height:24px;margin:15px 0;overflow:hidden}
.progress-bar{background:linear-gradient(90deg,#00d4aa,#00b894);height:100%;transition:width 0.5s;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;color:#000}
button{background:#00d4aa;color:#000;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold;margin:10px 5px}
button:hover{background:#00e6b8}button:disabled{background:#444;color:#666;cursor:not-allowed}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:15px 0}
.stat{background:#1a1f2e;padding:12px;border-radius:8px;text-align:center}
.stat-val{font-size:24px;font-weight:bold;color:#00d4aa}
.stat-label{font-size:11px;color:#888;margin-top:4px}
</style></head><body>
<h2>⚡ Metricz Full Refresh</h2>
<div class="stats">
<div class="stat"><div class="stat-val" id="sChunk">0/0</div><div class="stat-label">Chunks</div></div>
<div class="stat"><div class="stat-val" id="sSuccess">0</div><div class="stat-label">Success</div></div>
<div class="stat"><div class="stat-val" id="sCumul">0</div><div class="stat-label">Cumulative</div></div>
</div>
<div class="progress"><div class="progress-bar" id="pBar" style="width:0%">0%</div></div>
<button id="btnStart" onclick="startRefresh()">🚀 Start Full Refresh</button>
<button id="btnStop" onclick="stopRefresh()" disabled>⏹ Stop</button>
<div class="log" id="log"></div>
<script>
const BASE='${workerHost}';let running=false,stopped=false;
function log(msg,cls='info'){const d=document.getElementById('log');const t=new Date().toLocaleTimeString();d.innerHTML+='<div class="'+cls+'">['+t+'] '+msg+'</div>';d.scrollTop=d.scrollHeight}
async function startRefresh(){
  if(running)return;running=true;stopped=false;
  document.getElementById('btnStart').disabled=true;document.getElementById('btnStop').disabled=false;
  log('📡 Getting universe size...','info');
  let totalChunks=25;
  try{
    const r=await fetch(BASE+'/metricz-refresh?chunk=0');const d=await r.json();
    if(d.totalChunks)totalChunks=d.totalChunks;
    log('✅ Chunk 0: '+d.success+'/'+d.total+' success, cumulative: '+d.cumulative,'ok');
    document.getElementById('sChunk').textContent='1/'+totalChunks;
    document.getElementById('sSuccess').textContent=d.success;
    document.getElementById('sCumul').textContent=d.cumulative;
    updateBar(1,totalChunks);
  }catch(e){log('❌ Chunk 0 failed: '+e.message,'err')}
  let totalSuccess=0;
  for(let i=1;i<totalChunks;i++){
    if(stopped){log('⏹ Stopped by user','warn');break}
    await new Promise(r=>setTimeout(r,2000));
    try{
      const r=await fetch(BASE+'/metricz-refresh?chunk='+i);const d=await r.json();
      totalSuccess+=d.success||0;
      log('✅ Chunk '+i+'/'+totalChunks+': '+d.success+'/'+d.total+' success','ok');
      document.getElementById('sChunk').textContent=(i+1)+'/'+totalChunks;
      document.getElementById('sSuccess').textContent=totalSuccess;
      document.getElementById('sCumul').textContent=d.cumulative||'?';
      updateBar(i+1,totalChunks);
    }catch(e){log('❌ Chunk '+i+' failed: '+e.message,'err')}
  }
  log('🏁 Full refresh complete!','ok');
  running=false;document.getElementById('btnStart').disabled=false;document.getElementById('btnStop').disabled=true;
}
function stopRefresh(){stopped=true}
function updateBar(cur,total){const p=Math.round(cur/total*100);const b=document.getElementById('pBar');b.style.width=p+'%';b.textContent=p+'%'}
</script></body></html>`;
        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8', 'Access-Control-Allow-Origin': '*' } })

      // /metricz-debug - KV 캐시 원본값 확인 (GET ?symbols=MO,VZ,PLTR or ?all=1)
      } else if (pathname === "/metricz-rawtest") {
        // FMP API 원본 응답 확인 — 필드명 검증용
        // 사용: /metricz-rawtest?symbol=AAPL
        try {
          const sym = (url.searchParams.get('symbol') || 'AAPL').toUpperCase()
          const apiKey = env.FMP_API_KEY
          const BASE = 'https://financialmodelingprep.com/stable'
          const [rd, kd, gd, qd] = await Promise.allSettled([
            fmpGet(`${BASE}/ratios?symbol=${sym}&apikey=${apiKey}`),
            fmpGet(`${BASE}/key-metrics-ttm?symbol=${sym}&apikey=${apiKey}`),
            fmpGet(`${BASE}/financial-growth?symbol=${sym}&apikey=${apiKey}`),
            fmpGet(`${BASE}/quote?symbol=${sym}&apikey=${apiKey}`),
          ])
          const r = rd.status === 'fulfilled' ? rd.value : { error: rd.reason?.message }
          const k = kd.status === 'fulfilled' ? kd.value : { error: kd.reason?.message }
          const g = gd.status === 'fulfilled' ? gd.value : { error: gd.reason?.message }
          const q = qd.status === 'fulfilled' ? qd.value : { error: qd.reason?.message }
          response = {
            symbol: sym,
            ratios_raw:       r,  // /stable/ratios
            keyMetrics_raw:   k,  // /stable/key-metrics-ttm
            growth_raw:       g,  // /stable/financial-growth
            quote_raw:        q,  // /stable/quote
            ratios_fields:    r && !r.error ? Object.keys(Array.isArray(r) ? (r[0]||{}) : r) : null,
            keyMetrics_fields:k && !k.error ? Object.keys(Array.isArray(k) ? (k[0]||{}) : k) : null,
            growth_fields:    g && !g.error ? Object.keys(Array.isArray(g) ? (g[0]||{}) : g) : null,
          }
        } catch(e) {
          response = { error: e.message }
        }

      } else if (pathname === "/metricz-debug") {
        try {
          const kv = env.METRICZ_KV
          if (!kv) {
            response = { error: 'METRICZ_KV not configured' }
          } else {
            const cached = await kv.get(METRICZ_KV_KEY)
            if (!cached) {
              response = { error: 'KV cache empty — cron not yet run', key: METRICZ_KV_KEY }
            } else {
              const parsed    = JSON.parse(cached)
              const stocks    = parsed.stocks || {}
              const allSyms   = Object.keys(stocks)
              const symParam  = url.searchParams.get('symbols') || url.searchParams.get('symbol') || ''
              const showAll   = url.searchParams.get('all') === '1'

              // 요청 심볼 or 전체
              const targets = symParam
                ? symParam.toUpperCase().split(',').map(s => s.trim()).filter(Boolean)
                : showAll ? allSyms : allSyms.slice(0, 30)

              // 각 심볼의 실제 저장 값 반환
              const data = {}
              targets.forEach(sym => {
                const s = stocks[sym]
                if (!s) { data[sym] = null; return }
                data[sym] = {
                  // 수익성
                  returnOnEquityTTM:            s.returnOnEquityTTM,
                  operatingProfitMarginTTM:     s.operatingProfitMarginTTM,
                  returnOnAssetsTTM:            s.returnOnAssetsTTM,
                  netProfitMarginTTM:           s.netProfitMarginTTM,
                  // 밸류에이션
                  peRatioTTM:                   s.peRatioTTM,
                  priceToBookRatioTTM:          s.priceToBookRatioTTM,
                  priceToSalesRatioTTM:         s.priceToSalesRatioTTM,
                  enterpriseValueOverEBITDATTM: s.enterpriseValueOverEBITDATTM,
                  freeCashFlowYieldTTM:          s.freeCashFlowYieldTTM,
                  // 성장성
                  revenueGrowth:                s.revenueGrowth,
                  epsgrowth:                    s.epsgrowth,
                  operatingIncomeGrowth:        s.operatingIncomeGrowth,
                  // 배당·안전성
                  dividendYieldTTM:             s.dividendYieldTTM,
                  payoutRatioTTM:               s.payoutRatioTTM,
                  debtEquityRatioTTM:           s.debtEquityRatioTTM,
                  currentRatioTTM:              s.currentRatioTTM,
                }
              })

              // null 통계
              const metrics = ['returnOnEquityTTM','operatingProfitMarginTTM','returnOnAssetsTTM',
                'netProfitMarginTTM','peRatioTTM','priceToBookRatioTTM','priceToSalesRatioTTM',
                'enterpriseValueOverEBITDATTM','freeCashFlowYieldTTM','revenueGrowth','epsgrowth',
                'operatingIncomeGrowth','dividendYieldTTM','payoutRatioTTM','debtEquityRatioTTM','currentRatioTTM']

              const nullStats = {}
              metrics.forEach(m => {
                const total = allSyms.length
                const nullCount = allSyms.filter(sym => stocks[sym]?.[m] == null).length
                nullStats[m] = { null_count: nullCount, valid_count: total - nullCount, null_pct: Math.round(nullCount/total*100) + '%' }
              })

              response = {
                cache_timestamp:  parsed.timestamp,
                total_cached:     allSyms.length,
                showing_symbols:  targets.length,
                null_stats:       nullStats,
                data,
              }
            }
          }
        } catch(e) {
          response = { error: e.message, endpoint: pathname }
        }

      // /metricz-all - 퀀트 종목 발굴 (POST, userLogic 가중치 기반 스코어링)
      } else if (pathname === "/metricz-all") {
        try {
          response = await getMetriczAll(request)
        } catch(e) {
          response = {error: e.message, endpoint: pathname}
        }

      } else if (pathname === "/analysis/catalyst-surge") {
        try {
          if (!symbol) {
            response = { error: "symbol parameter required" }
          } else {
            const technical = await csGetTechnical(symbol, env)
            const smartMoney = await csGetSmartMoney(symbol, technical, env)
            const catalyst = await csGetCatalyst(symbol, env)
            if (!csApplyFilters({ tech: technical, catalyst })) {
              response = { symbol, status: "REJECTED" }
            } else {
              const css_raw =
                catalyst.total * 0.4 +
                technical.total * 0.35 +
                smartMoney.total * 0.25
              // 0~100 정규화: raw / 28.9 × 100
              const css = parseFloat((css_raw / CSS_MAX * 100).toFixed(1))
              response = {
                symbol,
                css,
                css_raw: parseFloat(css_raw.toFixed(2)),
                grade: csGetGrade(css),
                breakdown: {
                  catalyst: catalyst.total,  // 최대 21
                  technical: technical.total, // 최대 50
                  smartMoney: smartMoney.total // 최대 12
                },
                detail: { technical, smartMoney, catalyst }
              }
            }
          }
        } catch(e) {
          response = { error: e.message, endpoint: pathname }
        }

      } else if (pathname === "/analysis/catalyst-surge-top5") {
        try {
          const universe = await csGetTop80(env)
          const safeUniverse = Array.isArray(universe) ? universe : []
          const stage1 = []
          // Stage 1: 15개씩 병렬 처리 → 전체 SP500_UNIVERSE(180종목) 커버 가능
          const WAVE_SIZE = 15
          for (let wi = 0; wi < safeUniverse.length; wi += WAVE_SIZE) {
            const wave = safeUniverse.slice(wi, wi + WAVE_SIZE)
            const waveResults = await Promise.allSettled(
              wave.map(stock => csGetTechnical(stock.symbol, env).then(tech => ({ symbol: stock.symbol, tech })))
            )
            for (const r of waveResults) {
              if (r.status === 'fulfilled' && r.value && (r.value.tech?.total || 0) >= 8) {
                stage1.push({ symbol: r.value.symbol, quickScore: r.value.tech.total, tech: r.value.tech })
              }
            }
            if (wi + WAVE_SIZE < safeUniverse.length) await new Promise(r => setTimeout(r, 100))
          }
          const shortlist = stage1
            .sort((a, b) => b.quickScore - a.quickScore)
            .slice(0, 20)
          const stage2 = []
          // Stage 2: Stage1 tech 재사용 (더블콜 방지 → 레이트리밋/캐시 문제 해결)
          for (const stock of shortlist) {
            try {
              const technical = stock.tech  // Stage1에서 저장한 결과 재사용
              const smartMoney = await csGetSmartMoney(stock.symbol, technical, env)
              const catalyst = await csGetCatalyst(stock.symbol, env)
              if (!csApplyFilters({ tech: technical, catalyst })) continue
              const css_raw = catalyst.total * 0.4 + technical.total * 0.35 + smartMoney.total * 0.25
              // 0~100 정규화: raw / CSS_MAX * 100
              const css = parseFloat((css_raw / CSS_MAX * 100).toFixed(1))
              stage2.push({
                symbol: stock.symbol,
                css,
                css_raw: parseFloat(css_raw.toFixed(2)),
                grade: csGetGrade(css),
                breakdown: {
                  catalyst: catalyst.total,
                  technical: technical.total,
                  smartMoney: smartMoney.total
                },
                isBreakout: technical.isBreakout
              })
            } catch (e) {}
          }
          // Stage 3: 백테스트 제거 → CSS 상위 5개 직접 반환
          const final = stage2
            .sort((a, b) => b.css - a.css)
            .slice(0, 5)
          response = final
        } catch(e) {
          response = { error: e.message, endpoint: pathname }
        }

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

      // response 검증: 설정되지 않은 경우 에러 반환
      if (!response) {
        response = {
          error: "No response generated",
          pathname: pathname,
          timestamp: new Date().toISOString()
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
  },

  // ── Cron 핸들러: 매 실행마다 metricz 1 chunk 처리 (subrequest 한도 대응) ──
  // Cloudflare Workers subrequest 한도: Free=50, Paid=1000
  // chunk당 20종목 × 2 endpoints = 40 subrequests → 한도 이내
  // KV에 chunk 포인터 저장 → 매 cron마다 다음 chunk → 전체 순환 완료 후 discovery/breakout
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const kv = env.METRICZ_KV
        const apiKey = env.FMP_API_KEY
        if (!kv || !apiKey) return

        const universe = await getSP500Symbols(kv, apiKey)
        const CHUNK_SIZE = 15
        const totalChunks = Math.ceil(universe.length / CHUNK_SIZE)

        // KV에서 현재 chunk 포인터 읽기
        let chunkPtr = 0
        try {
          const ptr = await kv.get('METRICZ_CHUNK_PTR')
          if (ptr) chunkPtr = parseInt(ptr) || 0
        } catch(e) {}

        // 범위 초과 → 0으로 리셋 (한 사이클 완료)
        if (chunkPtr >= totalChunks) chunkPtr = 0

        console.log(`🔄 Cron: chunk ${chunkPtr}/${totalChunks} (${universe.length}종목)`)
        const result = await refreshMetriczCache(env, chunkPtr)
        console.log(`✅ Cron chunk ${chunkPtr}: ${result.success}/${result.total} 성공, 누적 ${result.cumulative}`)

        // 다음 chunk 포인터 저장
        const nextPtr = chunkPtr + 1
        await kv.put('METRICZ_CHUNK_PTR', String(nextPtr), { expirationTtl: 24 * 3600 })

        // 전체 사이클 완료 시 discovery/breakout 갱신
        if (nextPtr >= totalChunks) {
          console.log(`🏁 metricz 전체 사이클 완료 → discovery/breakout 갱신`)
          await refreshDiscoveryCache(env)
          await refreshBreakoutCache(env)
          // 포인터 리셋
          await kv.put('METRICZ_CHUNK_PTR', '0', { expirationTtl: 24 * 3600 })
        }
      } catch(e) {
        console.error('❌ Cron 실행 에러:', e.message)
      }
    })())
  }
}
