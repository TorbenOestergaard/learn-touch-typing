import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSession, expectedChar, isFinished, pressKey, type SessionState } from '../engine/session'
import { computeResult, type SessionResult } from '../engine/stats'
import { da } from '../i18n/da'
import { errorBeep } from '../sound'
import { Keyboard } from './Keyboard'

interface Props {
  title: string
  subtitle?: string
  lines: string[]
  known: Set<string>
  /** Show the on-screen keyboard (with a hide option). Off means no keyboard at all. */
  keyboardAvailable: boolean
  sound: boolean
  onToggleSound: () => void
  /** Smaller text and auto-scroll, for long texts like stories. */
  compact?: boolean
  onDone: (result: SessionResult) => void
  onExit: () => void
}

export function TypingArea({
  title,
  subtitle,
  lines,
  known,
  keyboardAvailable,
  sound,
  onToggleSound,
  compact = false,
  onDone,
  onExit,
}: Props) {
  // Every line but the last ends with a space, like the end of a word in running text.
  const padded = useMemo(() => lines.map((l, i) => (i < lines.length - 1 ? `${l} ` : l)), [lines])
  const [session, setSession] = useState<SessionState>(() => createSession(padded))
  const [showKeyboard, setShowKeyboard] = useState(true)
  const doneRef = useRef(false)
  const currentLineRef = useRef<HTMLDivElement>(null)

  const restart = useCallback(() => {
    doneRef.current = false
    setSession(createSession(padded))
  }, [padded])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || (e.altKey && e.key.length !== 1)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        restart()
        return
      }
      // Keep space from scrolling and keys from triggering buttons or quick-find.
      if (e.key.length === 1) e.preventDefault()
      if (e.repeat) return
      setSession((s) => pressKey(s, e.key, performance.now()))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [restart])

  useEffect(() => {
    if (sound && session.errorTick > 0) errorBeep()
  }, [session.errorTick, sound])

  useEffect(() => {
    if (compact) currentLineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [compact, session.line])

  useEffect(() => {
    if (isFinished(session) && !doneRef.current) {
      doneRef.current = true
      onDone(computeResult(session))
    }
  }, [session, onDone])

  const next = expectedChar(session)

  return (
    <div className="typing-screen">
      <header className="typing-header">
        <button className="link" onClick={onExit}>
          ← {da.back}
        </button>
        <div className="typing-title">
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <button
          className="secondary"
          onClick={(e) => {
            e.currentTarget.blur()
            restart()
          }}
        >
          ↺ {da.restart}
        </button>
      </header>

      {session.wrongLayout && <p className="banner warn">{da.wrongLayout}</p>}

      <div className={`exercise ${compact ? 'compact' : ''}`} role="application" aria-label={title}>
        {session.lines.map((line, i) => {
          const typed = i < session.line ? line.length : i === session.line ? session.col : 0
          const isCurrent = i === session.line && !isFinished(session)
          return (
            <div
              className={`ex-line ${i < session.line ? 'done' : ''}`}
              key={i}
              ref={i === session.line ? currentLineRef : undefined}
            >
              <div className="ex-text">
                {[...line].map((ch, j) => {
                  const cur = isCurrent && j === session.col
                  const eol = ch === ' ' && j === line.length - 1
                  return (
                    <span
                      // Changing the key on each error restarts the flash animation.
                      key={cur ? `c${session.errorTick}` : j}
                      className={[
                        j < typed ? 'typed' : '',
                        cur ? 'current' : '',
                        cur && session.errorTick > 0 ? 'flash' : '',
                        eol ? 'eol' : '',
                      ].join(' ')}
                    >
                      {eol ? '␣' : ch}
                    </span>
                  )
                })}
              </div>
              <div className="ex-input">
                {line.slice(0, typed)}
                {isCurrent && <span className="cursor">_</span>}
              </div>
            </div>
          )
        })}
      </div>

      {session.startedAt === null && <p className="muted center">{da.startHint}</p>}

      {keyboardAvailable && showKeyboard && <Keyboard next={next} known={known} />}

      <footer className="typing-footer">
        <span className="muted">{da.restartHint}</span>
        <span className="footer-buttons">
          <button
            className="link"
            onClick={(e) => {
              e.currentTarget.blur()
              onToggleSound()
            }}
          >
            {sound ? da.soundOn : da.soundOff}
          </button>
          {keyboardAvailable && (
            <button
              className="link"
              onClick={(e) => {
                e.currentTarget.blur()
                setShowKeyboard((v) => !v)
              }}
            >
              {showKeyboard ? da.hideKeyboard : da.showKeyboard}
            </button>
          )}
        </span>
      </footer>
    </div>
  )
}
