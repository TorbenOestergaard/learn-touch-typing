import { EXERCISES_PER_MODULE } from '../config'
import { MODULES } from '../content/da/modules'
import { da } from '../i18n/da'
import { bestTests } from '../progress/series'
import { starsOf } from '../progress/stars'
import {
  exerciseKey,
  isUnlocked,
  nextExercise,
  totalStars,
  type ExerciseId,
  type Profile,
} from '../storage/profiles'

interface Props {
  profile: Profile
  onStart: (moduleId: number, ex: ExerciseId) => void
  onHome: () => void
}

export function ModuleMap({ profile, onStart, onHome }: Props) {
  const next = nextExercise(profile)
  const best = bestTests(profile.history ?? [], profile.settings.minAccuracy)
  const bestStars = (id: number) => {
    const t = best.get(id)
    return t ? starsOf(t, profile.settings) : 0
  }
  const exercises: ExerciseId[] = [...Array.from({ length: EXERCISES_PER_MODULE }, (_, i) => i), 'test']

  return (
    <div className="map">
      <header className="typing-header">
        <button className="link" onClick={onHome}>
          ← {da.toHome}
        </button>
        <h2>
          {profile.avatar} {da.training}
        </h2>
        <span className="muted">{da.stars(totalStars(profile))}</span>
      </header>

      {next ? (
        <button className="big" autoFocus onClick={() => onStart(next.moduleId, next.ex)}>
          {da.continue}: {da.module(next.moduleId)} ·{' '}
          {next.ex === 'test' ? da.test : da.exercise(next.ex + 1)}
        </button>
      ) : (
        <p className="banner">{da.allDone}</p>
      )}

      <ol className="modules">
        {MODULES.map((m) => {
          const open = isUnlocked(profile, m.id, 0)
          return (
            <li key={m.id} className={`module ${open ? '' : 'locked'}`}>
              <div className="module-head">
                <h3>{da.module(m.id)}</h3>
                <div className="module-keys" title={da.newKeys}>
                  {m.newKeys.map((k) => (
                    <kbd key={k}>{k.toUpperCase()}</kbd>
                  ))}
                  {m.introducesShift && <kbd>⇧</kbd>}
                </div>
                <button className="test-pill small-button module-test" onClick={() => onStart(m.id, 'test')}>
                  ⏱️ {da.takeTheTest}
                  {bestStars(m.id) > 0 && <span className="stars-inline"> {'★'.repeat(bestStars(m.id))}</span>}
                </button>
              </div>
              <div className="bubbles">
                {exercises.map((ex) => {
                  const rec = profile.progress[exerciseKey(m.id, ex)]
                  const unlocked = isUnlocked(profile, m.id, ex)
                  const label = ex === 'test' ? '🏆' : String(ex + 1)
                  return (
                    <button
                      key={ex}
                      className={`bubble ${rec?.passed ? 'passed' : ''} ${ex === 'test' ? 'test' : ''}`}
                      disabled={!unlocked}
                      title={ex === 'test' ? da.moduleTest(m.id) : da.exercise(ex + 1)}
                      onClick={() => onStart(m.id, ex)}
                    >
                      <span>{label}</span>
                      <span className="bubble-stars">
                        {rec?.bestStars ? '★'.repeat(rec.bestStars) : unlocked ? '' : '🔒'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="version">{da.version(__APP_VERSION__)}</p>
    </div>
  )
}
