import { useState } from 'react'
import type { RecordStep } from '../../progress/series'
import type { StarTier } from '../../progress/stars'
import { niceMax, useWidth } from './useWidth'

interface Props {
  steps: RecordStep[]
  tiers: StarTier[]
  title: string
  formatY: (kpm: number) => string
  formatX: (at: number) => string
  /** Tooltip text for an attempt. */
  label: (s: RecordStep) => string
}

const PAD = { top: 18, right: 70, bottom: 22, left: 12 }
const H = 210

/**
 * Every test as a pale bar, with the record as a staircase on top: the stair only goes up, the bars show
 * each try. Attempts under the pass accuracy are hatched and never raise the stair.
 */
export function RecordChart({ steps, tiers, title, formatY, formatX, label }: Props) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const yMax = niceMax([...steps.map((s) => s.kpm), tiers[tiers.length - 1].kpm * 1.1])
  const y = (v: number) => PAD.top + plotH - (Math.min(v, yMax) / yMax) * plotH
  const slot = plotW / steps.length
  const x = (i: number) => PAD.left + i * slot
  const barW = Math.min(28, slot * 0.6)
  const best = steps.at(-1)?.best ?? null
  const nextTier = tiers.find((t) => best === null || t.kpm > best)

  // The staircase: a flat step per attempt at the running best, joined by vertical risers.
  let stair = ''
  steps.forEach((s, i) => {
    if (s.best === null) return
    stair += `${stair ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.best).toFixed(1)} H${x(i + 1).toFixed(1)} `
  })
  const hovered = hover !== null ? steps[hover] : null
  // Tier labels sit in the right gutter: the next tier always shows, others only where they don't collide.
  const labelled: number[] = []
  for (const t of [...tiers].sort((a, b) => (a === nextTier ? -1 : b === nextTier ? 1 : 0))) {
    if (labelled.every((s) => Math.abs(y(tiers[s - 1].kpm) - y(t.kpm)) >= 13)) labelled.push(t.stars)
  }

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        <defs>
          <pattern id="invalid-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="hatch-bg" />
            <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
          </pattern>
        </defs>
        <line className="chart-axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        {tiers.map((t) => (
          <g key={t.stars}>
            <line
              className={t === nextTier ? 'chart-tier next' : 'chart-tier'}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t.kpm)}
              y2={y(t.kpm)}
            />
            {labelled.includes(t.stars) && (
              <text className={t === nextTier ? 'chart-tier-label next' : 'chart-tier-label'} x={W - PAD.right + 6} y={y(t.kpm)} dominantBaseline="middle">
                {'★'.repeat(t.stars)} {formatY(t.kpm)}
              </text>
            )}
          </g>
        ))}
        {steps.map((s, i) => (
          <rect
            key={i}
            className={`chart-bar ${s.valid ? '' : 'invalid'} ${i === steps.length - 1 ? 'latest' : ''} ${i === hover ? 'on' : ''}`}
            x={x(i) + (slot - barW) / 2}
            y={y(s.kpm)}
            width={barW}
            height={Math.max(1, y(0) - y(s.kpm))}
            rx={4}
          />
        ))}
        {stair && <path className="chart-stair" d={stair} />}
        {steps.map((s, i) =>
          s.isRecord ? <circle key={i} className="chart-record" cx={x(i) + slot / 2} cy={y(s.kpm)} r={4} /> : null,
        )}
        {best !== null && (
          <text className="chart-value" x={x(steps.length - 1) + slot / 2} y={y(best) - 9} textAnchor="middle">
            {formatY(best)}
          </text>
        )}
        <text className="chart-tick" x={x(0) + slot / 2} y={H - 5} textAnchor="middle">
          {formatX(steps[0].at)}
        </text>
        {steps.length > 1 && (
          <text className="chart-tick" x={x(steps.length - 1) + slot / 2} y={H - 5} textAnchor="middle">
            {formatX(steps[steps.length - 1].at)}
          </text>
        )}
        {steps.map((s, i) => (
          <rect
            key={i}
            className="chart-hit"
            x={x(i)}
            y={PAD.top}
            width={slot}
            height={plotH}
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
          >
            <title>{label(s)}</title>
          </rect>
        ))}
      </svg>
      {hovered && hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((x(hover) + slot / 2) / W) * 100}%`,
            top: `${(y(hovered.kpm) / H) * 100}%`,
            translate: `${hover < steps.length / 3 ? '-15%' : hover > (2 * steps.length) / 3 ? '-85%' : '-50%'} calc(-100% - 10px)`,
          }}
        >
          {label(hovered)}
        </div>
      )}
    </div>
  )
}
