import { da } from '../i18n/da'
import type { Achievement, AchievementStatus } from '../progress/achievements'
import { formatCount } from '../format'

const textOf = (a: Achievement) => da.achievementText[a.type](a.n)

/** All achievements, with locked ones greyed out. */
export function AchievementGrid({ items }: { items: AchievementStatus[] }) {
  return (
    <ul className="achievements">
      {items.map((a) => {
        const { title, desc } = textOf(a)
        return (
          <li key={a.id} className={`achievement ${a.unlocked ? 'unlocked' : 'locked'}`} title={desc}>
            <span className="achievement-emoji" aria-hidden>
              {a.emoji}
            </span>
            <strong>{title}</strong>
            <span className="muted small">{desc}</span>
            {!a.unlocked && a.progress && a.progress.have > 0 && (
              <span className="achievement-progress">
                <span className="bar">
                  <span style={{ width: `${(100 * a.progress.have) / a.progress.need}%` }} />
                </span>
                <span className="muted small">
                  {formatCount(a.progress.have)} / {formatCount(a.progress.need)}
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Shown on result screens when the attempt just unlocked something. */
export function NewAchievements({ items }: { items: Achievement[] }) {
  if (items.length === 0) return null
  return (
    <div className="new-achievements" role="status">
      <h3>{da.newAchievement(items.length)}</h3>
      <ul>
        {items.map((a) => {
          const { title, desc } = textOf(a)
          return (
            <li key={a.id}>
              <span className="achievement-emoji" aria-hidden>
                {a.emoji}
              </span>
              <span>
                <strong>{title}</strong>
                <span className="muted small"> {desc}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
