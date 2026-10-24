// Central tuning knobs. Per-profile overrides live in Profile.settings.

export interface Thresholds {
  /** Minimum accuracy (0–1) to pass an exercise. */
  minAccuracy: number
  /** Required correct keystrokes per minute, the same in every module. */
  baseKpm: number
  /** @deprecated Until 0.3.0 the speed rose per module. Still in old stored data; ignored. */
  kpmStepPerModule?: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  minAccuracy: 0.95,
  baseKpm: 60,
}

/** The defaults before 0.3.0, used to migrate profiles nobody customised. */
export const OLD_DEFAULT_THRESHOLDS = { baseKpm: 30, kpmStepPerModule: 5 }

export const EXERCISES_PER_MODULE = 7

/** Number of text lines per exercise (index 0..6). Short early, longer later. */
export const LINES_PER_EXERCISE = [2, 2, 3, 3, 4, 4, 5]
export const LINES_PER_TEST = 4

/** Target characters per line. */
export const LINE_LENGTH = 36
/** Stories use smaller text, so lines can be longer. */
export const STORY_LINE_LENGTH = 56

/**
 * In Rigtig skrivning, a wrong character left unfixed counts as this many errors (its key press included),
 * so fixing a mistake with Backspace pays off.
 */
// The Lyntaster texts in i18n/da.ts say "tre gange"; update them if this changes.
export const UNCORRECTED_ERROR_WEIGHT = 3

/** Star thresholds, relative to the required speed. */
export const STARS = {
  two: { accuracy: 0.97, speedFactor: 1.2 },
  three: { accuracy: 0.98, speedFactor: 1.5 },
}

/** Default daily goal in minutes of typing. Parents can change it per profile. */
export const DAILY_GOAL_MINUTES = 10

/** Failed attempts in a row before a warm-up drill is suggested. */
export const FAILS_BEFORE_WARMUP = 3

/** The same in every module: harder keys are no reason to type faster. */
export function requiredKpm(t: Thresholds, _moduleId?: number): number {
  return t.baseKpm
}
