// Which headline a test result gets, compared with the earlier tests in the same module.

import type { TestPoint } from './series'

export type TestHeadline =
  /** The test finished the module for the first time. */
  | { kind: 'moduleDone' }
  | { kind: 'firstTest'; valid: boolean }
  /** Fast enough, but accuracy too low to count. */
  | { kind: 'fastButSloppy' }
  | { kind: 'notYet' }
  | { kind: 'newStar'; stars: number }
  /** gain and best are keystrokes per minute. */
  | { kind: 'newRecord'; gain: number }
  | { kind: 'holds' }
  | { kind: 'belowRecord'; best: number }
  /** A lower star this time; the best stays. */
  | { kind: 'lowerTier'; bestStars: number }

export interface TestOutcome {
  kpm: number
  accuracy: number
  stars: number
  /** The test passed the module now and it wasn't passed before. */
  finishedModule: boolean
}

/** Within this many keystrokes per minute of the record counts as holding it. */
const HOLD_MARGIN = 2

export function testHeadline(r: TestOutcome, earlier: TestPoint[], minAccuracy: number, requiredKpm: number): TestHeadline {
  if (r.finishedModule) return { kind: 'moduleDone' }
  const valid = r.accuracy >= minAccuracy
  if (earlier.length === 0) return { kind: 'firstTest', valid }
  if (r.stars === 0) return valid || r.kpm < requiredKpm ? { kind: 'notYet' } : { kind: 'fastButSloppy' }

  const bestStars = Math.max(0, ...earlier.map((t) => t.stars))
  const validEarlier = earlier.filter((t) => t.accuracy >= minAccuracy)
  const best = Math.max(0, ...validEarlier.map((t) => t.kpm))
  if (r.stars > bestStars) return { kind: 'newStar', stars: r.stars }
  if (validEarlier.length === 0) return { kind: 'firstTest', valid: true }
  if (r.kpm > best) return { kind: 'newRecord', gain: r.kpm - best }
  if (r.kpm >= best - HOLD_MARGIN) return { kind: 'holds' }
  if (r.stars < bestStars) return { kind: 'lowerTier', bestStars }
  return { kind: 'belowRecord', best }
}

/** True when this and the two valid tests before it each got faster. */
export function threeInARow(r: { kpm: number; accuracy: number }, earlier: TestPoint[], minAccuracy: number): boolean {
  const kpms = [...earlier.filter((t) => t.accuracy >= minAccuracy).map((t) => t.kpm), r.kpm]
  if (r.accuracy < minAccuracy || kpms.length < 3) return false
  const [a, b, c] = kpms.slice(-3)
  return a < b && b < c
}
