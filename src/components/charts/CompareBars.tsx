export interface CompareItem {
  label: string
  kpm: number
  /** Today's result. */
  highlight?: boolean
  /** Below the pass accuracy, so it doesn't count. */
  invalid?: boolean
  /** Shown after the value, e.g. that it doesn't count. */
  note?: string
}

/** A few labelled horizontal bars, e.g. first test, record before and today: readable without axes. */
export function CompareBars({ items, format }: { items: CompareItem[]; format: (kpm: number) => string }) {
  const max = Math.max(...items.map((i) => i.kpm))
  return (
    <div className="compare-bars">
      {items.map((item) => (
        <div key={item.label} className={`compare-row ${item.highlight ? 'today' : ''} ${item.invalid ? 'invalid' : ''}`}>
          <span className="compare-label">{item.label}</span>
          <span className="compare-track">
            <span className="compare-fill" style={{ width: `${Math.max(4, (100 * item.kpm) / max)}%` }} />
          </span>
          <span className="compare-value">
            {format(item.kpm)}
            {item.note && <span className="muted small"> · {item.note}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
