import { useCallback, useEffect, useRef, useState } from 'react'
import { createSession, expectedChar, isFinished, pressKey, type SessionState } from '../engine/session'
import { computeResult, type SessionResult } from '../engine/stats'
import { da } from '../i18n/da'
import { Keyboard } from './Keyboard'

interface Props {
  title: string
  subtitle?: string
  lines: string[]
  known: Set<string>
  keyboardByDefault: boolean
  onDone: (result: SessionResult) => void
  onExit: () => void
}

export function TypingArea({ title, subtitle, lines, known, keyboardByDefault, onDone, onExit }: Props) {
  const [session, setSession] = useState<SessionState>(() => createSession(lines))
  const [showKeyboard, setShowKeyboard] = useState(keyboardByDefault)
  const doneRef = useRef(false)

  const restart = useCallback(() => {
    doneRef.current = false
    setSession(createSession(lines))
  }, [lines])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey && e.key.length !== 1) return
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
          ← {da.toMap}
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

      <div className="exercise" role="application" aria-label={title}>
        {session.lines.map((line, i) => {
          const typed = i < session.line ? line.length : i === session.line ? session.col : 0
          const isCurrent = i === session.line && !isFinished(session)
          return (
            <div className={`ex-line ${i < session.line ? 'done' : ''}`} key={i}>
              <div className="ex-text">
                {[...line].map((ch, j) => {
                  const cur = isCurrent && j === session.col
                  return (
                    <span
                      // Changing the key on each error restarts the flash animation.
                      key={cur ? `c${session.errorTick}` : j}
                      className={[
                        j < typed ? 'typed' : '',
                        cur ? 'current' : '',
                        cur && session.errorTick > 0 ? 'flash' : '',
                      ].join(' ')}
                    >
                      {ch}
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

      {showKeyboard && <Keyboard next={next} known={known} />}

      <footer className="typing-footer">
        <span className="muted">{da.restartHint}</span>
        <button
          className="link"
          onClick={(e) => {
            e.currentTarget.blur()
            setShowKeyboard((v) => !v)
          }}
        >
          {showKeyboard ? da.hideKeyboard : da.showKeyboard}
        </button>
      </footer>
    </div>
  )
}
