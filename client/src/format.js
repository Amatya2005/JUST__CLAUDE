export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

export function formatPercent(value, decimals = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(decimals)}%`
}

export function formatEngagement(rate) {
  const n = Number(rate)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(2)}%`
}

export function formatDateRange(start, end) {
  if (!start && !end) return 'No dates set'
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = start ? new Date(start).toLocaleDateString(undefined, opts) : '—'
  const e = end ? new Date(end).toLocaleDateString(undefined, opts) : '—'
  return `${s} → ${e}`
}
