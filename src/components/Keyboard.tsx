import { da } from '../i18n/da'
import { ROWS, keyFor, shiftFor, type KeyDef } from '../layouts/da'

interface Props {
  /** The character to type next, or null. */
  next: string | null
  /** Keys the learner knows; others are dimmed. */
  known: Set<string>
}

export function Keyboard({ next, known }: Props) {
  const nextKey = next ? keyFor(next) : undefined
  const shift = next ? shiftFor(next) : null

  const isKnown = (key: KeyDef) =>
    key.char === ' ' || known.has(key.char) || (key.char.startsWith('Shift') && known.has('a'))

  return (
    <div className="keyboard-wrap" aria-hidden="true">
      <div className="keyboard">
        {ROWS.map((row, r) => (
          <div className={`kb-row kb-row-${r}`} key={r}>
            {row.map((key) => {
              const active = key === nextKey || key.char === shift
              const cls = [
                'key',
                `finger-${key.finger}`,
                active ? 'active' : '',
                isKnown(key) ? '' : 'unknown',
                key.homeBump ? 'bump' : '',
              ].join(' ')
              return (
                <div className={cls} key={key.char} style={{ flexGrow: key.width ?? 1 }}>
                  {key.label ?? key.char.toUpperCase()}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <p className="finger-hint">
        {nextKey ? (
          <>
            {da.useFinger(da.fingers[nextKey.finger])}
            {nextKey.char === ' ' ? ` (${da.space})` : ''}
            {shift ? ` ${da.withShift(da.fingers[keyFor(shift)!.finger])}` : ''}
          </>
        ) : (
          ' '
        )}
      </p>
    </div>
  )
}
