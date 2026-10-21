import { useState } from 'react'
import type { DayPoint } from '../../progress/series'
import { useWidth } from './useWidth'

interface Props {
  days: DayPoint[]
  /** Daily goal in minutes; days that reached it get a dot. 0 = no goal. */
  goalMinutes: number
  dayLabel: (dayStart: number, isToday: boolean) => string
  label: (d: DayPoint) => string
  title: string
}

const H = 150
const PAD = { top: 16, bottom: 22 }

/** Keystrokes per day for the last week, today highlighted. */
export function DaysChart({ days, goalMinutes, dayLabel, label, title }: Props) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(100, ...days.map((d) => d.keystrokes))
  const slot = W / days.length
  const barW = Math.min(36, slot * 0.6)
  const plotH = H - PAD.top - PAD.bottom
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const hovered = hover !== null ? days[hover] : null

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        <line className="chart-axis" x1={0} x2={W} y1={y(0)} y2={y(0)} />
        {days.map((d, i) => {
          const today = i === days.length - 1
          const cx = i * slot + slot / 2
          return (
            <g key={d.dayStart}>
              {d.keystrokes > 0 && (
                <rect
                  className={`day-bar ${today ? 'today' : ''}`}
                  x={cx - barW / 2}
                  y={y(d.keystrokes)}
                  width={barW}
                  height={y(0) - y(d.keystrokes)}
                  rx={4}
                />
              )}
              {goalMinutes > 0 && d.minutes >= goalMinutes && (
                <circle className="day-goal" cx={cx} cy={y(d.keystrokes) - 9} r={4} />
              )}
              <text className={`chart-tick ${today ? 'strong' : ''}`} x={cx} y={H - 5} textAnchor="middle">
                {dayLabel(d.dayStart, today)}
              </text>
              <rect className="chart-hit" x={i * slot} y={0} width={slot} height={H} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <title>{label(d)}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      {hovered && hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((hover * slot + slot / 2) / W) * 100}%`,
            top: `${(y(hovered.keystrokes) / H) * 100}%`,
            translate: `${hover < 2 ? '-15%' : hover > days.length - 3 ? '-85%' : '-50%'} calc(-100% - 10px)`,
          }}
        >
          {label(hovered)}
        </div>
      )}
    </div>
  )
}
