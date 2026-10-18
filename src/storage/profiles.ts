// Local profiles and progress, stored in localStorage. Versioned so it can migrate
// to a backend later.

import { DAILY_GOAL_MINUTES, DEFAULT_THRESHOLDS, EXERCISES_PER_MODULE, type Thresholds } from '../config'
import { MODULES } from '../content/da/modules'
import type { SessionResult } from '../engine/stats'
import type { SpeedUnit } from '../format'

export const STORAGE_KEY = 'ltt:v1'
const VERSION = 1

/** 0-based exercise index, or 'test' for the module test. */
export type ExerciseId = number | 'test'

export interface ExerciseRecord {
  attempts: number
  passed: boolean
  bestStars: number
  bestKpm: number
  bestAccuracy: number
  lastKpm: number
  lastAccuracy: number
  failsInRow: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
  settings: Thresholds
  /** Keyed by exerciseKey(moduleId, exercise). */
  progress: Record<string, ExerciseRecord>
  /** Lifetime errors per character, for warm-ups. */
  keyErrors: Record<string, number>
  /** Added after v1 launched, so optional. */
  prefs?: { sound?: boolean; speedUnit?: SpeedUnit; dailyGoalMinutes?: number }
  /** Best story result per storyKey(id, part). */
  storyBest?: Record<string, StoryRecord>
  /** Every finished attempt, oldest first. Basis for streaks, progress graphs and leaderboards. */
  history?: Attempt[]
}

export type AttemptKind = 'exercise' | 'test' | 'warmup' | 'story'

export interface Attempt {
  /** Finish time, ms since epoch. */
  at: number
  kind: AttemptKind
  moduleId?: number
  /** 0-based exercise index, for kind 'exercise'. */
  ex?: number
  storyKey?: string
  kpm: number
  accuracy: number
  durationMs: number
  correct: number
  errors: number
  /** Exercises and tests. */
  stars?: number
  /** Stories. */
  points?: number
}

export interface StoryRecord {
  points: number
  kpm: number
  accuracy: number
  attempts: number
  date: number
}

export interface Store {
  version: number
  profiles: Profile[]
  activeProfileId: string | null
}

export const exerciseKey = (moduleId: number, ex: ExerciseId) => `${moduleId}:${ex}`

export function emptyStore(): Store {
  return { version: VERSION, profiles: [], activeProfileId: null }
}

export function loadStore(storage: Storage | undefined = globalThis.localStorage): Store {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Store
    if (parsed.version !== VERSION || !Array.isArray(parsed.profiles)) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

export function saveStore(store: Store, storage: Storage | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Private mode or full storage: progress just isn't kept.
  }
}

export function createProfile(name: string, avatar: string): Profile {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatar,
    createdAt: Date.now(),
    settings: { ...DEFAULT_THRESHOLDS },
    progress: {},
    keyErrors: {},
  }
}

export function recordAttempt(
  profile: Profile,
  moduleId: number,
  ex: ExerciseId,
  result: SessionResult,
  stars: number,
): Profile {
  const key = exerciseKey(moduleId, ex)
  const prev = profile.progress[key]
  const passed = stars > 0
  const record: ExerciseRecord = {
    attempts: (prev?.attempts ?? 0) + 1,
    passed: (prev?.passed ?? false) || passed,
    bestStars: Math.max(prev?.bestStars ?? 0, stars),
    bestKpm: Math.max(prev?.bestKpm ?? 0, result.kpm),
    bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, result.accuracy),
    lastKpm: result.kpm,
    lastAccuracy: result.accuracy,
    failsInRow: passed ? 0 : (prev?.failsInRow ?? 0) + 1,
  }
  const keyErrors = { ...profile.keyErrors }
  for (const [ch, n] of Object.entries(result.errorsByChar)) {
    keyErrors[ch] = (keyErrors[ch] ?? 0) + n
  }
  return { ...profile, progress: { ...profile.progress, [key]: record }, keyErrors }
}

/** Clears everything earned, so stars, streaks, badges and story results start over. Settings stay. */
export function resetProgress(profile: Profile): Profile {
  return { ...profile, progress: {}, keyErrors: {}, history: [], storyBest: {} }
}

export function isPassedEx(profile: Profile, moduleId: number, ex: ExerciseId): boolean {
  return profile.progress[exerciseKey(moduleId, ex)]?.passed ?? false
}

/** An exercise is open when the one before it is passed (the module test counts for the next module). */
export function isUnlocked(profile: Profile, moduleId: number, ex: ExerciseId): boolean {
  if (ex === 'test') return isPassedEx(profile, moduleId, EXERCISES_PER_MODULE - 1)
  if (ex > 0) return isPassedEx(profile, moduleId, ex - 1)
  const idx = MODULES.findIndex((m) => m.id === moduleId)
  return idx === 0 || isPassedEx(profile, MODULES[idx - 1].id, 'test')
}

/** The next exercise to do: the first unlocked one that isn't passed yet. */
export function nextExercise(profile: Profile): { moduleId: number; ex: ExerciseId } | null {
  for (const m of MODULES) {
    const all: ExerciseId[] = [...Array.from({ length: EXERCISES_PER_MODULE }, (_, i) => i), 'test']
    for (const ex of all) {
      if (!isPassedEx(profile, m.id, ex)) return { moduleId: m.id, ex }
    }
  }
  return null
}

export function totalStars(profile: Profile): number {
  return Object.values(profile.progress).reduce((sum, r) => sum + r.bestStars, 0)
}

export const soundOn = (p: Profile) => p.prefs?.sound ?? true
export const speedUnitOf = (p: Profile): SpeedUnit => p.prefs?.speedUnit ?? 'kpm'
/** Minutes of typing per day to aim for. 0 hides the goal. */
export const dailyGoalOf = (p: Profile): number => p.prefs?.dailyGoalMinutes ?? DAILY_GOAL_MINUTES

/** Story score: speed, with errors weighing in twice so accuracy pays off. */
export function storyPoints(r: SessionResult): number {
  return Math.round(r.kpm * r.accuracy ** 2)
}

export function recordStory(
  profile: Profile,
  key: string,
  result: SessionResult,
): { profile: Profile; points: number; isRecord: boolean } {
  const points = storyPoints(result)
  const prev = profile.storyBest?.[key]
  const isRecord = !prev || points > prev.points
  const record: StoryRecord = isRecord
    ? { points, kpm: result.kpm, accuracy: result.accuracy, attempts: (prev?.attempts ?? 0) + 1, date: Date.now() }
    : { ...prev, attempts: prev.attempts + 1 }
  return {
    profile: { ...profile, storyBest: { ...profile.storyBest, [key]: record } },
    points,
    isRecord,
  }
}

/** Best result per profile for a story, highest points first. */
export function leaderboard(profiles: Profile[], key: string): { profile: Profile; record: StoryRecord }[] {
  return profiles
    .flatMap((profile) => {
      const record = profile.storyBest?.[key]
      return record ? [{ profile, record }] : []
    })
    .sort((a, b) => b.record.points - a.record.points)
}

export function logAttempt(
  profile: Profile,
  result: SessionResult,
  attempt: Pick<Attempt, 'kind' | 'moduleId' | 'ex' | 'storyKey' | 'stars' | 'points'>,
  at = Date.now(),
): Profile {
  const entry: Attempt = {
    ...attempt,
    at,
    kpm: result.kpm,
    accuracy: result.accuracy,
    durationMs: Math.round(result.durationMs),
    correct: result.correct,
    errors: result.errors,
  }
  return { ...profile, history: [...(profile.history ?? []), entry] }
}
