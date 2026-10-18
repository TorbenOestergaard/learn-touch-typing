// Central tuning knobs. Per-profile overrides live in Profile.settings.

export interface Thresholds {
  /** Minimum accuracy (0–1) to pass an exercise. */
  minAccuracy: number
  /** Required keystrokes per minute in module 1. */
  baseKpm: number
  /** Added to the required speed for each following module. */
  kpmStepPerModule: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  minAccuracy: 0.95,
  baseKpm: 30,
  kpmStepPerModule: 5,
}

export const EXERCISES_PER_MODULE = 6

/** Number of text lines per exercise (index 0..5). Short early, longer later. */
export const LINES_PER_EXERCISE = [2, 2, 3, 3, 4, 4]
export const LINES_PER_TEST = 4

/** Target characters per line. */
export const LINE_LENGTH = 36
/** Stories use smaller text, so lines can be longer. */
export const STORY_LINE_LENGTH = 56

/** Star thresholds, relative to the required speed. */
export const STARS = {
  two: { accuracy: 0.97, speedFactor: 1.2 },
  three: { accuracy: 0.98, speedFactor: 1.5 },
}

/** Default daily goal in minutes of typing. Parents can change it per profile. */
export const DAILY_GOAL_MINUTES = 10

/** Failed attempts in a row before a warm-up drill is suggested. */
export const FAILS_BEFORE_WARMUP = 3

export function requiredKpm(t: Thresholds, moduleId: number): number {
  return t.baseKpm + t.kpmStepPerModule * (moduleId - 1)
}
