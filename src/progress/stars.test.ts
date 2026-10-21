import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLDS } from '../config'
import { nextStarGap, speedGapToNextStar, starTiers, starsOf } from './stars'

const t = DEFAULT_THRESHOLDS

describe('stars', () => {
  it('has three tiers from the thresholds', () => {
    expect(starTiers(t).map((x) => [x.stars, x.kpm, x.accuracy])).toEqual([
      [1, 60, 0.95],
      [2, 72, 0.97],
      [3, 90, 0.98],
    ])
  })

  it('counts stars needing both speed and accuracy', () => {
    expect(starsOf({ kpm: 86, accuracy: 0.97 }, t)).toBe(2)
    expect(starsOf({ kpm: 95, accuracy: 0.96 }, t)).toBe(1)
    expect(starsOf({ kpm: 95, accuracy: 0.94 }, t)).toBe(0)
  })

  it('reports the gap to the next star for each measure', () => {
    expect(nextStarGap({ kpm: 86, accuracy: 0.97 }, 2, t)).toMatchObject({
      tier: { stars: 3 },
      speedOk: false,
      accuracyOk: false,
      speedGap: 4,
    })
    expect(nextStarGap({ kpm: 92, accuracy: 0.99 }, 3, t)).toBeNull()
  })

  it('only calls a speed gap near when accuracy is already there', () => {
    expect(speedGapToNextStar({ kpm: 86, accuracy: 0.98 }, t)).toEqual({ gap: 4, stars: 3 })
    expect(speedGapToNextStar({ kpm: 86, accuracy: 0.97 }, t)).toBeNull()
  })
})
