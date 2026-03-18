import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

const RANGE_OPTIONS = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: 'YTD', range: 'ytd', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
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

    const candleSeries = chart.addCandlestickSeries({
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
      <div style={styles.chartContainer} ref={containerRef}>
        {loading && <div style={styles.loading}>Loading chart...</div>}
      </div>
    </div>
  )
}
