import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'

const TIMEZONE_OPTIONS = [
  { label: 'KST', tz: 'Asia/Seoul', offset: 9 },
  { label: 'ET', tz: 'America/New_York', offset: -5 },
]

const RANGE_OPTIONS = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: 'YTD', range: 'ytd', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
  { label: '10Y', range: '10y', interval: '1mo' },
  { label: 'MAX', range: 'max', interval: '1mo' },
]

const styles = {
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  symbolTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  changeLabel: (positive) => ({
    fontSize: 14,
    fontWeight: 500,
    color: positive ? 'var(--green)' : 'var(--red)',
    fontVariantNumeric: 'tabular-nums',
  }),
  rangeBar: {
    display: 'flex',
    gap: 4,
  },
  rangeBtn: (isActive) => ({
    padding: '5px 10px',
    borderRadius: 4,
    border: 'none',
    background: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  ohlcBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    display: 'flex',
    gap: 16,
    fontSize: 12,
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    zIndex: 10,
    pointerEvents: 'none',
  },
  ohlcLabel: {
    color: 'var(--text-muted)',
    marginRight: 4,
  },
  tzBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginRight: 16,
  },
  tzBtn: (isActive) => ({
    padding: '4px 8px',
    borderRadius: 4,
    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
}

export default function Chart({
  symbol,
  displayName,
  price,
  change1d,
  chartData,
  loading,
  selectedRange,
  onRangeChange,
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [ohlc, setOhlc] = useState(null)
  const [timezone, setTimezone] = useState(TIMEZONE_OPTIONS[0])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e17' },
        textColor: '#8b95a5',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#1a2235' },
        horzLines: { color: '#1a2235' },
      },
      crosshair: {
        vertLine: { color: '#3b82f6', width: 1, style: 2 },
        horzLine: { color: '#3b82f6', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#1e2a3a',
      },
      timeScale: {
        borderColor: '#1e2a3a',
        timeVisible: selectedRange === '1d' || selectedRange === '5d',
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    })

    if (chartData && chartData.length > 0) {
      candleSeries.setData(chartData)
      chart.timeScale().fitContent()
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) {
        setOhlc(null)
        return
      }
      const data = param.seriesData.get(candleSeries)
      if (data) {
        setOhlc({ time: param.time, ...data })
      }
    })

    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [chartData, selectedRange])

  const changeSign = change1d >= 0 ? '+' : ''

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <div style={styles.titleSection}>
          <span style={styles.symbolTitle}>{displayName}</span>
          {price != null && (
            <>
              <span style={{ ...styles.priceLabel, color: 'var(--text-primary)' }}>
                {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={styles.changeLabel(change1d >= 0)}>
                {changeSign}{change1d?.toFixed(2)}% (1D)
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={styles.tzBar}>
            {TIMEZONE_OPTIONS.map((tz) => (
              <button
                key={tz.label}
                style={styles.tzBtn(timezone.label === tz.label)}
                onClick={() => setTimezone(tz)}
              >
                {tz.label}
              </button>
            ))}
          </div>
          <div style={styles.rangeBar}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.range}
              style={styles.rangeBtn(selectedRange === opt.range)}
              onClick={() => onRangeChange(opt.range, opt.interval)}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
      </div>
      <div style={styles.chartContainer} ref={containerRef}>
        {loading && <div style={styles.loading}>Loading chart...</div>}
        {ohlc && (
          <div style={styles.ohlcBar}>
            <span>
              <span style={styles.ohlcLabel}>Date</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {typeof ohlc.time === 'object'
                  ? `${ohlc.time.year}-${String(ohlc.time.month).padStart(2, '0')}-${String(ohlc.time.day).padStart(2, '0')}`
                  : new Date(ohlc.time * 1000).toLocaleString('ko-KR', {
                      timeZone: timezone.tz,
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      ...(selectedRange === '1d' || selectedRange === '5d' ? { hour: '2-digit', minute: '2-digit' } : {}),
                    })}
              </span>
            </span>
            <span>
              <span style={styles.ohlcLabel}>O</span>
              <span style={{ color: ohlc.close >= ohlc.open ? 'var(--green)' : 'var(--red)' }}>
                {ohlc.open?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            <span>
              <span style={styles.ohlcLabel}>H</span>
              <span style={{ color: ohlc.close >= ohlc.open ? 'var(--green)' : 'var(--red)' }}>
                {ohlc.high?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            <span>
              <span style={styles.ohlcLabel}>L</span>
              <span style={{ color: ohlc.close >= ohlc.open ? 'var(--green)' : 'var(--red)' }}>
                {ohlc.low?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            <span>
              <span style={styles.ohlcLabel}>C</span>
              <span style={{ color: ohlc.close >= ohlc.open ? 'var(--green)' : 'var(--red)' }}>
                {ohlc.close?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
