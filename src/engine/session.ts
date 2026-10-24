// Pure typing-session state. The UI feeds key presses in; nothing here touches the DOM.

/**
 * 'strict' (training): a wrong key doesn't move the cursor and Backspace does nothing.
 * 'real' (Rigtig skrivning, Lyntaster only): every key is written and wrong characters are fixed with Backspace.
 */
export type TypingMode = 'strict' | 'real'

export interface SessionState {
  mode: TypingMode
  lines: string[]
  /** What was typed on each line, wrong characters included. Only used in 'real' mode. */
  typed: string[]
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

export function createSession(lines: string[], mode: TypingMode = 'strict'): SessionState {
  if (lines.length === 0 || lines.some((l) => l.length === 0)) {
    throw new Error('Session needs non-empty lines')
  }
  return {
    mode,
    lines,
    typed: lines.map(() => ''),
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

/** Positions on a line that were typed wrong and not yet fixed. */
export function wrongPositions(s: SessionState, line: number): number[] {
  const out: number[] = []
  const typed = s.typed[line]
  for (let i = 0; i < typed.length; i++) if (typed[i] !== s.lines[line][i]) out.push(i)
  return out
}

/** Wrong characters left in the text. Always 0 in 'strict' mode. */
export function uncorrectedErrors(s: SessionState): number {
  return s.lines.reduce((n, _, i) => n + wrongPositions(s, i).length, 0)
}

/**
 * Applies one key press. `key` is KeyboardEvent.key; anything that is not a single
 * character (Shift, Dead, Backspace, ...) is ignored, except Backspace in 'real' mode.
 */
export function pressKey(s: SessionState, key: string, now: number): SessionState {
  if (s.finishedAt !== null) return s
  if (s.mode === 'real') return pressKeyReal(s, key, now)
  if ([...key].length !== 1) return s

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

/**
 * 'real' mode: wrong characters are written too. A line moves on once it is fully typed, errors or not;
 * Backspace only works within the current line. `correct` counts the correct characters in the text as it
 * stands, so deleting a correct character takes it back off.
 */
function pressKeyReal(s: SessionState, key: string, now: number): SessionState {
  const line = s.lines[s.line]
  const typed = s.typed[s.line]

  if (key === 'Backspace') {
    if (typed.length === 0) return s
    const removed = typed.length - 1
    const wasCorrect = typed[removed] === line[removed]
    return {
      ...s,
      typed: s.typed.map((t, i) => (i === s.line ? t.slice(0, -1) : t)),
      col: removed,
      correct: s.correct - (wasCorrect ? 1 : 0),
    }
  }
  if ([...key].length !== 1) return s

  const expected = line[s.col]
  const startedAt = s.startedAt ?? now
  const ok = key === expected
  let next: SessionState = {
    ...s,
    startedAt,
    typed: s.typed.map((t, i) => (i === s.line ? t + key : t)),
    col: s.col + 1,
    correct: s.correct + (ok ? 1 : 0),
  }
  if (!ok) {
    next = {
      ...next,
      errors: s.errors + 1,
      errorsByChar: { ...s.errorsByChar, [expected]: (s.errorsByChar[expected] ?? 0) + 1 },
      errorTick: s.errorTick + 1,
      wrongLayout: s.wrongLayout || US_EQUIVALENT[expected] === key,
    }
  }
  if (next.col >= line.length) {
    if (s.line + 1 < s.lines.length) next = { ...next, line: s.line + 1, col: 0 }
    else next = { ...next, finishedAt: now }
  }
  return next
}
