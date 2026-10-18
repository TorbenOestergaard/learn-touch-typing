import { describe, expect, it } from 'vitest'
import { STORIES, storyPart } from './da/stories'
import { difficulty, lix } from './lix'

describe('stories', () => {
  it('use only keys from the learning path and fit on one A4 page', () => {
    for (const s of STORIES) {
      expect(s.text).toMatch(/^[a-zA-ZæøåÆØÅ ,.-]+$/)
      expect(s.text.split(/\s+/).length).toBeLessThanOrEqual(400)
    }
  })

  it('cover easy, medium and hard', () => {
    const levels = STORIES.map((s) => difficulty(lix(s.text)))
    expect(levels).toEqual(['easy', 'medium', 'hard'])
  })

  it('cuts into roughly thirds at sentence ends', () => {
    for (const s of STORIES) {
      const third = storyPart(s.text, 1)
      const twoThirds = storyPart(s.text, 2)
      expect(third.endsWith('.')).toBe(true)
      expect(s.text.startsWith(twoThirds)).toBe(true)
      expect(third.length / s.text.length).toBeGreaterThan(0.25)
      expect(third.length / s.text.length).toBeLessThan(0.42)
      expect(twoThirds.length / s.text.length).toBeGreaterThan(0.58)
      expect(twoThirds.length / s.text.length).toBeLessThan(0.75)
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
