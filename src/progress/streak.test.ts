import { describe, expect, it } from 'vitest'
import type { Attempt } from '../storage/profiles'
import { activity, dayIndex, startOfWeek, streak, thisWeek, today, totalKeystrokes } from './streak'

/** Local time: October 2026, day d, at hour h. 18 Oct 2026 is a Sunday. */
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime()
const attempt = (ts: number, over: Partial<Attempt> = {}): Attempt => ({
  at: ts,
  kind: 'exercise',
  kpm: 60,
  accuracy: 1,
  durationMs: 60_000,
  correct: 100,
  errors: 2,
  ...over,
})

describe('streak', () => {
  it('is zero without history', () => {
    expect(streak([], at(18))).toEqual({ current: 0, best: 0, today: false })
  })

  it('counts consecutive days including today', () => {
    const h = [at(16), at(17, 8), at(17, 20), at(18)].map((t) => attempt(t))
    expect(streak(h, at(18, 22))).toEqual({ current: 3, best: 3, today: true })
  })

  it('stays alive until today is over', () => {
    const h = [at(16), at(17)].map((t) => attempt(t))
    expect(streak(h, at(18, 23))).toEqual({ current: 2, best: 2, today: false })
  })

  it('resets after a missed day but keeps the best', () => {
    const h = [at(10), at(11), at(12), at(13), at(16)].map((t) => attempt(t))
    expect(streak(h, at(18))).toEqual({ current: 0, best: 4, today: false })
    expect(streak(h, at(16))).toEqual({ current: 1, best: 4, today: true })
  })

  it('uses local days, so late evening and early morning are different days', () => {
    const h = [attempt(at(17, 23)), attempt(at(18, 0))]
    expect(streak(h, at(18, 1)).current).toBe(2)
  })

  it('handles the DST change (25 Oct 2026 in Denmark)', () => {
    expect(dayIndex(at(26, 0)) - dayIndex(at(25, 23))).toBe(1)
    const h = [24, 25, 26].map((d) => attempt(at(d)))
    expect(streak(h, at(26)).current).toBe(3)
  })
})

describe('activity', () => {
  const h = [attempt(at(11)), attempt(at(12, 9)), attempt(at(18, 7), { durationMs: 90_000 }), attempt(at(18, 9))]

  it('sums keystrokes, attempts and minutes for today', () => {
    expect(today(h, at(18, 20))).toEqual({ keystrokes: 204, attempts: 2, minutes: 2.5 })
  })

  it('starts the week on Monday', () => {
    expect(startOfWeek(at(18))).toBe(new Date(2026, 9, 12).getTime())
    expect(startOfWeek(at(12, 0))).toBe(new Date(2026, 9, 12).getTime())
    expect(thisWeek(h, at(18)).attempts).toBe(3)
  })

  it('respects the end of the range', () => {
    expect(activity(h, at(11, 0), at(12, 0)).attempts).toBe(1)
  })

  it('totals all keystrokes', () => {
    expect(totalKeystrokes(h)).toBe(408)
  })
})
