import { useEffect, useRef, useState, useMemo } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { t } from '../i18n'

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

function getTimezoneOffsetSec(tz) {
  const now = new Date()
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = now.toLocaleString('en-US', { timeZone: tz })
  return (new Date(tzStr) - new Date(utcStr)) / 1000
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
  lang,
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [ohlc, setOhlc] = useState(null)
  const [timezone, setTimezone] = useState(TIMEZONE_OPTIONS[0])

  // Shift chart data timestamps to selected timezone
  const shiftedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    const offsetSec = getTimezoneOffsetSec(timezone.tz)
    return chartData.map((d) => ({
      ...d,
      time: d.time + offsetSec,
    }))
  }, [chartData, timezone])

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

    if (shiftedData.length > 0) {
      candleSeries.setData(shiftedData)
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
  }, [shiftedData, selectedRange])

  const changeSign = change1d >= 0 ? '+' : ''
  const showTime = selectedRange === '1d' || selectedRange === '5d'

  const formatOhlcDate = (time) => {
    if (typeof time === 'object') {
      return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`
    }
    const d = new Date(time * 1000)
    const opts = { year: 'numeric', month: '2-digit', day: '2-digit' }
    if (showTime) { opts.hour = '2-digit'; opts.minute = '2-digit' }
    return d.toLocaleString('ko-KR', opts)
  }

  const ohlcColor = ohlc ? (ohlc.close >= ohlc.open ? 'var(--green)' : 'var(--red)') : null
  const fmt = (v) => v?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={S.wrapper}>
      <div style={S.topBar}>
        <div style={S.titleSection}>
          <span style={S.symbolTitle}>{displayName}</span>
          {price != null && (
            <>
              <span style={{ ...S.priceLabel, color: 'var(--text-primary)' }}>
                {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={S.changeLabel(change1d >= 0)}>
                {changeSign}{change1d?.toFixed(2)}% (1D)
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={S.tzBar}>
            {TIMEZONE_OPTIONS.map((tz) => (
              <button
                key={tz.label}
                style={S.tzBtn(timezone.label === tz.label)}
                onClick={() => setTimezone(tz)}
              >
                {tz.label}
              </button>
            ))}
          </div>
          <div style={S.rangeBar}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.range}
                style={S.rangeBtn(selectedRange === opt.range)}
                onClick={() => onRangeChange(opt.range)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={S.chartContainer} ref={containerRef}>
        {loading && <div style={S.loading}>{t(lang, 'loading')}</div>}
        {ohlc && (
          <div style={S.ohlcBar}>
            <span><span style={S.ohlcLabel}>{t(lang, 'date')}</span><span style={{ color: 'var(--text-primary)' }}>{formatOhlcDate(ohlc.time)}</span></span>
            <span><span style={S.ohlcLabel}>O</span><span style={{ color: ohlcColor }}>{fmt(ohlc.open)}</span></span>
            <span><span style={S.ohlcLabel}>H</span><span style={{ color: ohlcColor }}>{fmt(ohlc.high)}</span></span>
            <span><span style={S.ohlcLabel}>L</span><span style={{ color: ohlcColor }}>{fmt(ohlc.low)}</span></span>
            <span><span style={S.ohlcLabel}>C</span><span style={{ color: ohlcColor }}>{fmt(ohlc.close)}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
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
  symbolTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' },
  priceLabel: { fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  changeLabel: (pos) => ({ fontSize: 14, fontWeight: 500, color: pos ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }),
  rangeBar: { display: 'flex', gap: 4 },
  rangeBtn: (a) => ({
    padding: '5px 10px', borderRadius: 4, border: 'none',
    background: a ? 'var(--accent)' : 'transparent',
    color: a ? '#fff' : 'var(--text-secondary)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
  }),
  chartContainer: { flex: 1, position: 'relative' },
  loading: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14,
  },
  ohlcBar: {
    position: 'absolute', top: 8, left: 12, display: 'flex', gap: 16,
    fontSize: 12, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums',
    zIndex: 10, pointerEvents: 'none',
  },
  ohlcLabel: { color: 'var(--text-muted)', marginRight: 4 },
  tzBar: { display: 'flex', alignItems: 'center', gap: 4, marginRight: 16 },
  tzBtn: (a) => ({
    padding: '4px 8px', borderRadius: 4,
    border: a ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: a ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: a ? 'var(--accent)' : 'var(--text-muted)',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  }),
}
