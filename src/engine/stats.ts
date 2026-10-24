import { STARS, UNCORRECTED_ERROR_WEIGHT } from '../config'
import { uncorrectedErrors, type SessionState } from './session'

export interface SessionResult {
  /** Correct keystrokes per minute. */
  kpm: number
  /** correct / (correct + errors), 0–1. */
  accuracy: number
  durationMs: number
  correct: number
  /** Wrong key presses, plus the extra weight of errors left unfixed ('real' mode). */
  errors: number
  /** Wrong characters left in the text at the end. Always 0 in 'strict' mode. */
  uncorrected?: number
  errorsByChar: Record<string, number>
}

export function computeResult(s: SessionState): SessionResult {
  const durationMs =
    s.startedAt !== null && s.finishedAt !== null ? s.finishedAt - s.startedAt : 0
  const minutes = durationMs / 60_000
  // A one-keystroke session has zero duration; treat it as instant rather than infinite.
  const kpm = minutes > 0 ? s.correct / minutes : 0
  const uncorrected = uncorrectedErrors(s)
  const errors = s.errors + uncorrected * (UNCORRECTED_ERROR_WEIGHT - 1)
  const total = s.correct + errors
  return {
    kpm: Math.round(kpm * 100) / 100,
    accuracy: total > 0 ? s.correct / total : 1,
    durationMs,
    correct: s.correct,
    errors,
    uncorrected,
    errorsByChar: s.errorsByChar,
  }
}

export function isPassed(r: SessionResult, minAccuracy: number, minKpm: number): boolean {
  return r.accuracy >= minAccuracy && r.kpm >= minKpm
}

/** 0 = not passed, 1–3 stars when passed. */
export function starsFor(r: SessionResult, minAccuracy: number, minKpm: number): number {
  if (!isPassed(r, minAccuracy, minKpm)) return 0
  if (r.accuracy >= STARS.three.accuracy && r.kpm >= minKpm * STARS.three.speedFactor) return 3
  if (r.accuracy >= STARS.two.accuracy && r.kpm >= minKpm * STARS.two.speedFactor) return 2
  return 1
}

/** Characters with the most errors, most first. Space is reported as ' '. */
export function weakKeys(errorsByChar: Record<string, number>, count = 3): string[] {
  return Object.entries(errorsByChar)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([ch]) => ch)
}
