import { describe, expect, it } from 'vitest'
import { createProfile, recordAttempt, type Attempt, type Profile } from '../storage/profiles'
import type { SessionResult } from '../engine/stats'
import {
  dailyActivity,
  latestTest,
  practiceSinceTest,
  recordSteps,
  retestDue,
  testNudge,
  testSeries,
} from './series'

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

describe('recordSteps', () => {
  it('keeps the running best of valid attempts only', () => {
    const steps = recordSteps(
      [52, 58, 50, 66, 70].map((kpm, i) => ({ at: i, kpm, accuracy: kpm === 66 ? 0.93 : 0.97, stars: 1 })),
      0.95,
    )
    expect(steps.map((s) => [s.best, s.isRecord, s.valid])).toEqual([
      [52, true, true],
      [58, true, true],
      [58, false, true],
      [58, false, false],
      [70, true, true],
    ])
  })
})

describe('dailyActivity', () => {
  it('returns the last 7 local days, today last', () => {
    const days = dailyActivity([attempt(at(18, 9)), attempt(at(16)), attempt(at(10))], at(18, 20))
    expect(days).toHaveLength(7)
    expect(days[6]).toMatchObject({ dayStart: new Date(2026, 9, 18).getTime(), keystrokes: 60, minutes: 1 })
    expect(days[4].keystrokes).toBe(60)
    expect(days[0].dayStart).toBe(new Date(2026, 9, 12).getTime())
    expect(days.reduce((s, d) => s + d.keystrokes, 0)).toBe(120)
  })
})

describe('latestTest', () => {
  it('reports the latest test and the gain since the first valid one in its module', () => {
    const h = [
      attempt(at(1), { kind: 'test', moduleId: 1, kpm: 52 }),
      attempt(at(2), { kind: 'test', moduleId: 2, kpm: 40 }),
      attempt(at(3), { kind: 'test', moduleId: 1, kpm: 86 }),
    ]
    expect(latestTest(h, 0.95)).toMatchObject({ moduleId: 1, kpm: 86, gain: 34 })
    expect(latestTest(h.slice(0, 2), 0.95)).toMatchObject({ moduleId: 2, gain: null })
    expect(latestTest([...h, attempt(at(4), { kind: 'test', moduleId: 2, kpm: 120, accuracy: 0.9 })], 0.95)).toMatchObject({ moduleId: 1, kpm: 86 })
    expect(latestTest([], 0.95)).toBeNull()
  })
})

describe('testNudge', () => {
  const noGap = () => null
  it('asks for a first test', () => {
    expect(testNudge([], 0.95, noGap)).toEqual({ kind: 'never' })
  })

  it('prefers a module close to the next star', () => {
    const h = [attempt(at(1), { kind: 'test', moduleId: 2, kpm: 86 })]
    expect(testNudge(h, 0.95, () => ({ gap: 4, stars: 3 }))).toEqual({ kind: 'nearStar', moduleId: 2, gap: 4, stars: 3 })
  })

  it('then a module practised since its last test, else the last test', () => {
    const h = [
      attempt(at(1), { kind: 'test', moduleId: 1, kpm: 70, stars: 1 }),
      ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((d) => attempt(at(d), { moduleId: 3 })),
    ]
    expect(practiceSinceTest(h, 3)).toBe(15)
    expect(testNudge(h, 0.95, noGap)).toEqual({ kind: 'practiced', moduleId: 3, minutes: 15 })
    expect(testNudge(h.slice(0, 5), 0.95, noGap)).toEqual({ kind: 'last', moduleId: 1, kpm: 70, stars: 1 })
  })
})
