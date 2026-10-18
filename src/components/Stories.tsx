import { useState } from 'react'
import { STORIES, storyKey, storyPart, type StoryLength } from '../content/da/stories'
import { difficulty, lix } from '../content/lix'
import type { SessionResult } from '../engine/stats'
import { formatSpeed, pct, speedUnitLabel, type SpeedUnit } from '../format'
import { da } from '../i18n/da'
import type { Achievement } from '../progress/achievements'
import { leaderboard, speedUnitOf, type Profile } from '../storage/profiles'
import { NewAchievements } from './Achievements'

const LENGTHS: StoryLength[] = [1, 2, 3]
const MEDALS = ['🥇', '🥈', '🥉']

function Leaderboard({ profiles, storyId, part, viewer }: {
  profiles: Profile[]
  storyId: string
  part: StoryLength
  /** The profile looking at the list: highlighted, and its speed unit is used. */
  viewer: Profile
}) {
  const unit: SpeedUnit = speedUnitOf(viewer)
  const entries = leaderboard(profiles, storyKey(storyId, part)).slice(0, 5)
  return (
    <div className="leaderboard">
      <h3>{da.leaderboard}</h3>
      {entries.length === 0 ? (
        <p className="muted">{da.noScores}</p>
      ) : (
        <ol>
          {entries.map(({ profile, record }, i) => (
            <li key={profile.id} className={profile.id === viewer.id ? 'me' : ''}>
              <span className="lb-rank">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="lb-name">
                {profile.avatar} {profile.name}
              </span>
              <span className="lb-points">
                {record.points} {da.points}
              </span>
              <span className="muted lb-detail">
                {formatSpeed(record.kpm, unit)} · {pct(record.accuracy)}
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
          ← {da.toHome}
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

      <Leaderboard profiles={profiles} storyId={storyId} part={part} viewer={profile} />
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
  unlocked: Achievement[]
  onRetry: () => void
  onOther: () => void
  onHome: () => void
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
      <NewAchievements items={p.unlocked} />
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">{da.speed}</div>
          <div className="stat-value">{formatSpeed(p.result.kpm, speedUnitOf(p.profile))}</div>
          <div className="stat-unit">{speedUnitLabel(speedUnitOf(p.profile))}</div>
        </div>
        <div className="stat">
          <div className="stat-label">{da.accuracy}</div>
          <div className="stat-value">{pct(p.result.accuracy)}</div>
          <div className="stat-unit">&nbsp;</div>
        </div>
      </div>
      <Leaderboard profiles={p.profiles} storyId={p.storyId} part={p.part} viewer={p.profile} />
      <div className="actions">
        <button className="secondary" onClick={p.onRetry}>
          ↺ {da.tryAgain}
        </button>
        <button onClick={p.onOther}>{da.otherStory}</button>
        <button className="link" onClick={p.onHome}>
          {da.toHome}
        </button>
      </div>
    </div>
  )
}
