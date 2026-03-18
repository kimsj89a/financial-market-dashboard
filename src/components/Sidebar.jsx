import { useState, useRef, useEffect } from 'react'

const styles = {
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
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    marginBottom: 10,
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
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  item: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    background: isActive ? 'var(--bg-active)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    transition: 'background 0.15s',
  }),
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  symbol: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  name: {
    fontSize: 11,
    color: 'var(--text-muted)',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  right: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  change: (positive) => ({
    fontSize: 12,
    fontWeight: 500,
    color: positive ? 'var(--green)' : 'var(--red)',
    fontVariantNumeric: 'tabular-nums',
  }),
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 4px',
    borderRadius: 3,
    lineHeight: 1,
    opacity: 0,
    transition: 'opacity 0.15s',
  },
}

function formatPrice(price, symbol) {
  if (price == null) return '—'
  if (symbol === 'EUR/USD' || (price > 0 && price < 10)) return price.toFixed(4)
  if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return price.toFixed(2)
}

function formatChange(change) {
  if (change == null) return '—'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export default function Sidebar({ instruments, activeSymbol, onSelect, onAdd, onRemove, searchResults, onSearch, searching }) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const timerRef = useRef(null)

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

  const existingSymbols = new Set(instruments.map((i) => i.symbol))

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.title}>Instruments</div>
        <div style={styles.searchRow} ref={dropdownRef}>
          <input
            style={styles.input}
            placeholder="Search ticker..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.length >= 1 && searchResults.length) setShowDropdown(true) }}
          />
          {showDropdown && (
            <div style={styles.dropdown}>
              {searching ? (
                <div style={styles.dropdownLoading}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={styles.dropdownLoading}>No results</div>
              ) : (
                searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleAdd(r)}
                  >
                    <div>
                      <div style={styles.dropdownSymbol}>
                        {r.symbol}
                        {existingSymbols.has(r.symbol) && (
                          <span style={{ color: 'var(--green)', fontSize: 10, marginLeft: 6 }}>Added</span>
                        )}
                      </div>
                      <div style={styles.dropdownName}>{r.name}</div>
                    </div>
                    <span style={styles.dropdownType}>{r.type}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div style={styles.list}>
        {instruments.map((inst) => (
          <div
            key={inst.symbol}
            style={styles.item(activeSymbol === inst.symbol)}
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
            <div style={styles.left}>
              <span style={styles.symbol}>{inst.display}</span>
              <span style={styles.name}>{inst.name}</span>
            </div>
            <div style={styles.right}>
              <span style={styles.price}>{formatPrice(inst.price, inst.display)}</span>
              <span style={styles.change(inst.change1d >= 0)}>
                {formatChange(inst.change1d)}
              </span>
            </div>
            <button
              data-remove
              style={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); onRemove(inst.symbol) }}
              title="Remove"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
