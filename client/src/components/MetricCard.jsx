import './MetricCard.css'

export default function MetricCard({ label, value, hint, loading }) {
  return (
    <div className="metric-card card card-shadow">
      <span className="metric-label">{label}</span>
      {loading ? (
        <div className="skeleton" style={{ height: 30, width: '60%', marginTop: 6 }} />
      ) : (
        <span className="metric-value">{value}</span>
      )}
      {hint && <span className="metric-hint">{hint}</span>}
    </div>
  )
}
