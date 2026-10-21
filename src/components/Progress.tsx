import { useState } from 'react'
import { MODULES } from '../content/da/modules'
import { formatCount, formatDate, formatSpeed, pct } from '../format'
import { da } from '../i18n/da'
import { dailyActivity, recordSteps, testSeries, type RecordStep } from '../progress/series'
import { nextStarGap, starsOf, starTiers, type StarTier } from '../progress/stars'
import { chartModeOf, dailyGoalOf, speedUnitOf, type ChartMode, type Profile } from '../storage/profiles'
import { DaysChart } from './charts/DaysChart'
import { Gauge } from './charts/Gauge'
import { RecordChart } from './charts/RecordChart'
import { TargetPlot } from './charts/TargetPlot'

interface Props {
  profile: Profile
  onStartTest: (moduleId: number) => void
  onChartMode: (mode: ChartMode) => void
  onBack: () => void
}

const MODES: ChartMode[] = ['simple', 'standard', 'advanced']

export function Progress({ profile, onStartTest, onChartMode, onBack }: Props) {
  const [now] = useState(() => Date.now())
  const unit = speedUnitOf(profile)
  const speed = (kpm: number) => formatSpeed(kpm, unit)
  const withUnit = (kpm: number) => `${speed(kpm)} ${da.shortUnits[unit]}`
  const history = profile.history ?? []
  const mode = chartModeOf(profile)
  const tiers = starTiers(profile.settings)
  const minAccuracy = profile.settings.minAccuracy
  const modules = MODULES.map((m) => ({ id: m.id, steps: recordSteps(testSeries(history, m.id), minAccuracy) }))
  const tested = modules.filter((m) => m.steps.length > 0).sort((a, b) => b.steps.at(-1)!.at - a.steps.at(-1)!.at)
  const untested = modules.filter((m) => m.steps.length === 0)
  const days = dailyActivity(history, now)
  const label = (s: RecordStep) =>
    `${formatDate(s.at)}: ${withUnit(s.kpm)} · ${pct(s.accuracy)}${s.valid ? (s.isRecord ? ` · ${da.legendRecord}` : '') : ` · ${da.countsNo}`}`

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

      <section className="home-section">
        <div className="section-head">
          <h3>{da.moduleTests}</h3>
          <div className="segmented" role="radiogroup" aria-label={da.chartModeLabel}>
            {MODES.map((m) => (
              <button key={m} role="radio" aria-checked={m === mode} className={m === mode ? 'on' : ''} onClick={() => onChartMode(m)}>
                {da.chartModes[m]}
              </button>
            ))}
          </div>
        </div>
        {tested.length === 0 && <p className="banner">{da.noTests}</p>}
        <div className="progress-modules">
          {tested.map(({ id, steps }) => (
            <ModuleCard
              key={id}
              moduleId={id}
              steps={steps}
              mode={mode}
              profile={profile}
              tiers={tiers}
              speed={speed}
              withUnit={withUnit}
              label={label}
              onStartTest={() => onStartTest(id)}
            />
          ))}
        </div>
        {untested.length > 0 && (
          <ul className="untested">
            {untested.map(({ id }) => (
              <li key={id}>
                <span>
                  {da.module(id)} · <span className="muted">{da.notTested}</span>
                </span>
                <button className="test-pill small-button" onClick={() => onStartTest(id)}>
                  ⏱️ {da.takeTheTest}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-section">
        <h3>{da.yourDays}</h3>
        <div className="progress-card">
          <DaysChart
            days={days}
            goalMinutes={dailyGoalOf(profile)}
            title={da.yourDays}
            dayLabel={(d, today) => (today ? da.todayLabel : new Date(d).toLocaleDateString('da-DK', { weekday: 'short' }))}
            label={(d) => da.dayTooltip(formatDate(d.dayStart), formatCount(d.keystrokes), Math.round(d.minutes))}
          />
          <p className="muted small">{da.daysHint}</p>
        </div>
      </section>
    </div>
  )
}

function ModuleCard(p: {
  moduleId: number
  steps: RecordStep[]
  mode: ChartMode
  profile: Profile
  tiers: StarTier[]
  speed: (kpm: number) => string
  withUnit: (kpm: number) => string
  label: (s: RecordStep) => string
  onStartTest: () => void
}) {
  const valid = p.steps.filter((s) => s.valid)
  const best = valid.length ? valid.reduce((a, b) => (b.kpm > a.kpm ? b : a)) : null
  const first = valid[0]
  const bestStars = best ? starsOf(best, p.profile.settings) : 0
  const gap = best ? nextStarGap(best, bestStars, p.profile.settings) : null
  const title = da.module(p.moduleId)

  return (
    <article className="progress-card">
      <header className="progress-card-head">
        <h4>{title}</h4>
        {bestStars > 0 && <span className="stars-inline">{'★'.repeat(bestStars)}</span>}
        <span className="muted small">
          {da.attempts(p.steps.length)}
          {best && ` · ${da.recordShort(p.withUnit(best.kpm))}`}
        </span>
        <button className="test-pill small-button" onClick={p.onStartTest}>
          ⏱️ {da.takeTheTest}
        </button>
      </header>

      {p.mode === 'simple' && best ? (
        <div className="gauge-wrap">
          <Gauge value={best.kpm} first={first?.kpm} tiers={p.tiers} title={`${title}: ${p.withUnit(best.kpm)}`} />
          <div className="gauge-text">
            <span className="gauge-value">{p.speed(best.kpm)}</span>
            <span className="muted">{da.shortUnits[speedUnitOf(p.profile)]}</span>
            {first && first !== best && <span>{da.startToNow(p.speed(first.kpm), p.speed(best.kpm))}</span>}
          </div>
        </div>
      ) : p.mode === 'advanced' ? (
        <TargetPlot
          steps={p.steps}
          tiers={p.tiers}
          title={title}
          formatY={p.speed}
          formatAccuracy={pct}
          label={p.label}
          axisSpeed={da.axisSpeed}
          axisAccuracy={da.axisAccuracy}
        />
      ) : (
        <>
          <RecordChart steps={p.steps} tiers={p.tiers} title={title} formatY={p.speed} formatX={formatDate} label={p.label} />
          <div className="chart-legend muted small">
            <span>
              <i className="key-bar" /> {da.legendTest}
            </span>
            <span>
              <i className="key-stair" /> {da.legendRecord}
            </span>
            <span>
              <i className="key-invalid" /> {da.legendInvalid(pct(p.profile.settings.minAccuracy))}
            </span>
          </div>
        </>
      )}

      {gap ? (
        <p className="next-star">
          {gap.accuracyOk
            ? da.nextStarSpeed(gap.tier.stars, p.withUnit(gap.speedGap))
            : da.nextStarAccuracy(gap.tier.stars, pct(gap.tier.accuracy))}
        </p>
      ) : (
        best && <p className="next-star">{da.allStarsShort}</p>
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
              <th>{da.counts}</th>
            </tr>
          </thead>
          <tbody>
            {[...p.steps].reverse().map((s) => (
              <tr key={s.at}>
                <th>{formatDate(s.at)}</th>
                <td>{p.speed(s.kpm)}</td>
                <td>{pct(s.accuracy)}</td>
                <td>{s.stars}</td>
                <td>{s.valid ? '✓' : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  )
}
