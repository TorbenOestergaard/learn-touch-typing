// What each star needs, and how far a result is from the next one.

import { STARS, requiredKpm, type Thresholds } from '../config'

export interface StarTier {
  stars: 1 | 2 | 3
  kpm: number
  accuracy: number
}

export function starTiers(t: Thresholds, moduleId?: number): StarTier[] {
  const kpm = requiredKpm(t, moduleId)
  return [
    { stars: 1, kpm, accuracy: t.minAccuracy },
    { stars: 2, kpm: kpm * STARS.two.speedFactor, accuracy: STARS.two.accuracy },
    { stars: 3, kpm: kpm * STARS.three.speedFactor, accuracy: STARS.three.accuracy },
  ]
}

export interface StarGap {
  tier: StarTier
  speedOk: boolean
  accuracyOk: boolean
  /** Keystrokes per minute still missing, 0 when met. */
  speedGap: number
  /** Accuracy still missing (0–1), 0 when met. */
  accuracyGap: number
}

/** The next star above `stars` and what the result lacks for it; null at 3 stars. */
export function nextStarGap(
  r: { kpm: number; accuracy: number },
  stars: number,
  t: Thresholds,
  moduleId?: number,
): StarGap | null {
  const tier = starTiers(t, moduleId).find((x) => x.stars > stars)
  if (!tier) return null
  return {
    tier,
    speedOk: r.kpm >= tier.kpm,
    accuracyOk: r.accuracy >= tier.accuracy,
    speedGap: Math.max(0, Math.ceil(tier.kpm - r.kpm)),
    accuracyGap: Math.max(0, tier.accuracy - r.accuracy),
  }
}

/** Stars a speed and accuracy earn (0–3), from the same tiers. */
export function starsOf(r: { kpm: number; accuracy: number }, t: Thresholds, moduleId?: number): number {
  // In order, so a parent's stricter pass accuracy can't give a higher star without passing.
  const met = starTiers(t, moduleId).map((x) => r.kpm >= x.kpm && r.accuracy >= x.accuracy)
  const firstMiss = met.indexOf(false)
  return firstMiss === -1 ? met.length : firstMiss
}

/** Speed gap to the next star, when accuracy already meets it; null otherwise or at 3 stars. */
export function speedGapToNextStar(
  r: { kpm: number; accuracy: number },
  t: Thresholds,
  moduleId?: number,
): { gap: number; stars: number } | null {
  const g = nextStarGap(r, starsOf(r, t, moduleId), t, moduleId)
  return g && g.accuracyOk ? { gap: g.speedGap, stars: g.tier.stars } : null
}
