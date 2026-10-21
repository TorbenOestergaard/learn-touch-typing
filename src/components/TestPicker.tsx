import { MODULES } from '../content/da/modules'
import { formatSpeed } from '../format'
import { da } from '../i18n/da'
import { bestTests } from '../progress/series'
import { starsOf } from '../progress/stars'
import { speedUnitOf, testCounts, type Profile } from '../storage/profiles'

interface Props {
  profile: Profile
  /** Module shown first as the recommendation, if any. */
  recommended?: number
  onStart: (moduleId: number) => void
  onClose: () => void
}

/** Every module's test in one list: tests are always open. */
export function TestPicker({ profile, recommended, onStart, onClose }: Props) {
  const unit = speedUnitOf(profile)
  const best = bestTests(profile.history ?? [], profile.settings.minAccuracy)
  const order = recommended ? [recommended, ...MODULES.map((m) => m.id).filter((id) => id !== recommended)] : MODULES.map((m) => m.id)

  return (
    <div className="picker">
      <header className="typing-header">
        <button className="link" onClick={onClose}>
          ← {da.close}
        </button>
        <h2>{da.pickerTitle}</h2>
        <span />
      </header>
      <p className="muted">{da.pickerIntro}</p>
      <ul className="picker-list">
        {order.map((id) => {
          const m = MODULES.find((x) => x.id === id)!
          const t = best.get(id)
          const stars = t ? starsOf(t, profile.settings) : 0
          const isRecommended = id === recommended
          return (
            <li key={id} className={`picker-row ${isRecommended ? 'recommended' : ''}`}>
              <div className="picker-info">
                {isRecommended && <span className="picker-tag">{da.recommended}</span>}
                <strong>
                  {da.module(id)}{' '}
                  <span className="picker-keys">
                    {m.newKeys.map((k) => k.toUpperCase()).join(' ')}
                    {m.introducesShift ? ' ⇧' : ''}
                  </span>
                </strong>
                <span className="muted small">
                  {t ? da.bestShort(`${formatSpeed(t.kpm, unit)} ${da.shortUnits[unit]}`) : da.notTested}
                  {!testCounts(profile, id) && ` · ${da.countsLater}`}
                </span>
              </div>
              <span className="picker-stars" aria-label={da.stars(stars)}>
                <span className="on">{'★'.repeat(stars)}</span>
                <span className="off">{'★'.repeat(3 - stars)}</span>
              </span>
              <button className={isRecommended ? 'test-go' : 'test-pill'} onClick={() => onStart(id)}>
                {da.takeTheTest}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
