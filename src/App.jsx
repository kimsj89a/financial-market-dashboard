import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Chart from './components/Chart'
import { fetchAllQuotes, fetchQuote, fetchChartData, searchSymbol, SYMBOLS } from './api/finance'
import { loadLang, saveLang } from './i18n'
import './index.css'

const STORAGE_KEY = 'finance-dashboard-symbols'
const PANELS_KEY = 'finance-dashboard-panels'

const RANGE_MAP = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1h',
  '6mo': '1d',
  'ytd': '1d',
  '1y': '1d',
  '5y': '1wk',
  '10y': '1mo',
  'max': '1mo',
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

function loadPanels() {
  try {
    const saved = localStorage.getItem(PANELS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return [{ id: 'all', name: 'All', symbols: null }]
}

function savePanels(panels) {
  localStorage.setItem(PANELS_KEY, JSON.stringify(panels))
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
  const [panels, setPanels] = useState(loadPanels)
  const [activePanel, setActivePanel] = useState('all')
  const [lang, setLang] = useState(loadLang)

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

  // Add symbol (also adds to active panel if not "all")
  const handleAdd = useCallback(async (result) => {
    if (symbolList.some((s) => s.symbol === result.symbol)) {
      // If panel is not "all", add to panel
      if (activePanel !== 'all') {
        setPanels((prev) => {
          const updated = prev.map((p) => {
            if (p.id === activePanel && p.symbols && !p.symbols.includes(result.symbol)) {
              return { ...p, symbols: [...p.symbols, result.symbol] }
            }
            return p
          })
          savePanels(updated)
          return updated
        })
      }
      setActiveSymbol(result.symbol)
      return
    }
    const newEntry = { symbol: result.symbol, display: result.display || result.symbol, name: result.name }
    const newList = [...symbolList, newEntry]
    setSymbolList(newList)
    saveSymbols(newList)
    setInstruments((prev) => [...prev, { ...newEntry, price: null, change1d: null }])
    // Add to active panel
    if (activePanel !== 'all') {
      setPanels((prev) => {
        const updated = prev.map((p) => {
          if (p.id === activePanel && p.symbols) {
            return { ...p, symbols: [...p.symbols, result.symbol] }
          }
          return p
        })
        savePanels(updated)
        return updated
      })
    }
    setActiveSymbol(result.symbol)
    try {
      const quote = await fetchQuote(result.symbol)
      setInstruments((prev) => prev.map((i) => i.symbol === result.symbol ? { ...i, ...quote } : i))
    } catch {}
  }, [symbolList, activePanel])

  // Remove symbol
  const handleRemove = useCallback((symbol) => {
    if (activePanel !== 'all') {
      // Remove from panel only
      setPanels((prev) => {
        const updated = prev.map((p) => {
          if (p.id === activePanel && p.symbols) {
            return { ...p, symbols: p.symbols.filter((s) => s !== symbol) }
          }
          return p
        })
        savePanels(updated)
        return updated
      })
    } else {
      // Remove from global list
      const newList = symbolList.filter((s) => s.symbol !== symbol)
      setSymbolList(newList)
      saveSymbols(newList)
      setInstruments((prev) => prev.filter((i) => i.symbol !== symbol))
      if (activeSymbol === symbol && newList.length > 0) {
        setActiveSymbol(newList[0].symbol)
      }
    }
  }, [symbolList, activeSymbol, activePanel])

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

  // Panels
  const handlePanelCreate = useCallback((name) => {
    const id = 'panel_' + Date.now()
    const updated = [...panels, { id, name, symbols: [] }]
    setPanels(updated)
    savePanels(updated)
    setActivePanel(id)
  }, [panels])

  const handlePanelDelete = useCallback((id) => {
    const updated = panels.filter((p) => p.id !== id)
    setPanels(updated)
    savePanels(updated)
    setActivePanel('all')
  }, [panels])

  // Reorder
  const handleReorder = useCallback((fromIdx, toIdx) => {
    setSymbolList((prev) => {
      // If viewing a panel, reorder within panel's filtered view
      const panel = panels.find((p) => p.id === activePanel)
      if (panel?.symbols) {
        const syms = [...panel.symbols]
        const [moved] = syms.splice(fromIdx, 1)
        syms.splice(toIdx, 0, moved)
        const updatedPanels = panels.map((p) => p.id === activePanel ? { ...p, symbols: syms } : p)
        setPanels(updatedPanels)
        savePanels(updatedPanels)
        return prev
      }
      // Reorder global list
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      saveSymbols(next)
      return next
    })
  }, [panels, activePanel])

  // Lang
  const handleLangToggle = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next)
    saveLang(next)
  }

  // Filter instruments by active panel
  const currentPanel = panels.find((p) => p.id === activePanel)
  const filteredInstruments = currentPanel?.symbols
    ? instruments.filter((i) => currentPanel.symbols.includes(i.symbol))
    : instruments

  const active = instruments.find((i) => i.symbol === activeSymbol) || {}

  return (
    <>
      <Sidebar
        instruments={filteredInstruments}
        activeSymbol={activeSymbol}
        onSelect={setActiveSymbol}
        onAdd={handleAdd}
        onRemove={handleRemove}
        searchResults={searchResults}
        onSearch={handleSearch}
        searching={searching}
        panels={panels}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onPanelCreate={handlePanelCreate}
        onPanelDelete={handlePanelDelete}
        lang={lang}
        onLangToggle={handleLangToggle}
        onReorder={handleReorder}
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
        lang={lang}
      />
    </>
  )
}
