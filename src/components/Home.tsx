import { useState } from 'react'
import { EXERCISES_PER_MODULE } from '../config'
import { MODULES } from '../content/da/modules'
import { formatCount, formatSpeed } from '../format'
import { da } from '../i18n/da'
import { achievementStatus } from '../progress/achievements'
import { latestTest, profileTestNudge, recordSteps, testSeries, type TestNudge } from '../progress/series'
import { streak, thisWeek, today, type Activity } from '../progress/streak'
import {
  dailyGoalOf,
  speedUnitOf,
  isPassedEx,
  nextExercise,
  totalStars,
  type ExerciseId,
  type Profile,
} from '../storage/profiles'
import { AchievementGrid } from './Achievements'

interface Props {
  profile: Profile
  onContinue: (moduleId: number, ex: ExerciseId) => void
  onTraining: () => void
  onTests: () => void
  onProgress: () => void
  onStories: () => void
  onSwitchProfile: () => void
  onParents: () => void
}

const exercisesOf = (): ExerciseId[] => [...Array.from({ length: EXERCISES_PER_MODULE }, (_, i) => i), 'test']

export function Home({ profile, onContinue, onTraining, onTests, onProgress, onStories, onSwitchProfile, onParents }: Props) {
  // Fixed while the screen is open; the home screen remounts on each visit.
  const [now] = useState(() => Date.now())
  const history = profile.history ?? []
  const s = streak(history, now)
  const day = today(history, now)
  const week = thisWeek(history, now)
  const next = nextExercise(profile)
  const current = next?.moduleId ?? MODULES[MODULES.length - 1].id
  const steps = exercisesOf()
  const done = steps.filter((ex) => isPassedEx(profile, current, ex)).length
  const goal = dailyGoalOf(profile)
  const achievements = achievementStatus(profile, now)
  const unlocked = achievements.filter((a) => a.unlocked).length
  const unit = speedUnitOf(profile)
  const withUnit = (kpm: number) => `${formatSpeed(kpm, unit)} ${da.shortUnits[unit]}`
  const latest = latestTest(history, profile.settings.minAccuracy)
  const latestSteps = latest ? recordSteps(testSeries(history, latest.moduleId), profile.settings.minAccuracy) : []
  const firstValid = latestSteps.find((s) => s.valid)
  const bestValid = latestSteps.at(-1)?.best ?? null
  const nudge = profileTestNudge(profile, now)
  const bestPoints = Math.max(0, ...Object.values(profile.storyBest ?? {}).map((r) => r.points))

  return (
    <div className="home">
      <header className="map-header">
        <div className="who">
          <span className="avatar">{profile.avatar}</span>
          <h2>{da.hello(profile.name)}</h2>
        </div>
        <div className="map-links">
          <button className="link" onClick={onSwitchProfile}>
            {da.switchProfile}
          </button>
          <button className="link" onClick={onParents}>
            {da.parents}
          </button>
        </div>
      </header>

      <section className="strip" aria-label={da.todayAndWeek}>
        <div className={`strip-item ${s.current > 0 ? 'lit' : ''}`}>
          <span className="strip-value">🔥 {s.current}</span>
          <span className="strip-label">{da.streakDays(s.current)}</span>
          <span className="muted small">
            {s.current > 0 && !s.today ? da.streakToday : da.bestStreak(s.best)}
          </span>
        </div>
        <div className="strip-item">
          <span className="strip-value">⌨️ {formatCount(day.keystrokes)}</span>
          <span className="strip-label">{da.keystrokesToday}</span>
        </div>
        <div className="strip-item">
          <span className="strip-value">⭐ {totalStars(profile)}</span>
          <span className="strip-label">{da.totalStars}</span>
        </div>
        {latest ? (
          <button className="strip-item strip-link" onClick={onProgress}>
            <span className="strip-label muted small">{da.latestTest} ›</span>
            <span className="strip-value">{formatSpeed(latest.kpm, unit)}</span>
            <span className="strip-label">{da.latestTestModule(latest.moduleId, da.shortUnits[unit])}</span>
            {latest.gain !== null && latest.gain > 0 && (
              <span className="gain-chip">{da.gainInModule(formatSpeed(latest.gain, unit), latest.moduleId)}</span>
            )}
          </button>
        ) : (
          <div className="strip-item">
            <span className="strip-label">{da.moduleProgress(current, done, steps.length)}</span>
            <span className="bar" role="progressbar" aria-valuenow={done} aria-valuemax={steps.length}>
              <span style={{ width: `${(100 * done) / steps.length}%` }} />
            </span>
          </div>
        )}
      </section>

      {goal > 0 && (
        <div className="daily-goal">
          <span>
            {day.minutes >= goal ? da.dailyGoalReached : da.dailyGoal(Math.floor(day.minutes), goal)}
          </span>
          <span className="bar">
            <span style={{ width: `${Math.min(100, (100 * day.minutes) / goal)}%` }} />
          </span>
        </div>
      )}

      <div className="entries">
        <section className="entry">
          <h3>🎯 {da.training}</h3>
          <p className="muted">{da.trainingIntro}</p>
          {next ? (
            <button className="big" autoFocus onClick={() => onContinue(next.moduleId, next.ex)}>
              {da.continue}: {da.module(next.moduleId)} ·{' '}
              {next.ex === 'test' ? da.test : da.exercise(next.ex + 1)}
            </button>
          ) : (
            <p className="banner">{da.allDone}</p>
          )}
          <button className="secondary" onClick={onTraining}>
            {da.allModules}
          </button>
        </section>
        <section className="entry entry-test">
          <h3>{da.testCard}</h3>
          <p className="muted">{da.testCardIntro}</p>
          <button className="big test-go" onClick={onTests}>
            {da.takeATest}
          </button>
          <p className="entry-line">{nudgeText(nudge, withUnit)}</p>
        </section>
        <section className="entry">
          <h3>{da.competition}</h3>
          <p className="muted">{da.competitionIntro}</p>
          <button className="big competition-go" onClick={onStories}>
            {da.startCompetition}
          </button>
          <p className="entry-line">{bestPoints > 0 ? da.bestPoints(bestPoints) : da.noPoints}</p>
        </section>
      </div>

      <button className="progress-entry" onClick={onProgress}>
        {firstValid && bestValid !== null && bestValid > firstValid.kpm && (
          <span className="progress-figure" aria-hidden>
            <span className="muted">{formatSpeed(firstValid.kpm, unit)}</span> → {formatSpeed(bestValid, unit)}
          </span>
        )}
        <span className="progress-entry-text">
          <strong>{da.progressCard}</strong>
          <span>
            {!latest || !firstValid || bestValid === null
              ? da.progressNone
              : bestValid > firstValid.kpm
                ? da.progressSentence(formatSpeed(firstValid.kpm, unit), withUnit(bestValid), latest.moduleId)
                : da.progressOneTest(withUnit(firstValid.kpm), latest.moduleId)}
          </span>
        </span>
        <span className="progress-entry-go">{da.seeAll}</span>
      </button>

      <section className="home-section">
        <h3>{da.todayAndWeek}</h3>
        <table className="activity">
          <thead>
            <tr>
              <th />
              <th>{da.keystrokesLabel}</th>
              <th>{da.attemptsLabel}</th>
              <th>{da.minutesLabel}</th>
            </tr>
          </thead>
          <tbody>
            <ActivityRow label={da.todayLabel} a={day} />
            <ActivityRow label={da.weekLabel} a={week} />
          </tbody>
        </table>
      </section>

      <section className="home-section">
        <h3>
          {da.achievements} <span className="muted small">{da.achievementsCount(unlocked, achievements.length)}</span>
        </h3>
        <AchievementGrid items={achievements} />
      </section>

      <p className="version">{da.version(__APP_VERSION__)}</p>
    </div>
  )
}

function ActivityRow({ label, a }: { label: string; a: Activity }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{formatCount(a.keystrokes)}</td>
      <td>{a.attempts}</td>
      <td>{formatCount(a.minutes)}</td>
    </tr>
  )
}

function nudgeText(n: TestNudge, withUnit: (kpm: number) => string): string {
  switch (n.kind) {
    case 'never':
      return da.nudge.never
    case 'nearStar':
      return da.nudge.nearStar(n.moduleId, withUnit(n.gap), n.stars)
    case 'practiced':
      return da.nudge.practiced(n.moduleId, Math.round(n.minutes))
    case 'due':
      return da.nudge.due(n.moduleId)
    case 'last':
      return da.nudge.last(n.moduleId, withUnit(n.kpm), n.stars)
  }
}
