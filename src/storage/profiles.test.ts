import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES_PER_MODULE } from '../config'
import type { SessionResult } from '../engine/stats'
import {
  createProfile,
  leaderboard,
  logAttempt,
  recordStory,
  resetProgress,
  emptyStore,
  isUnlocked,
  migrateProfile,
  testCounts,
  loadStore,
  nextExercise,
  recordAttempt,
  saveStore,
  STORAGE_KEY,
} from './profiles'

const result = (kpm: number, accuracy: number): SessionResult => ({
  kpm,
  accuracy,
  durationMs: 60_000,
  correct: kpm,
  errors: 1,
  errorsByChar: { f: 1 },
})

describe('profiles', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through localStorage', () => {
    const store = { ...emptyStore(), profiles: [createProfile(' Ida ', '🦊')] }
    saveStore(store)
    const loaded = loadStore()
    expect(loaded.profiles[0].name).toBe('Ida')
  })

  it('falls back to an empty store on bad data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadStore()).toEqual(emptyStore())
  })

  it('keeps the best result and counts fails in a row', () => {
    let p = createProfile('Ida', '🦊')
    p = recordAttempt(p, 1, 0, result(20, 0.9), 0)
    p = recordAttempt(p, 1, 0, result(25, 0.9), 0)
    expect(p.progress['1:0'].failsInRow).toBe(2)
    p = recordAttempt(p, 1, 0, result(35, 0.98), 2)
    p = recordAttempt(p, 1, 0, result(31, 0.96), 1)
    const r = p.progress['1:0']
    expect(r).toMatchObject({ attempts: 4, passed: true, bestStars: 2, bestKpm: 35, failsInRow: 0 })
    expect(p.keyErrors.f).toBe(4)
  })

  it('unlocks exercises in order and the next module after the test', () => {
    let p = createProfile('Ida', '🦊')
    expect(isUnlocked(p, 1, 0)).toBe(true)
    expect(isUnlocked(p, 1, 1)).toBe(false)
    expect(isUnlocked(p, 2, 0)).toBe(false)
    for (let i = 0; i < EXERCISES_PER_MODULE; i++) p = recordAttempt(p, 1, i, result(40, 1), 1)
    expect(testCounts(p, 1)).toBe(true)
    expect(nextExercise(p)).toEqual({ moduleId: 1, ex: 'test' })
    p = recordAttempt(p, 1, 'test', result(40, 1), 1)
    expect(isUnlocked(p, 2, 0)).toBe(true)
    expect(nextExercise(p)).toEqual({ moduleId: 2, ex: 0 })
  })

  it('keeps the best story result and ranks profiles', () => {
    let ida = createProfile('Ida', '🦊')
    let bo = createProfile('Bo', '🐼')
    const first = recordStory(ida, 's:1', result(100, 0.9))
    expect(first).toMatchObject({ points: 81, isRecord: true })
    const worse = recordStory(first.profile, 's:1', result(60, 1))
    expect(worse.isRecord).toBe(false)
    ida = worse.profile
    expect(ida.storyBest?.['s:1']).toMatchObject({ points: 81, attempts: 2 })
    bo = recordStory(bo, 's:1', result(90, 1)).profile
    expect(leaderboard([ida, bo], 's:1').map((e) => e.profile.name)).toEqual(['Bo', 'Ida'])
    expect(leaderboard([ida, bo], 's:2')).toEqual([])
  })

  it('logs every attempt in order', () => {
    let p = createProfile('Ida', '🦊')
    p = logAttempt(p, result(30, 0.9), { kind: 'exercise', moduleId: 1, ex: 0, stars: 0 }, 1)
    p = logAttempt(p, result(80, 1), { kind: 'story', storyKey: 's:1:v2', points: 80 }, 2)
    expect(p.history?.map((a) => [a.at, a.kind, a.kpm])).toEqual([
      [1, 'exercise', 30],
      [2, 'story', 80],
    ])
  })

  it('reset clears progress, history and story results but keeps settings', () => {
    let p = createProfile('Ida', '🦊')
    p = { ...p, settings: { ...p.settings, baseKpm: 20 }, prefs: { dailyGoalMinutes: 5 } }
    p = recordAttempt(p, 1, 0, result(40, 0.99), 1)
    p = logAttempt(recordStory(p, 'raeven:1:v2', result(40, 0.99)).profile, result(40, 0.99), { kind: 'story' })
    const r = resetProgress(p)
    expect(r).toMatchObject({ progress: {}, keyErrors: {}, history: [], storyBest: {} })
    expect(r.settings.baseKpm).toBe(20)
    expect(r.prefs).toEqual({ dailyGoalMinutes: 5 })
  })

  it('keeps every module test open, but an early pass does not finish the module', () => {
    let p = createProfile('Ida', '🦊')
    expect(isUnlocked(p, 5, 'test')).toBe(true)
    expect(testCounts(p, 5)).toBe(false)
    p = recordAttempt(p, 5, 'test', result(80, 1), 2, false)
    expect(p.progress['5:test']).toMatchObject({ attempts: 1, passed: false, bestStars: 0, bestKpm: 80 })
    expect(isUnlocked(p, 6, 0)).toBe(false)
  })

  it('skips finished modules when suggesting the next exercise', () => {
    // Module 1 was finished with 6 exercises, before the 7th was added.
    let p = createProfile('Ida', '🦊')
    for (let i = 0; i < 6; i++) p = recordAttempt(p, 1, i, result(40, 1), 1)
    p = recordAttempt(p, 1, 'test', result(40, 1), 1)
    expect(isUnlocked(p, 1, 6)).toBe(true)
    expect(nextExercise(p)).toEqual({ moduleId: 2, ex: 0 })
    expect(testCounts(p, 1)).toBe(true)
  })

  it('migrates the old default speed but keeps a custom one', () => {
    const old = { ...createProfile('Ida', '🦊'), rulesVersion: undefined }
    const p = migrateProfile({ ...old, settings: { minAccuracy: 0.95, baseKpm: 30, kpmStepPerModule: 5 } })
    expect(p.settings).toEqual({ minAccuracy: 0.95, baseKpm: 60 })
    expect(p.rulesVersion).toBe(2)
    const custom = migrateProfile({ ...old, settings: { minAccuracy: 0.9, baseKpm: 25, kpmStepPerModule: 5 } })
    expect(custom.settings).toEqual({ minAccuracy: 0.9, baseKpm: 25 })
    const chosen = { ...p, settings: { ...p.settings, baseKpm: 30 } }
    expect(migrateProfile(chosen)).toBe(chosen)
  })

  it('migrates when loading', () => {
    const old = { ...createProfile('Ida', '🦊'), rulesVersion: undefined }
    old.settings = { minAccuracy: 0.95, baseKpm: 30, kpmStepPerModule: 5 }
    saveStore({ ...emptyStore(), profiles: [old] })
    expect(loadStore().profiles[0].settings.baseKpm).toBe(60)
  })
})
