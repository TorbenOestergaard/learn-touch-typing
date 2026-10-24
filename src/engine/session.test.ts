import { describe, expect, it } from 'vitest'
import { UNCORRECTED_ERROR_WEIGHT } from '../config'
import { createSession, expectedChar, isFinished, pressKey, uncorrectedErrors, wrongPositions } from './session'
import { computeResult, isPassed, starsFor, weakKeys } from './stats'

function typeAll(lines: string[], keys: string[], step = 1000) {
  let s = createSession(lines)
  let t = 0
  for (const k of keys) {
    s = pressKey(s, k, t)
    t += step
  }
  return s
}

describe('session', () => {
  it('advances on correct keys and stays on wrong ones', () => {
    let s = createSession(['de'])
    s = pressKey(s, 'x', 0)
    expect(s.col).toBe(0)
    expect(s.errors).toBe(1)
    expect(s.errorsByChar).toEqual({ d: 1 })
    s = pressKey(s, 'd', 1)
    expect(s.col).toBe(1)
    expect(expectedChar(s)).toBe('e')
  })

  it('ignores non-character keys like Shift, Backspace and dead keys', () => {
    let s = createSession(['d'])
    for (const k of ['Shift', 'Backspace', 'Dead', 'Enter']) s = pressKey(s, k, 0)
    expect(s.errors).toBe(0)
    expect(s.startedAt).toBeNull()
  })

  it('moves to the next line without Enter and finishes at the end', () => {
    const s = typeAll(['ab', 'c'], ['a', 'b', 'c'])
    expect(isFinished(s)).toBe(true)
    expect(s.correct).toBe(3)
    expect(expectedChar(s)).toBeNull()
  })

  it('wraps after the last char of a line', () => {
    const s = typeAll(['ab', 'cd'], ['a', 'b'])
    expect(s.line).toBe(1)
    expect(s.col).toBe(0)
  })

  it('starts the timer on the first key press, even a wrong one', () => {
    const s = pressKey(createSession(['a']), 'x', 500)
    expect(s.startedAt).toBe(500)
  })

  it('ignores input after finishing', () => {
    const s = typeAll(['a'], ['a'])
    expect(pressKey(s, 'a', 99)).toBe(s)
  })

  it('flags a US layout when ; is typed where æ is expected', () => {
    const s = pressKey(createSession(['æ']), ';', 0)
    expect(s.wrongLayout).toBe(true)
  })

  it('requires uppercase where the text has uppercase', () => {
    let s = createSession(['Da'])
    s = pressKey(s, 'd', 0)
    expect(s.errors).toBe(1)
    s = pressKey(s, 'D', 0)
    expect(s.col).toBe(1)
  })
})

describe('stats', () => {
  it('computes speed and accuracy', () => {
    // 4 correct + 1 error; first key at t=0, last at t=4000 → 4 s.
    const s = typeAll(['abcd'], ['a', 'x', 'b', 'c', 'd'])
    const r = computeResult(s)
    expect(r.accuracy).toBeCloseTo(0.8)
    expect(r.kpm).toBe(60) // 4 correct in 4 s → 60/min
  })

  it('awards stars only when passed', () => {
    const base = { durationMs: 1, correct: 1, errors: 0, errorsByChar: {} }
    expect(starsFor({ ...base, kpm: 29, accuracy: 1 }, 0.95, 30)).toBe(0)
    expect(starsFor({ ...base, kpm: 30, accuracy: 0.94 }, 0.95, 30)).toBe(0)
    expect(starsFor({ ...base, kpm: 30, accuracy: 0.95 }, 0.95, 30)).toBe(1)
    expect(starsFor({ ...base, kpm: 36, accuracy: 0.97 }, 0.95, 30)).toBe(2)
    expect(starsFor({ ...base, kpm: 44, accuracy: 0.99 }, 0.95, 30)).toBe(2)
    expect(starsFor({ ...base, kpm: 45, accuracy: 0.98 }, 0.95, 30)).toBe(3)
    expect(isPassed({ ...base, kpm: 30, accuracy: 0.95 }, 0.95, 30)).toBe(true)
  })

  it('lists the weakest keys first', () => {
    expect(weakKeys({ a: 1, b: 5, c: 3, d: 0 })).toEqual(['b', 'c', 'a'])
  })
})

describe('real writing mode', () => {
  const real = (lines: string[], keys: string[], step = 1000) => {
    let s = createSession(lines, 'real')
    let t = 0
    for (const k of keys) {
      s = pressKey(s, k, t)
      t += step
    }
    return s
  }

  it('writes wrong keys and moves the cursor on', () => {
    const s = real(['de'], ['x'])
    expect(s.col).toBe(1)
    expect(s.typed[0]).toBe('x')
    expect(s.errors).toBe(1)
    expect(s.errorsByChar).toEqual({ d: 1 })
    expect(wrongPositions(s, 0)).toEqual([0])
  })

  it('fixes a wrong character with Backspace', () => {
    const s = real(['de'], ['x', 'Backspace', 'd', 'e'])
    expect(isFinished(s)).toBe(true)
    expect(s.correct).toBe(2)
    expect(s.errors).toBe(1)
    expect(uncorrectedErrors(s)).toBe(0)
  })

  it('takes a deleted correct character back off the count', () => {
    const s = real(['de'], ['d', 'Backspace'])
    expect(s.correct).toBe(0)
    expect(s.col).toBe(0)
    expect(s.errors).toBe(0)
  })

  it('moves to the next line with errors left, and Backspace stays on the current line', () => {
    let s = real(['ab', 'c'], ['a', 'x'])
    expect(s.line).toBe(1)
    s = pressKey(s, 'Backspace', 5000)
    expect(s.line).toBe(1)
    expect(s.typed).toEqual(['ax', ''])
    s = pressKey(s, 'c', 6000)
    expect(isFinished(s)).toBe(true)
    expect(uncorrectedErrors(s)).toBe(1)
  })

  it('weighs unfixed errors extra in the result', () => {
    const fixed = computeResult(real(['ab'], ['x', 'Backspace', 'a', 'b']))
    const unfixed = computeResult(real(['ab'], ['x', 'b']))
    expect(fixed.errors).toBe(1)
    expect(fixed.uncorrected).toBe(0)
    expect(unfixed.uncorrected).toBe(1)
    expect(unfixed.errors).toBe(UNCORRECTED_ERROR_WEIGHT)
    expect(unfixed.correct).toBe(1)
    expect(unfixed.accuracy).toBeLessThan(fixed.accuracy)
  })

  it('ignores Backspace at the start and other non-character keys', () => {
    const s = real(['d'], ['Backspace', 'Shift', 'Dead'])
    expect(s.startedAt).toBeNull()
    expect(s.col).toBe(0)
  })
})
