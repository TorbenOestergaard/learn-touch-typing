// Time series for the progress view, computed from profile.history.

import { MODULES } from '../content/da/modules'
import { isPassedEx, type Attempt, type Profile } from '../storage/profiles'
import { speedGapToNextStar } from './stars'
import { activity, startOfDay } from './streak'

const DAY_MS = 86_400_000

export interface TestPoint {
  at: number
  kpm: number
  accuracy: number
  stars: number
}

/** Every attempt at a module's test, oldest first. */
export function testSeries(history: Attempt[], moduleId: number): TestPoint[] {
  return history
    .filter((a) => a.kind === 'test' && a.moduleId === moduleId)
    .sort((a, b) => a.at - b.at)
    .map((a) => ({ at: a.at, kpm: a.kpm, accuracy: a.accuracy, stars: a.stars ?? 0 }))
}

/**
 * Passed modules whose last test attempt is more than `days` old, oldest first. A module passed before
 * history existed has no logged test, so it counts as due.
 */
export function retestDue(profile: Profile, now = Date.now(), days = 14): number[] {
  const history = profile.history ?? []
  return MODULES.filter((m) => isPassedEx(profile, m.id, 'test'))
    .map((m) => ({ id: m.id, last: testSeries(history, m.id).at(-1)?.at ?? 0 }))
    .filter((m) => now - m.last > days * DAY_MS)
    .sort((a, b) => a.last - b.last)
    .map((m) => m.id)
}

export interface RecordStep extends TestPoint {
  /** Accuracy met the pass level, so the attempt counts. */
  valid: boolean
  /** Best valid speed so far, including this attempt; null before the first valid one. */
  best: number | null
  isRecord: boolean
}

/** The record staircase: every attempt with the running best of the valid ones. */
export function recordSteps(tests: TestPoint[], minAccuracy: number): RecordStep[] {
  let best: number | null = null
  return tests.map((t) => {
    const valid = t.accuracy >= minAccuracy
    const isRecord = valid && (best === null || t.kpm > best)
    if (isRecord) best = t.kpm
    return { ...t, valid, best, isRecord }
  })
}

export interface DayPoint {
  dayStart: number
  keystrokes: number
  minutes: number
}

/** Keystrokes and minutes for each of the last `days` local days, today last. */
export function dailyActivity(history: Attempt[], now = Date.now(), days = 7): DayPoint[] {
  const today = startOfDay(now)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (days - 1 - i)).getTime()
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (days - 2 - i)).getTime()
    const a = activity(history, dayStart, dayEnd)
    return { dayStart, keystrokes: a.keystrokes, minutes: a.minutes }
  })
}

export interface LatestTest {
  moduleId: number
  kpm: number
  accuracy: number
  at: number
  /** Latest minus first valid test in the same module; null with fewer than two valid tests. */
  gain: number | null
}

/** The most recent valid test (accuracy met), with the gain since the first valid test in its module. */
export function latestTest(history: Attempt[], minAccuracy: number): LatestTest | null {
  const last = [...history].reverse().find((a) => a.kind === 'test' && a.moduleId !== undefined && a.accuracy >= minAccuracy)
  if (!last || last.moduleId === undefined) return null
  const valid = testSeries(history, last.moduleId).filter((t) => t.accuracy >= minAccuracy)
  const gain = valid.length >= 2 ? last.kpm - valid[0].kpm : null
  return { moduleId: last.moduleId, kpm: last.kpm, accuracy: last.accuracy, at: last.at, gain }
}

/** Best valid test per module that has one. */
export function bestTests(history: Attempt[], minAccuracy: number): Map<number, TestPoint> {
  const out = new Map<number, TestPoint>()
  for (const m of MODULES) {
    const valid = testSeries(history, m.id).filter((t) => t.accuracy >= minAccuracy)
    if (valid.length) out.set(m.id, valid.reduce((a, b) => (b.kpm > a.kpm ? b : a)))
  }
  return out
}

/** Minutes of exercises in a module since its last test (or ever, without a test). */
export function practiceSinceTest(history: Attempt[], moduleId: number): number {
  const lastTest = testSeries(history, moduleId).at(-1)?.at ?? 0
  return history
    .filter((a) => a.kind === 'exercise' && a.moduleId === moduleId && a.at > lastTest)
    .reduce((s, a) => s + a.durationMs, 0) / 60_000
}

export type TestNudge =
  | { kind: 'never' }
  /** The best test is only a few keystrokes per minute from the next star. */
  | { kind: 'nearStar'; moduleId: number; gap: number; stars: number }
  | { kind: 'practiced'; moduleId: number; minutes: number }
  /** A passed module whose last test is old. */
  | { kind: 'due'; moduleId: number }
  | { kind: 'last'; moduleId: number; kpm: number; stars: number }

/** At most this many keystrokes per minute from the next star counts as close. */
export const NEAR_STAR = 6
/** Minutes of exercises since the last test before suggesting a new one. */
export const PRACTICE_BEFORE_RETEST = 15

/** The one line on the home screen's test card, and the module the test picker recommends. */
export function testNudge(
  history: Attempt[],
  minAccuracy: number,
  gapOf: (t: TestPoint) => { gap: number; stars: number } | null,
): TestNudge {
  const tests = history.filter((a) => a.kind === 'test' && a.moduleId !== undefined)
  if (tests.length === 0) return { kind: 'never' }
  const best = bestTests(history, minAccuracy)
  const near = [...best.entries()]
    .map(([moduleId, t]) => ({ moduleId, g: gapOf(t) }))
    .filter((x): x is { moduleId: number; g: { gap: number; stars: number } } => !!x.g && x.g.gap <= NEAR_STAR)
    .sort((a, b) => a.g.gap - b.g.gap)[0]
  if (near) return { kind: 'nearStar', moduleId: near.moduleId, gap: near.g.gap, stars: near.g.stars }
  const practiced = MODULES.map((m) => ({ moduleId: m.id, minutes: practiceSinceTest(history, m.id) }))
    .filter((m) => m.minutes >= PRACTICE_BEFORE_RETEST)
    .sort((a, b) => b.minutes - a.minutes)[0]
  if (practiced) return { kind: 'practiced', ...practiced }
  // Prefer the last test that counted, so a fast but sloppy try isn't shown as the speed.
  const last = [...tests].reverse().find((a) => a.accuracy >= minAccuracy) ?? tests[tests.length - 1]
  return { kind: 'last', moduleId: last.moduleId!, kpm: last.kpm, stars: last.stars ?? 0 }
}

/** The test nudge for a profile: near a star, practised, an old test, else the last result. */
export function profileTestNudge(profile: Profile, now = Date.now()): TestNudge {
  const nudge = testNudge(profile.history ?? [], profile.settings.minAccuracy, (t) => speedGapToNextStar(t, profile.settings))
  if (nudge.kind !== 'last') return nudge
  const due = retestDue(profile, now)[0]
  return due !== undefined ? { kind: 'due', moduleId: due } : nudge
}

/** The module a nudge points at, for the test picker's recommendation. */
export const nudgeModule = (n: TestNudge): number | undefined => ('moduleId' in n && n.kind !== 'last' ? n.moduleId : undefined)
