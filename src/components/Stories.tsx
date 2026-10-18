import { useState } from 'react'
import { STORIES, storyKey, storyPart, type StoryLength } from '../content/da/stories'
import { difficulty, lix } from '../content/lix'
import type { SessionResult } from '../engine/stats'
import { da } from '../i18n/da'
import { leaderboard, type Profile } from '../storage/profiles'

const LENGTHS: StoryLength[] = [1, 2, 3]
const MEDALS = ['🥇', '🥈', '🥉']
const pct = (v: number) => `${Math.floor(v * 100)} %`

function Leaderboard({ profiles, storyId, part, highlight }: {
  profiles: Profile[]
  storyId: string
  part: StoryLength
  highlight?: string
}) {
  const entries = leaderboard(profiles, storyKey(storyId, part)).slice(0, 5)
  return (
    <div className="leaderboard">
      <h3>{da.leaderboard}</h3>
      {entries.length === 0 ? (
        <p className="muted">{da.noScores}</p>
      ) : (
        <ol>
          {entries.map(({ profile, record }, i) => (
            <li key={profile.id} className={profile.id === highlight ? 'me' : ''}>
              <span className="lb-rank">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="lb-name">
                {profile.avatar} {profile.name}
              </span>
              <span className="lb-points">
                {record.points} {da.points}
              </span>
              <span className="muted lb-detail">
                {record.kpm} · {pct(record.accuracy)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

interface PickerProps {
  profiles: Profile[]
  profile: Profile
  initial?: { storyId: string; part: StoryLength }
  onStart: (storyId: string, part: StoryLength) => void
  onBack: () => void
}

export function StoryPicker({ profiles, profile, initial, onStart, onBack }: PickerProps) {
  const [storyId, setStoryId] = useState(initial?.storyId ?? STORIES[0].id)
  const [part, setPart] = useState<StoryLength>(initial?.part ?? 1)

  return (
    <div className="stories">
      <header className="typing-header">
        <button className="link" onClick={onBack}>
          ← {da.toMap}
        </button>
        <h2>{da.stories}</h2>
        <span />
      </header>
      <p>{da.storiesIntro}</p>

      <div className="story-cards">
        {STORIES.map((s) => {
          const l = lix(s.text)
          const level = difficulty(l)
          const words = storyPart(s.text, part).split(/\s+/).length
          return (
            <button
              key={s.id}
              className={`story-card ${s.id === storyId ? 'selected' : ''}`}
              aria-pressed={s.id === storyId}
              onClick={() => setStoryId(s.id)}
            >
              <span className="story-emoji">{s.emoji}</span>
              <strong>{s.title}</strong>
              <span className="muted">{s.genre}</span>
              <span className={`level level-${level}`}>
                {da.difficulty[level]} · {da.lixLabel(l)}
              </span>
              <span className="muted">{da.words(words)}</span>
            </button>
          )
        })}
      </div>

      <div className="length-picker" role="radiogroup" aria-label={da.length}>
        <span className="muted">{da.length}:</span>
        {LENGTHS.map((p) => (
          <button
            key={p}
            role="radio"
            aria-checked={p === part}
            className={p === part ? '' : 'secondary'}
            onClick={() => setPart(p)}
          >
            {da.lengths[p]}
          </button>
        ))}
      </div>

      <button className="big" onClick={() => onStart(storyId, part)}>
        {da.start} →
      </button>

      <Leaderboard profiles={profiles} storyId={storyId} part={part} highlight={profile.id} />
      <p className="muted small">{da.storiesHint}</p>
      <p className="muted small">{da.pointsExplained}</p>
    </div>
  )
}

interface ResultProps {
  profiles: Profile[]
  profile: Profile
  storyId: string
  part: StoryLength
  result: SessionResult
  points: number
  isRecord: boolean
  onRetry: () => void
  onOther: () => void
  onMap: () => void
}

export function StoryResult(p: ResultProps) {
  const story = STORIES.find((s) => s.id === p.storyId)!
  const ranking = leaderboard(p.profiles, storyKey(p.storyId, p.part))
  const rank = ranking.findIndex((e) => e.profile.id === p.profile.id) + 1
  const best = p.profile.storyBest?.[storyKey(p.storyId, p.part)]

  return (
    <div className="result">
      <h2>
        {story.emoji} {story.title}
      </h2>
      <p className="muted">{da.lengths[p.part]}</p>
      <div className="points">
        <div className="stat-label">{da.yourScore}</div>
        <div className="points-value">{p.points}</div>
        {p.isRecord ? (
          <div className="badge">{da.newPersonalBest}</div>
        ) : (
          best && <div className="muted">{da.yourBest(best.points)}</div>
        )}
        {rank > 0 && <div className="rank">{da.rank(rank)}</div>}
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">{da.speed}</div>
          <div className="stat-value">{p.result.kpm}</div>
          <div className="stat-unit">{da.speedUnit}</div>
        </div>
        <div className="stat">
          <div className="stat-label">{da.accuracy}</div>
          <div className="stat-value">{pct(p.result.accuracy)}</div>
          <div className="stat-unit">&nbsp;</div>
        </div>
      </div>
      <Leaderboard profiles={p.profiles} storyId={p.storyId} part={p.part} highlight={p.profile.id} />
      <div className="actions">
        <button className="secondary" onClick={p.onRetry}>
          ↺ {da.tryAgain}
        </button>
        <button onClick={p.onOther}>{da.otherStory}</button>
        <button className="link" onClick={p.onMap}>
          {da.toMap}
        </button>
      </div>
    </div>
  )
}
