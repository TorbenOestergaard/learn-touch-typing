import { describe, expect, it } from 'vitest'
import { EXERCISES_PER_MODULE } from '../config'
import { MODULES } from '../content/da/modules'
import { STORIES, storyKey } from '../content/da/stories'
import type { SessionResult } from '../engine/stats'
import { createProfile, logAttempt, recordAttempt, type Profile } from '../storage/profiles'
import { ACHIEVEMENTS, achievementStatus, newlyUnlocked } from './achievements'

const NOW = new Date(2026, 9, 18, 12).getTime()
const result = (correct = 100): SessionResult => ({
  kpm: 60,
  accuracy: 0.99,
  durationMs: 60_000,
  correct,
  errors: 0,
  errorsByChar: {},
})

const unlocked = (p: Profile) =>
  achievementStatus(p, NOW)
    .filter((a) => a.unlocked)
    .map((a) => a.id)

function exercise(p: Profile, moduleId: number, ex: number | 'test', stars: number, at = NOW): Profile {
  return logAttempt(recordAttempt(p, moduleId, ex, result(), stars), result(), {
    kind: ex === 'test' ? 'test' : 'exercise',
    moduleId,
    stars,
  }, at)
}

function passModule(p: Profile, moduleId: number): Profile {
  for (let ex = 0; ex < EXERCISES_PER_MODULE; ex++) p = exercise(p, moduleId, ex, 1)
  return exercise(p, moduleId, 'test', 1)
}

describe('achievements', () => {
  it('has unique ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })

  it('a new profile has none', () => {
    expect(unlocked(createProfile('Ida', '🦊'))).toEqual([])
  })

  it('unlocks the first exercise and the first 3 stars', () => {
    const p = exercise(createProfile('Ida', '🦊'), 1, 0, 1)
    expect(unlocked(p)).toEqual(['first-exercise'])
    expect(unlocked(exercise(p, 1, 1, 3))).toEqual(['first-exercise', 'first-3-stars'])
  })

  it('works from progress alone, for attempts made before history existed', () => {
    const p = recordAttempt(createProfile('Ida', '🦊'), 1, 0, result(), 3)
    expect(unlocked(p)).toEqual(['first-exercise', 'first-3-stars'])
  })

  it('unlocks a module when its test is passed', () => {
    const p = passModule(createProfile('Ida', '🦊'), 1)
    expect(unlocked(p)).toContain('module-1')
    expect(unlocked(p)).not.toContain('module-2')
  })

  it('unlocks all 1,000 words after the last module', () => {
    let p = createProfile('Ida', '🦊')
    for (const m of MODULES) p = passModule(p, m.id)
    expect(unlocked(p)).toContain('all-words')
    expect(unlocked(passModule(createProfile('Ida', '🦊'), 1))).not.toContain('all-words')
  })

  it('counts streaks by best streak, with progress', () => {
    let p = createProfile('Ida', '🦊')
    for (const d of [10, 11, 12]) p = exercise(p, 1, 0, 1, new Date(2026, 9, d).getTime())
    const status = achievementStatus(p, NOW)
    expect(status.find((a) => a.id === 'streak-3')?.unlocked).toBe(true)
    expect(status.find((a) => a.id === 'streak-7')).toMatchObject({ unlocked: false, progress: { have: 3, need: 7 } })
  })

  it('counts keystrokes', () => {
    let p = createProfile('Ida', '🦊')
    for (let i = 0; i < 9; i++) p = exercise(p, 1, 0, 1)
    expect(unlocked(p)).not.toContain('keys-1000')
    expect(unlocked(exercise(p, 1, 0, 1))).toContain('keys-1000')
  })

  it('counts stories from history and the old storyBest', () => {
    let p = logAttempt(createProfile('Ida', '🦊'), result(), { kind: 'story', storyKey: storyKey(STORIES[0].id, 1) })
    expect(unlocked(p)).toEqual(['first-story'])
    p = { ...p, storyBest: { [storyKey(STORIES[1].id, 3)]: { points: 1, kpm: 1, accuracy: 1, attempts: 1, date: 0 } } }
    p = logAttempt(p, result(), { kind: 'story', storyKey: storyKey(STORIES[2].id, 2) })
    expect(unlocked(p)).toContain('all-stories')
  })

  it('finds what an attempt newly unlocked', () => {
    const before = exercise(createProfile('Ida', '🦊'), 1, 0, 1)
    const after = exercise(before, 1, 1, 3)
    expect(newlyUnlocked(before, after, NOW).map((a) => a.id)).toEqual(['first-3-stars'])
    expect(newlyUnlocked(after, after, NOW)).toEqual([])
  })
})
