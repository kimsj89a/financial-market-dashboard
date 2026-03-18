const SYMBOLS = [
  { symbol: '^GSPC', display: 'SPX', name: 'S&P 500' },
  { symbol: '^NDX', display: 'NDX', name: 'NASDAQ 100' },
  { symbol: '^DJI', display: 'DJI', name: 'Dow Jones Industri...' },
  { symbol: 'BTC-USD', display: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH-USD', display: 'ETH', name: 'Ethereum' },
  { symbol: 'GC=F', display: 'GOLD', name: 'Gold' },
  { symbol: 'CL=F', display: 'OIL', name: 'Crude Oil' },
  { symbol: 'EURUSD=X', display: 'EUR/USD', name: 'EUR/USD' },
  { symbol: 'EWY', display: 'EWY', name: 'iShares MSCI South Kor...' },
]

export { SYMBOLS }

export async function fetchQuote(symbol) {
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d&includePrePost=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`)
  const data = await res.json()
  const result = data.chart.result[0]
  const meta = result.meta

  const price = meta.regularMarketPrice
  const prevClose = meta.chartPreviousClose ?? meta.previousClose

  const change1d = prevClose ? ((price - prevClose) / prevClose) * 100 : 0

  return {
    price,
    prevClose,
    change1d,
  }
}

export async function fetchAllQuotes(symbols = SYMBOLS) {
  const results = await Promise.allSettled(
    symbols.map(async (s) => {
      const quote = await fetchQuote(s.symbol)
      return { ...s, ...quote }
    })
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
}

export async function searchSymbol(query) {
  const url = `/api/yahoo/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.quotes || [])
    .filter((q) => q.symbol && q.quoteType !== 'OPTION')
    .map((q) => ({
      symbol: q.symbol,
      display: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchange,
      type: q.quoteType,
    }))
}

export async function fetchChartData(symbol, range = '6mo', interval = '1d') {
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`)
  const data = await res.json()
  const result = data.chart.result[0]

  const timestamps = result.timestamp || []
  const ohlc = result.indicators.quote[0]

  return timestamps.map((t, i) => ({
    time: t,
    open: ohlc.open[i],
    high: ohlc.high[i],
    low: ohlc.low[i],
    close: ohlc.close[i],
    volume: ohlc.volume?.[i],
  })).filter((d) => d.open != null && d.close != null)
}
