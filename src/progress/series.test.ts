import { describe, expect, it } from 'vitest'
import { createProfile, recordAttempt, type Attempt, type Profile } from '../storage/profiles'
import type { SessionResult } from '../engine/stats'
import { retestDue, testSeries, weeklySpeed } from './series'

/** Local time, October 2026. 12 and 19 Oct are Mondays. */
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime()
const attempt = (ts: number, over: Partial<Attempt> = {}): Attempt => ({
  at: ts,
  kind: 'exercise',
  moduleId: 1,
  kpm: 60,
  accuracy: 1,
  durationMs: 60_000,
  correct: 60,
  errors: 0,
  ...over,
})
const result: SessionResult = { kpm: 60, accuracy: 1, durationMs: 60_000, correct: 60, errors: 0, errorsByChar: {} }

describe('testSeries', () => {
  it('returns one module’s tests, oldest first', () => {
    const h = [
      attempt(at(14), { kind: 'test', kpm: 70, accuracy: 0.97, stars: 1 }),
      attempt(at(12), { kind: 'test', kpm: 50, accuracy: 0.9, stars: 0 }),
      attempt(at(13), { kind: 'exercise' }),
      attempt(at(13), { kind: 'test', moduleId: 2 }),
    ]
    expect(testSeries(h, 1)).toEqual([
      { at: at(12), kpm: 50, accuracy: 0.9, stars: 0 },
      { at: at(14), kpm: 70, accuracy: 0.97, stars: 1 },
    ])
  })
})

describe('weeklySpeed', () => {
  it('groups exercises and tests by Monday week, weighted by time', () => {
    const h = [
      attempt(at(12), { correct: 60, durationMs: 60_000 }),
      attempt(at(18), { kind: 'test', correct: 180, durationMs: 120_000 }),
      attempt(at(19), { correct: 100, durationMs: 60_000 }),
      attempt(at(19), { kind: 'story', correct: 999 }),
      attempt(at(19), { kind: 'warmup', correct: 999 }),
    ]
    expect(weeklySpeed(h)).toEqual([
      { weekStart: new Date(2026, 9, 12).getTime(), avgKpm: 80, attempts: 2 },
      { weekStart: new Date(2026, 9, 19).getTime(), avgKpm: 100, attempts: 1 },
    ])
  })

  it('ignores zero-length attempts', () => {
    expect(weeklySpeed([attempt(at(12), { durationMs: 0 })])).toEqual([])
  })
})

describe('retestDue', () => {
  const passed = (p: Profile, m: number) => recordAttempt(p, m, 'test', result, 1)

  it('lists passed modules whose last test is over 14 days old, oldest first', () => {
    let p = passed(passed(passed(createProfile('Ida', '🦊'), 1), 2), 3)
    p = {
      ...p,
      history: [
        attempt(at(1), { kind: 'test', moduleId: 2 }),
        attempt(at(2), { kind: 'test', moduleId: 1 }),
        attempt(at(20), { kind: 'test', moduleId: 1 }),
        attempt(at(15), { kind: 'test', moduleId: 3 }),
        attempt(at(1), { kind: 'test', moduleId: 4 }),
      ],
    }
    expect(retestDue(p, at(21))).toEqual([2])
    expect(retestDue(p, at(31))).toEqual([2, 3])
  })

  it('counts a module passed before history existed as due', () => {
    expect(retestDue(passed(createProfile('Ida', '🦊'), 1), at(21))).toEqual([1])
  })
})
