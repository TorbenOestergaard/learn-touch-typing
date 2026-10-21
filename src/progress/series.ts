// Time series for the progress view, computed from profile.history.

import { MODULES } from '../content/da/modules'
import { isPassedEx, type Attempt, type Profile } from '../storage/profiles'
import { startOfWeek } from './streak'

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

export interface WeekPoint {
  weekStart: number
  /** Correct keystrokes per minute over all the week's exercises and tests. */
  avgKpm: number
  attempts: number
}

/**
 * Average speed per week (Monday start) over exercises and tests. Weighted by time typed, so a short
 * exercise counts less than a long one. Weeks without attempts are left out.
 */
export function weeklySpeed(history: Attempt[]): WeekPoint[] {
  const weeks = new Map<number, { correct: number; ms: number; attempts: number }>()
  for (const a of history) {
    if (a.kind !== 'exercise' && a.kind !== 'test') continue
    if (a.durationMs <= 0) continue
    const key = startOfWeek(a.at)
    const w = weeks.get(key) ?? { correct: 0, ms: 0, attempts: 0 }
    weeks.set(key, { correct: w.correct + a.correct, ms: w.ms + a.durationMs, attempts: w.attempts + 1 })
  }
  return [...weeks.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekStart, w]) => ({ weekStart, avgKpm: w.correct / (w.ms / 60_000), attempts: w.attempts }))
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
