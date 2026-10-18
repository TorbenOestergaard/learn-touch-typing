// Pure typing-session state. The UI feeds key presses in; nothing here touches the DOM.

export interface SessionState {
  lines: string[]
  line: number
  col: number
  correct: number
  errors: number
  /** Errors per expected character (what the user should have typed). */
  errorsByChar: Record<string, number>
  startedAt: number | null
  finishedAt: number | null
  /** Incremented on every wrong key so the UI can trigger a flash. */
  errorTick: number
  /** Set when key presses suggest a non-Danish keyboard layout is active. */
  wrongLayout: boolean
}

// What a US layout produces on the physical keys where Danish has these characters.
const US_EQUIVALENT: Record<string, string> = {
  'æ': ';',
  'ø': "'",
  'å': '[',
  'Æ': ':',
  'Ø': '"',
  'Å': '{',
  '-': '/',
}

export function createSession(lines: string[]): SessionState {
  if (lines.length === 0 || lines.some((l) => l.length === 0)) {
    throw new Error('Session needs non-empty lines')
  }
  return {
    lines,
    line: 0,
    col: 0,
    correct: 0,
    errors: 0,
    errorsByChar: {},
    startedAt: null,
    finishedAt: null,
    errorTick: 0,
    wrongLayout: false,
  }
}

export function expectedChar(s: SessionState): string | null {
  if (s.finishedAt !== null) return null
  return s.lines[s.line][s.col]
}

export function isFinished(s: SessionState): boolean {
  return s.finishedAt !== null
}

/**
 * Applies one key press. `key` is KeyboardEvent.key; anything that is not a single
 * character (Shift, Dead, Backspace, ...) is ignored.
 */
export function pressKey(s: SessionState, key: string, now: number): SessionState {
  if (s.finishedAt !== null || [...key].length !== 1) return s

  const expected = s.lines[s.line][s.col]
  const startedAt = s.startedAt ?? now

  if (key !== expected) {
    return {
      ...s,
      startedAt,
      errors: s.errors + 1,
      errorsByChar: { ...s.errorsByChar, [expected]: (s.errorsByChar[expected] ?? 0) + 1 },
      errorTick: s.errorTick + 1,
      wrongLayout: s.wrongLayout || US_EQUIVALENT[expected] === key,
    }
  }

  let line = s.line
  let col = s.col + 1
  let finishedAt: number | null = null
  if (col >= s.lines[line].length) {
    if (line + 1 < s.lines.length) {
      line += 1
      col = 0
    } else {
      finishedAt = now
    }
  }
  return { ...s, startedAt, line, col, finishedAt, correct: s.correct + 1 }
}
