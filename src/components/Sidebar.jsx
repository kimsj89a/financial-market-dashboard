import { useState, useRef, useEffect } from 'react'
import { t } from '../i18n'

function formatPrice(price) {
  if (price == null) return '—'
  if (price > 0 && price < 10) return price.toFixed(4)
  if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return price.toFixed(2)
}

function formatChange(change) {
  if (change == null) return '—'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export default function Sidebar({
  instruments,
  activeSymbol,
  onSelect,
  onAdd,
  onRemove,
  searchResults,
  onSearch,
  searching,
  panels,
  activePanel,
  onPanelChange,
  onPanelCreate,
  onPanelDelete,
  lang,
  onLangToggle,
  onReorder,
}) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const timerRef = useRef(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  useEffect(() => {
    if (query.length >= 1) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onSearch(query)
        setShowDropdown(true)
      }, 300)
    } else {
      setShowDropdown(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [query, onSearch])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleAdd = (result) => {
    onAdd(result)
    setQuery('')
    setShowDropdown(false)
  }

  const handleNewPanel = () => {
    const name = prompt(t(lang, 'panelName'))
    if (name?.trim()) onPanelCreate(name.trim())
  }

  const existingSymbols = new Set(instruments.map((i) => i.symbol))

  return (
    <div style={S.sidebar}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <span style={S.title}>{t(lang, 'instruments')}</span>
          <button style={S.langBtn} onClick={onLangToggle}>
            {lang === 'ko' ? 'EN' : 'KO'}
          </button>
        </div>
        <div style={S.searchRow} ref={dropdownRef}>
          <input
            style={S.input}
            placeholder={t(lang, 'searchTicker')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.length >= 1 && searchResults.length) setShowDropdown(true) }}
          />
          {showDropdown && (
            <div style={S.dropdown}>
              {searching ? (
                <div style={S.dropdownLoading}>{t(lang, 'searching')}</div>
              ) : searchResults.length === 0 ? (
                <div style={S.dropdownLoading}>{t(lang, 'noResults')}</div>
              ) : (
                searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    style={S.dropdownItem}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleAdd(r)}
                  >
                    <div>
                      <div style={S.dropdownSymbol}>
                        {r.symbol}
                        {existingSymbols.has(r.symbol) && (
                          <span style={{ color: 'var(--green)', fontSize: 10, marginLeft: 6 }}>{t(lang, 'added')}</span>
                        )}
                      </div>
                      <div style={S.dropdownName}>{r.name}</div>
                    </div>
                    <span style={S.dropdownType}>{r.type}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel tabs */}
      <div style={S.panelBar}>
        {panels.map((p) => (
          <button
            key={p.id}
            style={S.panelTab(activePanel === p.id)}
            onClick={() => onPanelChange(p.id)}
            onContextMenu={(e) => {
              e.preventDefault()
              if (p.id !== 'all' && confirm(t(lang, 'deletePanel') + `: ${p.name}?`)) {
                onPanelDelete(p.id)
              }
            }}
          >
            {p.name}
          </button>
        ))}
        <button style={S.panelAddBtn} onClick={handleNewPanel}>+</button>
      </div>

      {/* Instrument list */}
      <div style={S.list}>
        {instruments.map((inst, idx) => (
          <div
            key={inst.symbol}
            draggable
            onDragStart={() => { dragItem.current = idx }}
            onDragEnter={() => { dragOver.current = idx }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => {
              if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
                onReorder(dragItem.current, dragOver.current)
              }
              dragItem.current = null
              dragOver.current = null
            }}
            style={S.item(activeSymbol === inst.symbol)}
            onMouseEnter={(e) => {
              if (activeSymbol !== inst.symbol) e.currentTarget.style.background = 'var(--bg-hover)'
              const btn = e.currentTarget.querySelector('[data-remove]')
              if (btn) btn.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              if (activeSymbol !== inst.symbol) e.currentTarget.style.background = 'transparent'
              const btn = e.currentTarget.querySelector('[data-remove]')
              if (btn) btn.style.opacity = '0'
            }}
            onClick={() => onSelect(inst.symbol)}
          >
            <div style={S.left}>
              <span style={S.symbol}>{inst.display}</span>
              <span style={S.name}>{inst.name}</span>
            </div>
            <div style={S.right}>
              <span style={S.price}>{formatPrice(inst.price)}</span>
              <span style={S.change(inst.change1d >= 0)}>
                {formatChange(inst.change1d)}
              </span>
            </div>
            <button
              data-remove
              style={S.removeBtn}
              onClick={(e) => { e.stopPropagation(); onRemove(inst.symbol) }}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const S = {
  sidebar: {
    width: 280,
    minWidth: 280,
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 14px 10px',
    borderBottom: '1px solid var(--border)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  langBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px',
    cursor: 'pointer',
  },
  searchRow: {
    display: 'flex',
    gap: 8,
    position: 'relative',
  },
  input: {
    flex: 1,
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '7px 10px',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    maxHeight: 240,
    overflowY: 'auto',
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background 0.12s',
    borderBottom: '1px solid var(--border)',
  },
  dropdownSymbol: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  dropdownName: {
    fontSize: 11,
    color: 'var(--text-muted)',
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dropdownType: {
    fontSize: 10,
    color: 'var(--text-muted)',
    padding: '2px 6px',
    background: 'var(--bg-primary)',
    borderRadius: 3,
  },
  dropdownLoading: {
    padding: '12px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  // Panel tabs
  panelBar: {
    display: 'flex',
    gap: 2,
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
    overflowX: 'auto',
    flexShrink: 0,
  },
  panelTab: (isActive) => ({
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    background: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.12s',
  }),
  panelAddBtn: {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px dashed var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Instrument list
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '2px 0',
  },
  item: (isActive) => ({
    display: 'grid',
    gridTemplateColumns: '1fr auto 20px',
    alignItems: 'center',
    gap: 8,
    padding: '10px 10px 10px 14px',
    cursor: 'pointer',
    background: isActive ? 'var(--bg-active)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    transition: 'background 0.15s',
  }),
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  symbol: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  name: {
    fontSize: 10,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  right: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 90,
  },
  price: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'SF Mono, Consolas, monospace',
  },
  change: (positive) => ({
    fontSize: 11,
    fontWeight: 600,
    color: positive ? 'var(--green)' : 'var(--red)',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'SF Mono, Consolas, monospace',
  }),
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 13,
    padding: 0,
    lineHeight: 1,
    opacity: 0,
    transition: 'opacity 0.15s',
    textAlign: 'center',
  },
}
