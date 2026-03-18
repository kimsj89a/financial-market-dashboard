import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import { fetchAllQuotes, fetchChartData, SYMBOLS } from './api/finance'
import './index.css'

const RANGE_MAP = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1h',
  '6mo': '1d',
  'ytd': '1d',
  '1y': '1d',
  '5y': '1wk',
}

export default function App() {
  const [instruments, setInstruments] = useState(
    SYMBOLS.map((s) => ({ ...s, price: null, change1d: null }))
  )
  const [activeSymbol, setActiveSymbol] = useState('BTC-USD')
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState('6mo')

  // Fetch all quotes on mount
  useEffect(() => {
    fetchAllQuotes().then((data) => {
      setInstruments(data)
    })

    // Refresh every 60s
    const timer = setInterval(() => {
      fetchAllQuotes().then((data) => {
        setInstruments(data)
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Fetch chart data when symbol or range changes
  const loadChart = useCallback(async (symbol, range) => {
    setChartLoading(true)
    try {
      const interval = RANGE_MAP[range] || '1d'
      const data = await fetchChartData(symbol, range, interval)
      setChartData(data)
    } catch {
      setChartData([])
    }
    setChartLoading(false)
  }, [])

  useEffect(() => {
    loadChart(activeSymbol, selectedRange)
  }, [activeSymbol, selectedRange, loadChart])

  const handleRangeChange = (range) => {
    setSelectedRange(range)
  }

  const active = instruments.find((i) => i.symbol === activeSymbol) || {}

  return (
    <>
      <Sidebar
        instruments={instruments}
        activeSymbol={activeSymbol}
        onSelect={setActiveSymbol}
      />
      <Chart
        symbol={activeSymbol}
        displayName={active.display || activeSymbol}
        price={active.price}
        change1d={active.change1d}
        chartData={chartData}
        loading={chartLoading}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />
    </>
  )
}
