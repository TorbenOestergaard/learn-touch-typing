import { requiredKpm } from '../config'
import { MODULES } from '../content/da/modules'
import { formatDate, formatSpeed, pct, speedUnitLabel } from '../format'
import { da } from '../i18n/da'
import { testSeries, weeklySpeed, type TestPoint } from '../progress/series'
import { speedUnitOf, type Profile } from '../storage/profiles'
import { LineChart } from './LineChart'

interface Props {
  profile: Profile
  onStartTest: (moduleId: number) => void
  onBack: () => void
}

/** Speed axis top: a multiple of 60 kpm, so ticks are round in both kpm and kps. */
const speedMax = (values: number[]) => Math.max(60, Math.ceil((Math.max(...values) * 1.1) / 60) * 60)
/** Accuracy axis bottom: a whole 10 % step below the lowest value, at least 50 %. */
const accuracyMin = (values: number[]) => Math.max(0.5, Math.floor((Math.min(...values) - 0.01) * 10) / 10)

export function Progress({ profile, onStartTest, onBack }: Props) {
  const unit = speedUnitOf(profile)
  const speed = (kpm: number) => formatSpeed(kpm, unit)
  const history = profile.history ?? []
  const goalKpm = requiredKpm(profile.settings)
  const weeks = weeklySpeed(history)
  const modules = MODULES.map((m) => ({ module: m, tests: testSeries(history, m.id) })).filter((m) => m.tests.length > 0)

  return (
    <div className="progress">
      <header className="typing-header">
        <button className="link" onClick={onBack}>
          ← {da.toHome}
        </button>
        <h2>
          {profile.avatar} {da.progress}
        </h2>
        <span />
      </header>
      <p className="muted">{da.progressIntro}</p>

      {weeks.length > 0 && (
        <section className="home-section">
          <h3>{da.weeklySpeed}</h3>
          <p className="muted small">{da.weeklySpeedHint(speedUnitLabel(unit))}</p>
          {weeks.length > 1 ? (
            <LineChart
              title={da.weeklySpeed}
              points={weeks.map((w) => ({
                x: w.weekStart,
                y: w.avgKpm,
                label: `${da.weekOf(formatDate(w.weekStart))}: ${speed(w.avgKpm)} · ${da.attempts(w.attempts)}`,
              }))}
              yMin={0}
              yMax={speedMax([...weeks.map((w) => w.avgKpm), goalKpm])}
              goal={{ y: goalKpm, label: `${da.goalShort} ${speed(goalKpm)}` }}
              formatY={speed}
              formatX={formatDate}
            />
          ) : (
            <p className="single-value">{speed(weeks[0].avgKpm)}</p>
          )}
        </section>
      )}

      <section className="home-section">
        <h3>{da.moduleTests}</h3>
        {modules.length === 0 && <p className="banner">{da.noTests}</p>}
        <div className="progress-modules">
          {modules.map(({ module: m, tests }) => (
            <ModuleCard
              key={m.id}
              moduleId={m.id}
              tests={tests}
              goalKpm={goalKpm}
              minAccuracy={profile.settings.minAccuracy}
              speed={speed}
              unitLabel={speedUnitLabel(unit)}
              onStartTest={() => onStartTest(m.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ModuleCard(p: {
  moduleId: number
  tests: TestPoint[]
  goalKpm: number
  minAccuracy: number
  speed: (kpm: number) => string
  unitLabel: string
  onStartTest: () => void
}) {
  const last = p.tests[p.tests.length - 1]
  const best = Math.max(...p.tests.map((t) => t.kpm))
  const label = (t: TestPoint) =>
    `${formatDate(t.at)}: ${p.speed(t.kpm)} · ${pct(t.accuracy)}${t.stars ? ` · ${'★'.repeat(t.stars)}` : ''}`
  const points = (y: (t: TestPoint) => number) => p.tests.map((t) => ({ x: t.at, y: y(t), label: label(t) }))

  return (
    <article className="progress-card">
      <header className="progress-card-head">
        <h4>{da.module(p.moduleId)}</h4>
        <span className="muted small">{da.attempts(p.tests.length)}</span>
        <button className="secondary small-button" onClick={p.onStartTest}>
          {da.checkForm}
        </button>
      </header>
      <p className="muted small">
        {da.latest}: {p.speed(last.kpm)} · {pct(last.accuracy)} — {da.best}: {p.speed(best)}
      </p>
      {p.tests.length < 2 ? (
        <p className="muted small">{da.onePoint}</p>
      ) : (
        <div className="chart-pair">
          <figure>
            <figcaption>
              {da.speed} <span className="muted">({p.unitLabel})</span>
            </figcaption>
            <LineChart
              title={`${da.module(p.moduleId)}: ${da.speed}`}
              points={points((t) => t.kpm)}
              yMin={0}
              yMax={speedMax([...p.tests.map((t) => t.kpm), p.goalKpm])}
              goal={{ y: p.goalKpm, label: `${da.goalShort} ${p.speed(p.goalKpm)}` }}
              formatY={p.speed}
              formatX={formatDate}
            />
          </figure>
          <figure>
            <figcaption>{da.accuracy}</figcaption>
            <LineChart
              title={`${da.module(p.moduleId)}: ${da.accuracy}`}
              points={points((t) => t.accuracy)}
              yMin={accuracyMin([...p.tests.map((t) => t.accuracy), p.minAccuracy])}
              yMax={1}
              goal={{ y: p.minAccuracy, label: `${da.goalShort} ${pct(p.minAccuracy)}` }}
              formatY={pct}
              formatX={formatDate}
            />
          </figure>
        </div>
      )}
      <details>
        <summary className="muted small">{da.showNumbers}</summary>
        <table className="activity">
          <thead>
            <tr>
              <th>{da.date}</th>
              <th>{da.speed}</th>
              <th>{da.accuracy}</th>
              <th>⭐</th>
            </tr>
          </thead>
          <tbody>
            {[...p.tests].reverse().map((t) => (
              <tr key={t.at}>
                <th>{formatDate(t.at)}</th>
                <td>{p.speed(t.kpm)}</td>
                <td>{pct(t.accuracy)}</td>
                <td>{t.stars}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  )
}
