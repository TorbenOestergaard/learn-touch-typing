import { describe, expect, it } from 'vitest'
import { LINE_LENGTH, LINES_PER_EXERCISE, LINES_PER_TEST } from '../config'
import { MODULES, allowedKeys, shiftAllowed } from './da/modules'
import { generateExercise, generateTest, generateWarmup, wordsFor } from './generator'

const SEEDS = [1, 2, 3, 42, 1234]

function allowedChars(moduleId: number): Set<string> {
  const keys = allowedKeys(moduleId)
  const chars = new Set([...keys, ' '])
  if (shiftAllowed(moduleId)) {
    for (const k of keys) chars.add(k.toUpperCase())
  }
  return chars
}

describe('generator', () => {
  for (const m of MODULES) {
    describe(`module ${m.id}`, () => {
      const chars = allowedChars(m.id)

      it('uses only learned keys, keeps lines short and non-empty', () => {
        for (const seed of SEEDS) {
          for (let i = 0; i < LINES_PER_EXERCISE.length; i++) {
            const lines = generateExercise(m.id, i, seed)
            expect(lines).toHaveLength(LINES_PER_EXERCISE[i])
            for (const line of lines) {
              expect(line.length).toBeGreaterThan(0)
              expect(line.length).toBeLessThanOrEqual(LINE_LENGTH + 8)
              expect(line).not.toMatch(/^ | $|  /)
              for (const c of line) expect(chars.has(c), `"${c}" in "${line}"`).toBe(true)
            }
          }
          const test = generateTest(m.id, seed)
          expect(test).toHaveLength(LINES_PER_TEST)
          for (const c of test.join('')) expect(chars.has(c)).toBe(true)
        }
      })

      it('includes every new letter in each exercise', () => {
        const letters = m.newKeys.filter((k) => /[a-zæøå]/.test(k))
        for (const seed of SEEDS) {
          for (let i = 0; i < LINES_PER_EXERCISE.length; i++) {
            const text = generateExercise(m.id, i, seed).join(' ').toLowerCase()
            for (const c of letters) expect(text, `module ${m.id} ex ${i}`).toContain(c)
          }
        }
      })

      it('is deterministic for a seed', () => {
        expect(generateExercise(m.id, 2, 7)).toEqual(generateExercise(m.id, 2, 7))
      })
    })
  }

  it('starts with real Danish words in module 1', () => {
    const words = wordsFor(allowedKeys(1))
    expect(words).toEqual(expect.arrayContaining(['der', 'ikke', 'fik']))
  })

  it('uses capitals from the Shift module and full stops from module 7', () => {
    expect(generateExercise(3, 5, 1).join(' ')).not.toMatch(/[A-ZÆØÅ]/)
    expect(generateExercise(4, 5, 1)[0]).toMatch(/^[A-ZÆØÅ]/)
    expect(generateExercise(7, 5, 1).join(' ')).toMatch(/\./)
  })

  it('builds warm-ups around weak keys', () => {
    const text = generateWarmup(2, ['s', 'o'], 1).join(' ')
    expect(text).toContain('sss')
    expect(text).toContain('o')
  })
})
