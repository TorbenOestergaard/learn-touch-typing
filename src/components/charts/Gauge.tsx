import type { StarTier } from '../../progress/stars'
import { niceMax } from './useWidth'

interface Props {
  /** Best valid speed, keystrokes per minute. */
  value: number
  /** First valid speed, drawn as a faint needle. */
  first?: number
  tiers: StarTier[]
  title: string
}

const CX = 110
const CY = 112
const R = 88

/** A speedometer with one coloured zone per star; the needle shows the best test. */
export function Gauge({ value, first, tiers, title }: Props) {
  const max = niceMax([value * 1.1, tiers[tiers.length - 1].kpm * 1.2])
  const point = (v: number, r = R) => {
    const a = Math.PI * (1 - Math.min(v, max) / max)
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const
  }
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from)
    const [x2, y2] = point(to)
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`
  }
  const zones = [0, ...tiers.map((t) => t.kpm), max]
  const [nx, ny] = point(value, R - 14)
  const ghost = first !== undefined && first !== value ? point(first, R - 14) : null

  return (
    <svg className="gauge" viewBox="0 0 220 124" role="img" aria-label={title}>
      {zones.slice(0, -1).map((from, i) => (
        <path key={i} className={`gauge-zone z${i}`} d={arc(from, zones[i + 1])} />
      ))}
      {tiers.map((t) => {
        const [lx, ly] = point(t.kpm, R + 13)
        return (
          <text key={t.stars} className="gauge-label" x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
            {'★'.repeat(t.stars)}
          </text>
        )
      })}
      {ghost && <line className="gauge-ghost" x1={CX} y1={CY} x2={ghost[0]} y2={ghost[1]} />}
      <line className="gauge-needle" x1={CX} y1={CY} x2={nx} y2={ny} />
      <circle className="gauge-hub" cx={CX} cy={CY} r={7} />
    </svg>
  )
}
