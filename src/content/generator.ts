// Builds exercise text from the keys a learner knows. Deterministic for a given seed.

import { LINE_LENGTH, LINES_PER_EXERCISE, LINES_PER_TEST } from '../config'
import { keyFor, type Finger } from '../layouts/da'
import { allowedKeys, getModule, shiftAllowed } from './da/modules'
import WORDS from './da/words.json'

export type Rng = () => number

/** mulberry32: small, fast, seedable. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

const VOWELS = new Set('aeiouyæøå')
const HOME_KEY: Record<Finger, string> = {
  lp: 'a', lr: 's', lm: 'd', li: 'f', ri: 'j', rm: 'k', rr: 'l', rp: 'æ', th: ' ',
}
const isLetter = (c: string) => /^[a-zæøå]$/.test(c)
const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

/** Real words typeable with the given letters, most frequent first. */
export function wordsFor(letters: Set<string>): string[] {
  return (WORDS as string[]).filter((w) => [...w].every((c) => letters.has(c)))
}

/** A pronounceable made-up word from allowed letters that contains `must`. */
function gibberish(rng: Rng, letters: string[], must: string): string {
  const vowels = letters.filter((c) => VOWELS.has(c))
  const consonants = letters.filter((c) => !VOWELS.has(c))
  const len = 3 + Math.floor(rng() * 3)
  const startVowel = rng() < 0.3
  let w = ''
  for (let i = 0; i < len; i++) {
    const wantVowel = (i % 2 === 0) === startVowel
    const pool = wantVowel ? vowels : consonants
    w += pick(rng, pool.length > 0 ? pool : letters)
  }
  if (!w.includes(must)) {
    const pos = Math.floor(rng() * w.length)
    w = w.slice(0, pos) + must + w.slice(pos + 1)
  }
  return w
}

/** Wraps tokens into lines of at most LINE_LENGTH and returns the first `count`. */
function wrap(tokens: string[], count: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const t of tokens) {
    if (current && current.length + 1 + t.length > LINE_LENGTH) {
      lines.push(current)
      if (lines.length === count) return lines
      current = t
    } else {
      current = current ? `${current} ${t}` : t
    }
  }
  if (current && lines.length < count) lines.push(current)
  return lines
}

/** Short drills on the new keys: "fff jjj fjf", plus reaches from the finger's home key. */
function drillTokens(newKeys: string[], allowed: Set<string>, withShift: boolean): string[] {
  const tokens: string[] = []
  for (const c of newKeys) {
    tokens.push(c.repeat(3))
    const home = HOME_KEY[keyFor(c)?.finger ?? 'th']
    if (home !== c && allowed.has(home)) tokens.push(`${home}${c}${home}`)
  }
  for (let i = 0; i + 1 < newKeys.length; i += 2) {
    const [a, b] = [newKeys[i], newKeys[i + 1]]
    tokens.push(`${a}${b}${a}`, `${b}${a}${b}`)
  }
  if (withShift) {
    for (const c of newKeys.filter(isLetter)) tokens.push(capitalize(c + c))
  }
  return tokens
}

interface SourceOptions {
  allowed: Set<string>
  newKeys: string[]
  /** How many of the most frequent words to draw from (variety grows with this). */
  poolSize: number
  /** Share of tokens that must contain a new key. */
  newShare: number
  /** Allow made-up words. Otherwise only for keys that have no real words at all. */
  allowGibberish: boolean
}

// Made-up words must not accidentally spell something rude.
const RUDE = /fu[ck]|pik|pis|lort|røv|fis|kus|sex|nazi|hor|lud/

function wordSource(rng: Rng, o: SourceOptions) {
  const letters = [...o.allowed].filter(isLetter)
  const newLetters = o.newKeys.filter(isLetter)
  const all = wordsFor(new Set(letters))
  const pool = all.slice(0, o.poolSize)
  const newPool = all.filter((w) => newLetters.some((c) => w.includes(c))).slice(0, o.poolSize)

  const madeUp = (c: string): string => {
    for (;;) {
      const w = gibberish(rng, letters, c)
      if (!RUDE.test(w)) return w
    }
  }

  const withLetter = (c: string): string => {
    const real = all.filter((w) => w.includes(c)).slice(0, 30)
    if (real.length > 0 && !(o.allowGibberish && rng() < 0.3)) return pick(rng, real)
    return madeUp(c)
  }

  const next = (): string => {
    if (newLetters.length > 0 && rng() < o.newShare) {
      return newPool.length >= 4 && !(o.allowGibberish && rng() < 0.25)
        ? pick(rng, newPool)
        : withLetter(pick(rng, newLetters))
    }
    return pool.length > 0 ? pick(rng, pool) : madeUp(pick(rng, letters))
  }

  return { next, withLetter, newLetters }
}

function wordStream(source: ReturnType<typeof wordSource>, approxChars: number): string[] {
  const tokens: string[] = []
  let chars = 0
  while (chars < approxChars) {
    const t = source.next()
    if (t === tokens[tokens.length - 1]) continue
    tokens.push(t)
    chars += t.length + 1
  }
  return tokens
}

/** Replaces early tokens so every new letter appears within the first `fitting` tokens. */
function ensureLetters(
  rng: Rng,
  tokens: string[],
  fitting: number,
  source: ReturnType<typeof wordSource>,
): string[] {
  const out = [...tokens]
  const shown = () => out.slice(0, fitting).join(' ')
  const missing = source.newLetters.filter((c) => !shown().includes(c))
  for (const c of missing) {
    // Only overwrite tokens that are not the sole carrier of another new letter.
    for (let tries = 0; tries < 20; tries++) {
      const at = Math.floor(rng() * Math.max(1, Math.floor(fitting * 0.6)))
      const without = [...out.slice(0, at), ...out.slice(at + 1, fitting)].join(' ')
      if (source.newLetters.every((l) => l === c || !shown().includes(l) || without.includes(l))) {
        out[at] = source.withLetter(c)
        break
      }
    }
  }
  return out
}

/** Groups words into sentences: capital first letter, optional comma, full stop. */
function sentences(rng: Rng, words: string[], allowed: Set<string>): string[] {
  const out: string[] = []
  const hasComma = allowed.has(',')
  let i = 0
  while (i < words.length) {
    const len = 4 + Math.floor(rng() * 4)
    const s = words.slice(i, i + len)
    s[0] = capitalize(s[0])
    if (hasComma && s.length >= 4 && rng() < 0.4) {
      const at = 1 + Math.floor(rng() * (s.length - 2))
      s[at] += ','
    }
    s[s.length - 1] += '.'
    out.push(...s)
    i += len
  }
  return out
}

function finishLines(lines: string[], moduleId: number, allowed: Set<string>): string[] {
  if (!shiftAllowed(moduleId) || allowed.has('.')) return lines
  // Capitals but no full stop yet: each line is one "sentence".
  return lines.map(capitalize)
}

function textFromStream(
  rng: Rng,
  moduleId: number,
  lineCount: number,
  o: Omit<SourceOptions, 'allowed' | 'newKeys'>,
): string[] {
  const allowed = allowedKeys(moduleId)
  const { newKeys } = getModule(moduleId)
  const source = wordSource(rng, { ...o, allowed, newKeys })
  let words = wordStream(source, lineCount * LINE_LENGTH * 1.3)
  // Roughly how many words fit; the letter check only looks at those.
  const fitting = wrap(words, lineCount).join(' ').split(' ').length
  words = ensureLetters(rng, words, Math.max(1, fitting - 2), source)

  // Real sentences need a full stop; before that, finishLines capitalizes each line.
  let tokens = shiftAllowed(moduleId) && allowed.has('.') ? sentences(rng, words, allowed) : words
  if (newKeys.includes('-')) {
    // Few Danish words have a hyphen, so join a couple of word pairs instead.
    for (let n = 0; n < 2 && tokens.length > 3; n++) {
      const at = 1 + Math.floor(rng() * Math.min(tokens.length - 2, 6))
      if (/^[a-zæøå]+$/i.test(tokens[at]) && /^[a-zæøå]+$/.test(tokens[at + 1])) {
        tokens = [...tokens.slice(0, at), `${tokens[at]}-${tokens[at + 1]}`, ...tokens.slice(at + 2)]
      }
    }
  }
  const lines = finishLines(wrap(tokens, lineCount), moduleId, allowed)
  if (allowed.has('.') && shiftAllowed(moduleId)) {
    const last = lines.length - 1
    lines[last] = lines[last].replace(/[,.]?$/, '.')
  }
  return lines
}

const POOL_SIZE = [0, 15, 30, 60, 120, 250]
const NEW_SHARE = [0, 0.7, 0.6, 0.55, 0.5, 0.45]

/** Exercise text for module `moduleId`, exercise `index` (0-based). */
export function generateExercise(moduleId: number, index: number, seed: number): string[] {
  const rng = createRng(seed)
  const allowed = allowedKeys(moduleId)
  const { newKeys } = getModule(moduleId)
  const lineCount = LINES_PER_EXERCISE[index] ?? LINES_PER_EXERCISE[LINES_PER_EXERCISE.length - 1]

  if (index === 0) {
    const drills = drillTokens(newKeys, allowed, shiftAllowed(moduleId) && !!getModule(moduleId).introducesShift)
    // Repeat the drill set (lightly shuffled in pairs) until the lines are full.
    const tokens: string[] = []
    while (tokens.join(' ').length < lineCount * LINE_LENGTH) {
      const round = [...drills]
      for (let i = round.length - 1; i > 0; i--) {
        if (rng() < 0.3) [round[i], round[i - 1]] = [round[i - 1], round[i]]
      }
      tokens.push(...round)
    }
    return wrap(tokens, lineCount)
  }

  const last = index >= LINES_PER_EXERCISE.length - 1
  return textFromStream(rng, moduleId, lineCount, {
    poolSize: POOL_SIZE[Math.min(index, POOL_SIZE.length - 1)],
    newShare: NEW_SHARE[Math.min(index, NEW_SHARE.length - 1)],
    allowGibberish: !last,
  })
}

/** Module test: real words, every key learned so far, emphasis on the new ones. */
export function generateTest(moduleId: number, seed: number): string[] {
  // Different stream from the exercises, even with the same seed.
  return textFromStream(createRng(seed ^ 0x7e57), moduleId, LINES_PER_TEST, {
    poolSize: 300,
    newShare: 0.5,
    allowGibberish: false,
  })
}

/** Short drill on the learner's weakest keys, using only keys they know. */
export function generateWarmup(moduleId: number, weak: string[], seed: number): string[] {
  const rng = createRng(seed)
  const allowed = allowedKeys(moduleId)
  const keys = [...new Set(weak.map((c) => c.toLowerCase()))].filter((c) => allowed.has(c))
  if (keys.length === 0) return generateExercise(moduleId, 1, seed)
  const source = wordSource(rng, {
    allowed,
    newKeys: keys,
    poolSize: 200,
    newShare: 0.9,
    allowGibberish: true,
  })
  const tokens = [...drillTokens(keys, allowed, false), ...wordStream(source, LINE_LENGTH * 2)]
  return wrap(tokens, 3)
}
