import { describe, expect, it } from 'vitest'
import { STORIES, storyKey, storyPart } from './da/stories'
import { difficulty, lix } from './lix'

describe('stories', () => {
  it('use only keys from the learning path (plus ? ! " : for adults) and are about 200 words', () => {
    for (const s of STORIES) {
      expect(s.text).toMatch(s.adults ? /^[a-zA-ZæøåÆØÅ ,.\-?!":]+$/ : /^[a-zA-ZæøåÆØÅ ,.-]+$/)
      const words = s.text.split(/\s+/).length
      expect(words).toBeGreaterThanOrEqual(170)
      expect(words).toBeLessThanOrEqual(230)
    }
  })

  it('cover easy, medium and hard for kids, plus texts for adults', () => {
    const levels = STORIES.filter((s) => !s.adults).map((s) => difficulty(lix(s.text)))
    expect(levels).toEqual(['easy', 'medium', 'hard'])
    expect(STORIES.filter((s) => s.adults).map((s) => s.id)).toEqual(['hamlet', 'bier', 'zebra'])
  })

  it('give the newspaper-style adult texts a LIX of 40–50', () => {
    for (const id of ['bier', 'zebra']) {
      const l = lix(STORIES.find((s) => s.id === id)!.text)
      expect(l, id).toBeGreaterThanOrEqual(40)
      expect(l, id).toBeLessThanOrEqual(50)
    }
  })

  it('use plenty of the letters that are rare in Danish in the English text', () => {
    const text = STORIES.find((s) => s.id === 'zebra')!.text.toLowerCase()
    for (const ch of 'zqxwc') expect(text.split(ch).length - 1, ch).toBeGreaterThanOrEqual(5)
  })

  it('keeps the old leaderboard key for training and a separate one for real writing', () => {
    expect(storyKey('raeven', 1)).toBe('raeven:1:v2')
    expect(storyKey('raeven', 1, 'strict')).toBe('raeven:1:v2')
    expect(storyKey('raeven', 1, 'real')).toBe('raeven:1:v2:real')
  })

  it('pass the same word blocklist as the word list', () => {
    // From scripts/build-wordlist.ts.
    const blocked = new Set(['lort', 'pis', 'pisse', 'pik', 'pikke', 'fisse', 'kusse', 'røv', 'røven', 'røvhul', 'fanden', 'fandens', 'satan', 'satans'])
    const parts = /sex|nazi|porno|fuck|lort|knep|pisse|luder|ludder/
    for (const s of STORIES) {
      for (const w of s.text.toLowerCase().split(/[^a-zæøå]+/).filter(Boolean)) {
        expect(blocked.has(w), w).toBe(false)
        expect(parts.test(w), w).toBe(false)
      }
    }
  })

  it('cuts into a quarter and a half at sentence ends', () => {
    for (const s of STORIES) {
      const quarter = storyPart(s.text, 1)
      const half = storyPart(s.text, 2)
      expect(quarter).toMatch(/[.?!]$/)
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
