import { useState } from 'react'

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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
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
}

function formatPrice(price, symbol) {
  if (price == null) return '—'
  if (symbol === 'EUR/USD') return price.toFixed(4)
  if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 100) return price.toFixed(2)
  return price.toFixed(2)
}

function formatChange(change) {
  if (change == null) return '—'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export default function Sidebar({ instruments, activeSymbol, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = instruments.filter(
    (i) =>
      i.display.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.title}>Instruments</div>
        <div style={styles.searchRow}>
          <input
            style={styles.input}
            placeholder="Add symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button style={styles.addBtn}>+</button>
        </div>
      </div>
      <div style={styles.list}>
        {filtered.map((inst) => (
          <div
            key={inst.symbol}
            style={styles.item(activeSymbol === inst.symbol)}
            onMouseEnter={(e) => {
              if (activeSymbol !== inst.symbol) e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              if (activeSymbol !== inst.symbol) e.currentTarget.style.background = 'transparent'
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
          </div>
        ))}
      </div>
    </div>
  )
}
