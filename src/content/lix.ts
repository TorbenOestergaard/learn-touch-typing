// LIX readability index: words per sentence + percentage of long words (more than 6 letters).
// Rough guide: under 25 easy (children's books), 25–35 medium, 35–45 harder fiction.

export function lix(text: string): number {
  const words = text.split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, '')).filter(Boolean)
  const sentences = Math.max(1, (text.match(/[.!?:]+/g) ?? []).length)
  const long = words.filter((w) => w.length > 6).length
  return Math.round(words.length / sentences + (100 * long) / Math.max(1, words.length))
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export function difficulty(lixValue: number): Difficulty {
  if (lixValue < 25) return 'easy'
  if (lixValue < 35) return 'medium'
  return 'hard'
}
