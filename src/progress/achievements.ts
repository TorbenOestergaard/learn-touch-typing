// Achievements are derived from history and progress, never stored, so they also work for
// attempts made before they existed. A new one is found by comparing before and after an attempt.

import { MODULES } from '../content/da/modules'
import { STORIES } from '../content/da/stories'
import { commonWordsAfter } from '../content/generator'
import { isPassedEx, type Profile } from '../storage/profiles'
import { streak, totalKeystrokes } from './streak'

export type AchievementType =
  | 'firstExercise'
  | 'firstThreeStars'
  | 'module'
  | 'streak'
  | 'keystrokes'
  | 'firstStory'
  | 'allStories'
  | 'allWords'

export interface Achievement {
  id: string
  type: AchievementType
  /** Module id, streak days or keystrokes, depending on the type. */
  n: number
  emoji: string
}

export interface AchievementStatus extends Achievement {
  unlocked: boolean
  /** How far along a counting achievement is. */
  progress?: { have: number; need: number }
}

export const STREAK_GOALS = [3, 7, 30]
export const KEYSTROKE_GOALS = [1_000, 10_000, 100_000]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-exercise', type: 'firstExercise', n: 0, emoji: '🐣' },
  { id: 'first-3-stars', type: 'firstThreeStars', n: 0, emoji: '🌟' },
  ...MODULES.map((m) => ({ id: `module-${m.id}`, type: 'module' as const, n: m.id, emoji: '🏆' })),
  ...STREAK_GOALS.map((n) => ({ id: `streak-${n}`, type: 'streak' as const, n, emoji: '🔥' })),
  ...KEYSTROKE_GOALS.map((n) => ({ id: `keys-${n}`, type: 'keystrokes' as const, n, emoji: '⌨️' })),
  { id: 'first-story', type: 'firstStory', n: 0, emoji: '📖' },
  { id: 'all-stories', type: 'allStories', n: STORIES.length, emoji: '📚' },
  { id: 'all-words', type: 'allWords', n: 0, emoji: '🧠' },
]

/** Story ids the profile has finished at any length. Old results live only in storyBest. */
function storiesDone(profile: Profile): Set<string> {
  const keys = [
    ...(profile.history ?? []).flatMap((a) => (a.kind === 'story' && a.storyKey ? [a.storyKey] : [])),
    ...Object.keys(profile.storyBest ?? {}),
  ]
  return new Set(keys.map((k) => k.split(':')[0]))
}

export function achievementStatus(profile: Profile, now = Date.now()): AchievementStatus[] {
  const history = profile.history ?? []
  const records = Object.values(profile.progress)
  const bestStreak = streak(history, now).best
  const keystrokes = totalKeystrokes(history)
  const stories = storiesDone(profile)
  const lastPassed = [...MODULES].reverse().find((m) => isPassedEx(profile, m.id, 'test'))
  const words = lastPassed ? commonWordsAfter(lastPassed.id) : null

  return ACHIEVEMENTS.map((a): AchievementStatus => {
    switch (a.type) {
      case 'firstExercise':
        return { ...a, unlocked: records.length > 0 || history.some((h) => h.kind === 'exercise' || h.kind === 'test') }
      case 'firstThreeStars':
        return { ...a, unlocked: records.some((r) => r.bestStars >= 3) }
      case 'module':
        return { ...a, unlocked: isPassedEx(profile, a.n, 'test') }
      case 'streak':
        return { ...a, unlocked: bestStreak >= a.n, progress: { have: Math.min(bestStreak, a.n), need: a.n } }
      case 'keystrokes':
        return { ...a, unlocked: keystrokes >= a.n, progress: { have: Math.min(keystrokes, a.n), need: a.n } }
      case 'firstStory':
        return { ...a, unlocked: stories.size > 0 }
      case 'allStories': {
        const have = STORIES.filter((s) => stories.has(s.id)).length
        return { ...a, unlocked: have >= a.n, progress: { have, need: a.n } }
      }
      case 'allWords':
        return { ...a, unlocked: !!words && words.count >= words.total }
    }
  })
}

/** Achievements unlocked in `after` but not in `before`, e.g. by the attempt just finished. */
export function newlyUnlocked(before: Profile, after: Profile, now = Date.now()): Achievement[] {
  const had = new Set(achievementStatus(before, now).filter((a) => a.unlocked).map((a) => a.id))
  return achievementStatus(after, now).filter((a) => a.unlocked && !had.has(a.id))
}
