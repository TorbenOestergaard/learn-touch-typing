import { useState } from 'react'
import type { RecordStep } from '../../progress/series'
import type { StarTier } from '../../progress/stars'
import { niceMax, useWidth } from './useWidth'

interface Props {
  steps: RecordStep[]
  tiers: StarTier[]
  title: string
  formatY: (kpm: number) => string
  formatAccuracy: (a: number) => string
  label: (s: RecordStep) => string
  axisSpeed: string
  axisAccuracy: string
}

const H = 240
const PAD = { top: 12, right: 14, bottom: 34, left: 44 }

/**
 * Accuracy across, speed up: each test is a dot, and the star zones nest in the top-right corner.
 * One measure per axis; older dots fade, the latest is large.
 */
export function TargetPlot({ steps, tiers, title, formatY, formatAccuracy, label, axisSpeed, axisAccuracy }: Props) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const xMin = Math.min(0.9, Math.floor(Math.min(...steps.map((s) => s.accuracy)) * 20) / 20)
  const yMax = niceMax([...steps.map((s) => s.kpm), tiers[tiers.length - 1].kpm * 1.1])
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (a: number) => PAD.left + ((Math.max(a, xMin) - xMin) / (1 - xMin)) * plotW
  const y = (v: number) => PAD.top + plotH - (Math.min(v, yMax) / yMax) * plotH
  const hovered = hover !== null ? steps[hover] : null

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {tiers.map((t) => (
          <g key={t.stars}>
            <rect className={`target-zone z${t.stars}`} x={x(t.accuracy)} y={PAD.top} width={x(1) - x(t.accuracy)} height={y(t.kpm) - PAD.top} />
            <text className="chart-tick" x={x(1) - 4} y={y(t.kpm) - 5} textAnchor="end">
              {'★'.repeat(t.stars)}
            </text>
          </g>
        ))}
        <line className="chart-axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        <line className="chart-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={y(0)} />
        {[0, tiers[0].kpm, tiers[2].kpm].map((v) => (
          <text key={v} className="chart-tick" x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
            {formatY(v)}
          </text>
        ))}
        {[xMin, tiers[0].accuracy, 1].map((a) => (
          <text key={a} className="chart-tick" x={x(a)} y={y(0) + 14} textAnchor="middle">
            {formatAccuracy(a)}
          </text>
        ))}
        <text className="chart-tick" x={PAD.left + plotW / 2} y={H - 4} textAnchor="middle">
          {axisAccuracy} →
        </text>
        <text className="chart-tick" x={12} y={PAD.top + plotH / 2} textAnchor="middle" transform={`rotate(-90 12 ${PAD.top + plotH / 2})`}>
          {axisSpeed} →
        </text>
        <polyline className="target-trail" points={steps.map((s) => `${x(s.accuracy).toFixed(1)},${y(s.kpm).toFixed(1)}`).join(' ')} />
        {steps.map((s, i) => {
          const latest = i === steps.length - 1
          const age = steps.length > 1 ? i / (steps.length - 1) : 1
          return (
            <circle
              key={i}
              className={`target-dot ${s.valid ? '' : 'invalid'} ${latest ? 'latest' : ''}`}
              cx={x(s.accuracy)}
              cy={y(s.kpm)}
              r={latest ? 7 : i === hover ? 6 : 4}
              style={s.valid && !latest ? { fillOpacity: 0.3 + 0.55 * age } : undefined}
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(i)}
            >
              <title>{label(s)}</title>
            </circle>
          )
        })}
      </svg>
      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: `${(x(hovered.accuracy) / W) * 100}%`, top: `${(y(hovered.kpm) / H) * 100}%`, translate: '-50% calc(-100% - 10px)' }}
        >
          {label(hovered)}
        </div>
      )}
    </div>
  )
}
