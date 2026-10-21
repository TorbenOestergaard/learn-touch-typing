import { useEffect, useRef, useState } from 'react'

export interface ChartPoint {
  x: number
  y: number
  /** Tooltip text for this point. */
  label: string
}

interface Props {
  points: ChartPoint[]
  /** Accessible name; the visible title is outside the chart. */
  title: string
  yMin: number
  yMax: number
  /** A dashed reference line, e.g. the required speed. */
  goal?: { y: number; label: string }
  formatY: (y: number) => string
  formatX: (x: number) => string
}

const H = 170
const PAD = { top: 14, right: 64, bottom: 24, left: 40 }

/** A single-series line chart in plain SVG, with a hover tooltip per point. */
export function LineChart({ points, title, yMin, yMax, goal, formatY, formatX }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  // The viewBox follows the rendered width, so text keeps its size from phone to desktop.
  const ref = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setW(Math.max(200, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const xs = points.map((p) => p.x)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const sx = (x: number) => PAD.left + (x1 === x0 ? plotW / 2 : ((x - x0) / (x1 - x0)) * plotW)
  const sy = (y: number) => PAD.top + plotH - ((Math.min(Math.max(y, yMin), yMax) - yMin) / (yMax - yMin)) * plotH
  const ticks = [yMin, (yMin + yMax) / 2, yMax]
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const hovered = hover !== null ? points[hover] : null

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} />
            <text className="chart-tick" x={PAD.left - 6} y={sy(t)} textAnchor="end" dominantBaseline="middle">
              {formatY(t)}
            </text>
          </g>
        ))}
        {goal && (
          <g>
            <line className="chart-goal" x1={PAD.left} x2={W - PAD.right} y1={sy(goal.y)} y2={sy(goal.y)} />
            {/* In the right gutter, unless the end value's label sits there. */}
            {Math.abs(sy(goal.y) - sy(last.y)) > 14 && (
              <text className="chart-tick" x={W - PAD.right + 8} y={sy(goal.y)} dominantBaseline="middle">
                {goal.label}
              </text>
            )}
          </g>
        )}
        <text className="chart-tick" x={PAD.left} y={H - 4}>
          {formatX(x0)}
        </text>
        {x1 !== x0 && (
          <text className="chart-tick" x={W - PAD.right} y={H - 4} textAnchor="end">
            {formatX(x1)}
          </text>
        )}
        {points.length > 1 && <path className="chart-line" d={path} />}
        {hovered && <line className="chart-cross" x1={sx(hovered.x)} x2={sx(hovered.x)} y1={PAD.top} y2={PAD.top + plotH} />}
        {points.map((p, i) => (
          <circle
            key={i}
            className={`chart-dot ${i === hover ? 'on' : ''}`}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={i === hover || p === last ? 5 : 4}
          />
        ))}
        <text className="chart-value" x={sx(last.x) + 8} y={sy(last.y)} dominantBaseline="middle">
          {formatY(last.y)}
        </text>
        {/* Wide, invisible hit targets so small dots are easy to hover or tap. */}
        {points.map((p, i) => (
          <rect
            key={i}
            className="chart-hit"
            x={sx(p.x) - 12}
            y={PAD.top}
            width={24}
            height={plotH}
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
          />
        ))}
      </svg>
      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(sx(hovered.x) / W) * 100}%`,
            top: `${(sy(hovered.y) / H) * 100}%`,
            // Anchor towards the middle near the edges, so the tooltip stays inside the chart.
            translate: `${sx(hovered.x) < W / 3 ? '-15%' : sx(hovered.x) > (2 * W) / 3 ? '-85%' : '-50%'} calc(-100% - 12px)`,
          }}
        >
          {hovered.label}
        </div>
      )}
    </div>
  )
}
