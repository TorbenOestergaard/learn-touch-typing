// Danish keyboard layout (as on a Mac/PC Danish keyboard) with the touch-typing finger for each key.

export type Finger =
  | 'lp' | 'lr' | 'lm' | 'li' // left pinky, ring, middle, index
  | 'ri' | 'rm' | 'rr' | 'rp' // right index, middle, ring, pinky
  | 'th' // thumb

export interface KeyDef {
  /** Character produced without Shift. */
  char: string
  /** Character produced with Shift (letters: uppercase). */
  shifted?: string
  label?: string
  finger: Finger
  /** Width in key units, default 1. */
  width?: number
  /** Raised bump on the key (F and J). */
  homeBump?: boolean
}

const k = (char: string, finger: Finger, extra: Partial<KeyDef> = {}): KeyDef => ({
  char,
  shifted: char.toUpperCase() !== char ? char.toUpperCase() : undefined,
  finger,
  ...extra,
})

export const SHIFT_LEFT = 'ShiftLeft'
export const SHIFT_RIGHT = 'ShiftRight'

export const ROWS: KeyDef[][] = [
  [
    k('1', 'lp'), k('2', 'lr'), k('3', 'lm'), k('4', 'li'), k('5', 'li'),
    k('6', 'ri'), k('7', 'ri'), k('8', 'rm'), k('9', 'rr'), k('0', 'rp'), k('+', 'rp'),
  ],
  [
    k('q', 'lp'), k('w', 'lr'), k('e', 'lm'), k('r', 'li'), k('t', 'li'),
    k('y', 'ri'), k('u', 'ri'), k('i', 'rm'), k('o', 'rr'), k('p', 'rp'), k('å', 'rp'),
  ],
  [
    k('a', 'lp'), k('s', 'lr'), k('d', 'lm'), k('f', 'li', { homeBump: true }), k('g', 'li'),
    k('h', 'ri'), k('j', 'ri', { homeBump: true }), k('k', 'rm'), k('l', 'rr'), k('æ', 'rp'), k('ø', 'rp'),
  ],
  [
    { char: SHIFT_LEFT, label: '⇧', finger: 'lp', width: 1.5 },
    k('z', 'lp'), k('x', 'lr'), k('c', 'lm'), k('v', 'li'), k('b', 'li'),
    k('n', 'ri'), k('m', 'ri'), k(',', 'rm', { shifted: ';' }), k('.', 'rr', { shifted: ':' }), k('-', 'rp', { shifted: '_' }),
    { char: SHIFT_RIGHT, label: '⇧', finger: 'rp', width: 1.5 },
  ],
  [{ char: ' ', label: '', finger: 'th', width: 6 }],
]

const byChar = new Map<string, KeyDef>()
for (const row of ROWS) {
  for (const key of row) {
    byChar.set(key.char, key)
    if (key.shifted) byChar.set(key.shifted, key)
  }
}

export function keyFor(char: string): KeyDef | undefined {
  return byChar.get(char)
}

export function isLeftHand(f: Finger): boolean {
  return f.startsWith('l')
}

/** The Shift key to use for a character: the one on the opposite hand. */
export function shiftFor(char: string): string | null {
  const key = byChar.get(char)
  if (!key || key.shifted !== char || key.char === char) return null
  return isLeftHand(key.finger) ? SHIFT_RIGHT : SHIFT_LEFT
}
