import { describe, expect, it } from 'vitest'
import { STORIES, storyPart } from './da/stories'
import { difficulty, lix } from './lix'

describe('stories', () => {
  it('use only keys from the learning path and are about 200 words', () => {
    for (const s of STORIES) {
      expect(s.text).toMatch(/^[a-zA-ZæøåÆØÅ ,.-]+$/)
      const words = s.text.split(/\s+/).length
      expect(words).toBeGreaterThanOrEqual(170)
      expect(words).toBeLessThanOrEqual(230)
    }
  })

  it('cover easy, medium and hard', () => {
    const levels = STORIES.map((s) => difficulty(lix(s.text)))
    expect(levels).toEqual(['easy', 'medium', 'hard'])
  })

  it('cuts into a quarter and a half at sentence ends', () => {
    for (const s of STORIES) {
      const quarter = storyPart(s.text, 1)
      const half = storyPart(s.text, 2)
      expect(quarter.endsWith('.')).toBe(true)
      expect(s.text.startsWith(half)).toBe(true)
      expect(quarter.length / s.text.length).toBeGreaterThan(0.17)
      expect(quarter.length / s.text.length).toBeLessThan(0.34)
      expect(half.length / s.text.length).toBeGreaterThan(0.4)
      expect(half.length / s.text.length).toBeLessThan(0.6)
      expect(storyPart(s.text, 3)).toBe(s.text)
    }
  })
})

describe('lix', () => {
  it('counts words per sentence plus long-word percentage', () => {
    // 4 words, 1 sentence, 1 long word (25 %) → 4 + 25
    expect(lix('Hunden spiser fantastisk mad.')).toBe(29)
  })
})
