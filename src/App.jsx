import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import { fetchAllQuotes, fetchQuote, fetchChartData, searchSymbol, SYMBOLS } from './api/finance'
import './index.css'

const STORAGE_KEY = 'finance-dashboard-symbols'

const RANGE_MAP = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1h',
  '6mo': '1d',
  'ytd': '1d',
  '1y': '1d',
  '5y': '1wk',
}

function loadSavedSymbols() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return SYMBOLS
}

function saveSymbols(symbols) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols.map(({ symbol, display, name }) => ({ symbol, display, name }))))
}

export default function App() {
  const [symbolList, setSymbolList] = useState(loadSavedSymbols)
  const [instruments, setInstruments] = useState(
    symbolList.map((s) => ({ ...s, price: null, change1d: null }))
  )
  const [activeSymbol, setActiveSymbol] = useState('BTC-USD')
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState('6mo')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Fetch all quotes
  const refreshQuotes = useCallback((symbols) => {
    fetchAllQuotes(symbols).then((data) => {
      setInstruments(data)
    })
  }, [])

  useEffect(() => {
    refreshQuotes(symbolList)
    const timer = setInterval(() => refreshQuotes(symbolList), 60000)
    return () => clearInterval(timer)
  }, [symbolList, refreshQuotes])

  // Chart data
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

  // Add symbol
  const handleAdd = useCallback(async (result) => {
    if (symbolList.some((s) => s.symbol === result.symbol)) {
      setActiveSymbol(result.symbol)
      return
    }
    const newEntry = { symbol: result.symbol, display: result.display || result.symbol, name: result.name }
    const newList = [...symbolList, newEntry]
    setSymbolList(newList)
    saveSymbols(newList)
    setInstruments((prev) => [...prev, { ...newEntry, price: null, change1d: null }])
    setActiveSymbol(result.symbol)
    // Fetch quote for the new symbol
    try {
      const quote = await fetchQuote(result.symbol)
      setInstruments((prev) => prev.map((i) => i.symbol === result.symbol ? { ...i, ...quote } : i))
    } catch {}
  }, [symbolList])

  // Remove symbol
  const handleRemove = useCallback((symbol) => {
    const newList = symbolList.filter((s) => s.symbol !== symbol)
    setSymbolList(newList)
    saveSymbols(newList)
    setInstruments((prev) => prev.filter((i) => i.symbol !== symbol))
    if (activeSymbol === symbol && newList.length > 0) {
      setActiveSymbol(newList[0].symbol)
    }
  }, [symbolList, activeSymbol])

  // Search
  const handleSearch = useCallback(async (query) => {
    setSearching(true)
    try {
      const results = await searchSymbol(query)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }, [])

  const active = instruments.find((i) => i.symbol === activeSymbol) || {}

  return (
    <>
      <Sidebar
        instruments={instruments}
        activeSymbol={activeSymbol}
        onSelect={setActiveSymbol}
        onAdd={handleAdd}
        onRemove={handleRemove}
        searchResults={searchResults}
        onSearch={handleSearch}
        searching={searching}
      />
      <Chart
        symbol={activeSymbol}
        displayName={active.display || activeSymbol}
        price={active.price}
        change1d={active.change1d}
        chartData={chartData}
        loading={chartLoading}
        selectedRange={selectedRange}
        onRangeChange={(range) => setSelectedRange(range)}
      />
    </>
  )
}
