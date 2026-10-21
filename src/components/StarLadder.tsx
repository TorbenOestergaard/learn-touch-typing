import { useState } from 'react'
import { formatSpeed, pct, type SpeedUnit } from '../format'
import { da } from '../i18n/da'
import { nextStarGap, type StarTier } from '../progress/stars'
import type { Thresholds } from '../config'

interface Props {
  result: { kpm: number; accuracy: number }
  stars: number
  thresholds: Thresholds
  tiers: StarTier[]
  unit: SpeedUnit
}

/** What the next star needs, as one pill per measure, so accuracy visibly counts as much as speed. */
export function StarLadder({ result, stars, thresholds, tiers, unit }: Props) {
  const [all, setAll] = useState(false)
  const gap = nextStarGap(result, stars, thresholds)
  const speed = (kpm: number) => formatSpeed(kpm, unit)
  return (
    <div className="star-ladder">
      {gap ? (
        <>
          <strong>{da.starLadder.next(gap.tier.stars)}</strong>
          <div className="star-pills">
            <span className={`pill ${gap.speedOk ? 'hit' : 'miss'}`}>
              {da.starLadder.speed(speed(result.kpm), speed(gap.tier.kpm))}
              {gap.speedOk ? ' ✓' : ` · ${da.starLadder.missing(speed(gap.speedGap))}`}
            </span>
            <span className={`pill ${gap.accuracyOk ? 'hit' : 'miss'}`}>
              {da.starLadder.accuracy(pct(result.accuracy), pct(gap.tier.accuracy))}
              {gap.accuracyOk ? ' ✓' : ''}
            </span>
          </div>
          <span className="muted small">
            {da.starLadder.both}{' '}
            <button className="link inline" onClick={() => setAll((v) => !v)}>
              {all ? da.starLadder.hideAll : da.starLadder.showAll}
            </button>
          </span>
        </>
      ) : (
        <strong>{da.starLadder.allReached(pct(result.accuracy), `${speed(result.kpm)} ${da.shortUnits[unit]}`)}</strong>
      )}
      {all && (
        <table className="star-table">
          <tbody>
            {tiers.map((t) => (
              <tr key={t.stars} className={t.stars <= stars ? 'reached' : ''}>
                <th>{'★'.repeat(t.stars)}</th>
                <td>{da.starLadder.row(pct(t.accuracy), speed(t.kpm))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
