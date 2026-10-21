import { useEffect } from 'react'
import { FAILS_BEFORE_WARMUP } from '../config'
import { weakKeys, type SessionResult } from '../engine/stats'
import { formatSpeed, formatSpeedDiff, pct, speedUnitLabel, type SpeedUnit } from '../format'
import { da } from '../i18n/da'
import type { Achievement } from '../progress/achievements'
import type { ExerciseRecord } from '../storage/profiles'
import { NewAchievements } from './Achievements'

interface Props {
  result: SessionResult
  /** 0 = not passed. Ignored for warm-ups. */
  stars: number
  isWarmup: boolean
  isTest: boolean
  moduleId: number
  requiredKpm: number
  minAccuracy: number
  speedUnit: SpeedUnit
  /** The record before this attempt, for comparison. */
  previous?: ExerciseRecord
  failsInRow: number
  /** False for a test passed before the module's exercises were done. */
  counted: boolean
  /** Achievements this attempt unlocked. */
  unlocked: Achievement[]
  /** Shown when a module test is passed. */
  commonWords?: { count: number; total: number; examples: string[] }
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
  onWarmup: () => void
  onMap: () => void
}

const keyLabel = (c: string) => (c === ' ' ? da.space : c)

export function ResultScreen(p: Props) {
  const passed = p.isWarmup || p.stars > 0
  // Vary the praise a little; derived from the result so it is stable across renders.
  const title = p.isWarmup
    ? da.warmupDone
    : p.isTest && passed && !p.counted
      ? da.testNotCounted(p.moduleId)
      : p.isTest && passed
        ? da.moduleDone(p.moduleId)
      : passed
        ? da.passedTitle[Math.floor(p.result.durationMs) % da.passedTitle.length]
        : da.failedTitle

  const weak = weakKeys(p.result.errorsByChar)
  const speedRecord = !!p.previous && p.result.kpm > p.previous.bestKpm
  const speedDiff = p.previous ? p.result.kpm - p.previous.lastKpm : null
  const showWarmup = !passed && p.failsInRow >= FAILS_BEFORE_WARMUP && weak.length > 0
  const speedOk = p.result.kpm >= p.requiredKpm
  const accuracyOk = p.result.accuracy >= p.minAccuracy

  // Enter = the main action, so hands can stay on the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      if (passed && p.hasNext) p.onNext()
      else p.onRetry()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [passed, p])

  return (
    <div className={`result ${(p.isTest && passed && p.counted) || p.unlocked.length > 0 ? 'celebrate' : ''}`}>
      <h2>{title}</h2>
      {!p.isWarmup && (
        <div className="stars" aria-label={da.stars(p.stars)}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= p.stars ? 'star on' : 'star'}>
              ★
            </span>
          ))}
        </div>
      )}

      <NewAchievements items={p.unlocked} />

      {p.commonWords && (
        <div className="common-words">
          <p>{da.commonWords(p.commonWords.count, p.commonWords.total)}</p>
          {p.commonWords.examples.length > 0 && (
            <p className="muted">
              {da.newWordsExamples}: {p.commonWords.examples.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="stat-row">
        <div className={`stat ${p.isWarmup || speedOk ? 'ok' : 'miss'}`}>
          <div className="stat-label">{da.speed}</div>
          <div className="stat-value">{formatSpeed(p.result.kpm, p.speedUnit)}</div>
          <div className="stat-unit">{speedUnitLabel(p.speedUnit)}</div>
          {!p.isWarmup && <div className="stat-goal">{da.goal(formatSpeed(p.requiredKpm, p.speedUnit))}</div>}
          {speedRecord && <div className="badge">{da.newRecord}</div>}
          {!speedRecord && speedDiff !== null && (
            <div className="stat-diff">{da.vsLast(formatSpeedDiff(speedDiff, p.speedUnit))}</div>
          )}
        </div>
        <div className={`stat ${p.isWarmup || accuracyOk ? 'ok' : 'miss'}`}>
          <div className="stat-label">{da.accuracy}</div>
          <div className="stat-value">{pct(p.result.accuracy)}</div>
          <div className="stat-unit">&nbsp;</div>
          {!p.isWarmup && <div className="stat-goal">{da.goal(pct(p.minAccuracy))}</div>}
        </div>
      </div>

      {!passed && !accuracyOk && <p className="muted">{da.slowerHint}</p>}
      {!passed && accuracyOk && !speedOk && <p className="muted">{da.fasterHint}</p>}

      {weak.length > 0 && (
        <div className="weak">
          <span className="muted">{da.hardKeys}:</span>
          {weak.map((c) => (
            <kbd key={c}>{keyLabel(c)}</kbd>
          ))}
        </div>
      )}

      {showWarmup && (
        <div className="banner">
          <p>{da.warmupSuggestion}</p>
          <button onClick={p.onWarmup}>{da.startWarmup}</button>
        </div>
      )}

      <div className="actions">
        <button className={passed && p.hasNext ? 'secondary' : ''} onClick={p.onRetry}>
          ↺ {da.tryAgain}
        </button>
        {passed && p.hasNext && <button onClick={p.onNext}>{da.next} →</button>}
        <button className="link" onClick={p.onMap}>
          {da.toMap}
        </button>
      </div>
    </div>
  )
}
