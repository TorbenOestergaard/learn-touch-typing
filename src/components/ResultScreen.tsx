import { useEffect } from 'react'
import { FAILS_BEFORE_WARMUP, type Thresholds } from '../config'
import { weakKeys, type SessionResult } from '../engine/stats'
import { formatSpeed, formatSpeedDiff, pct, speedUnitLabel, type SpeedUnit } from '../format'
import { da } from '../i18n/da'
import type { Achievement } from '../progress/achievements'
import { starTiers } from '../progress/stars'
import type { TestHeadline } from '../progress/testResult'
import type { ExerciseRecord } from '../storage/profiles'
import { NewAchievements } from './Achievements'
import { CompareBars, type CompareItem } from './charts/CompareBars'
import { StarLadder } from './StarLadder'

export interface TestInfo {
  headline: TestHeadline
  /** First test, record before and today, when there are earlier tests. */
  compare: CompareItem[]
  threeInARow: boolean
}

interface Props {
  result: SessionResult
  /** 0 = not passed. Ignored for warm-ups. */
  stars: number
  isWarmup: boolean
  isTest: boolean
  moduleId: number
  thresholds: Thresholds
  requiredKpm: number
  speedUnit: SpeedUnit
  /** The record before this attempt, for comparison. */
  previous?: ExerciseRecord
  failsInRow: number
  /** False for a test passed before the module's exercises were done. */
  counted: boolean
  /** Achievements this attempt unlocked. */
  unlocked: Achievement[]
  /** Set for tests: the headline and the comparison with earlier tests. */
  test?: TestInfo
  /** Shown when a module test finishes the module. */
  commonWords?: { count: number; total: number; examples: string[] }
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
  onWarmup: () => void
  onMap: () => void
  onProgress: () => void
}

const keyLabel = (c: string) => (c === ' ' ? da.space : c)

function testTitle(h: TestHeadline, p: Props, speed: (kpm: number) => string): { title: string; sub?: string } {
  const min = pct(p.thresholds.minAccuracy)
  switch (h.kind) {
    case 'moduleDone':
      return { title: da.moduleDone(p.moduleId) }
    case 'firstTest':
      return {
        title: da.headline.firstTest(speed(p.result.kpm)),
        sub: h.valid ? da.headline.firstTestSub : da.headline.firstTestInvalid(min),
      }
    case 'fastButSloppy':
      return { title: da.headline.fastButSloppy(pct(p.result.accuracy)), sub: da.headline.fastButSloppySub(min) }
    case 'notYet':
      return { title: da.headline.notYet }
    case 'newStar':
      return { title: da.headline.newStar(h.stars, p.moduleId), sub: da.headline.starForever }
    case 'newRecord':
      return { title: da.headline.newRecord(speed(p.result.kpm)), sub: da.headline.newRecordSub(formatSpeed(h.gain, p.speedUnit)) }
    case 'holds':
      return { title: da.headline.holds(speed(p.result.kpm)) }
    case 'belowRecord':
      return { title: da.headline.belowRecord(formatSpeed(h.best, p.speedUnit)), sub: da.headline.stillStars(p.stars) }
    case 'lowerTier':
      return { title: da.headline.lowerTier(p.stars, h.bestStars), sub: da.headline.starForever }
  }
}

export function ResultScreen(p: Props) {
  const passed = p.isWarmup || p.stars > 0
  const speed = (kpm: number) => `${formatSpeed(kpm, p.speedUnit)} ${da.shortUnits[p.speedUnit]}`
  // Vary the praise a little; derived from the result so it is stable across renders.
  const { title, sub } = p.test
    ? testTitle(p.test.headline, p, speed)
    : {
        title: p.isWarmup
          ? da.warmupDone
          : passed
            ? da.passedTitle[Math.floor(p.result.durationMs) % da.passedTitle.length]
            : da.failedTitle,
        sub: undefined,
      }
  const celebrate = p.test ? ['moduleDone', 'newStar', 'newRecord'].includes(p.test.headline.kind) : false

  const weak = weakKeys(p.result.errorsByChar)
  const speedRecord = !p.test && !!p.previous && p.result.kpm > p.previous.bestKpm
  const speedDiff = !p.test && p.previous ? p.result.kpm - p.previous.lastKpm : null
  const showWarmup = !passed && p.failsInRow >= FAILS_BEFORE_WARMUP && weak.length > 0
  const speedOk = p.result.kpm >= p.requiredKpm
  const accuracyOk = p.result.accuracy >= p.thresholds.minAccuracy
  // After a test, trying again is the main action unless the test just finished the module.
  const primaryIsNext = p.isTest ? p.test?.headline.kind === 'moduleDone' && p.hasNext : passed && p.hasNext

  // Enter = the main action, so hands can stay on the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      if (primaryIsNext) p.onNext()
      else p.onRetry()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [primaryIsNext, p])

  return (
    <div className={`result ${celebrate || p.unlocked.length > 0 ? 'celebrate' : ''}`}>
      {p.isTest && <span className="muted">{da.moduleTest(p.moduleId)}</span>}
      <h2>{title}</h2>
      {sub && <p className="result-sub">{sub}</p>}
      {!p.isWarmup && (
        <div className="stars" aria-label={da.stars(p.stars)}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= p.stars ? 'star on' : 'star'}>
              ★
            </span>
          ))}
        </div>
      )}

      {!p.isWarmup && (
        <StarLadder result={p.result} stars={p.stars} thresholds={p.thresholds} tiers={starTiers(p.thresholds)} unit={p.speedUnit} />
      )}

      {p.isTest && passed && !p.counted && <p className="muted">{da.testNotCounted(p.moduleId)}</p>}

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
          {!p.isWarmup && <div className="stat-goal">{da.goal(pct(p.thresholds.minAccuracy))}</div>}
        </div>
      </div>

      {p.test && p.test.compare.length > 1 && (
        <div className="compare">
          <CompareBars items={p.test.compare} format={speed} />
        </div>
      )}
      {p.test?.threeInARow && <p className="result-line">{da.threeInARow}</p>}

      {!p.test && !passed && !accuracyOk && <p className="muted">{da.slowerHint}</p>}
      {!p.test && !passed && accuracyOk && !speedOk && <p className="muted">{da.fasterHint}</p>}

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
        {p.isTest ? (
          <>
            {primaryIsNext ? (
              <button onClick={p.onNext}>{da.next} →</button>
            ) : (
              <button className="test-go" onClick={p.onRetry}>
                {da.retryTest}
              </button>
            )}
            <button className="secondary" onClick={p.onProgress}>
              {da.seeProgress}
            </button>
          </>
        ) : (
          <>
            <button className={passed && p.hasNext ? 'secondary' : ''} onClick={p.onRetry}>
              ↺ {da.tryAgain}
            </button>
            {passed && p.hasNext && <button onClick={p.onNext}>{da.next} →</button>}
          </>
        )}
        <button className="link" onClick={p.onMap}>
          {da.toMap}
        </button>
      </div>
    </div>
  )
}
