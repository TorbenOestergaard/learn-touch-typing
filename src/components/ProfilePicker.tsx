import { useState } from 'react'
import { da } from '../i18n/da'
import type { Profile } from '../storage/profiles'

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐙', '🦄', '🐢', '🐧', '🚀', '⚽', '🎸', '🌟']

interface Props {
  profiles: Profile[]
  onSelect: (id: string) => void
  onCreate: (name: string, avatar: string) => void
}

export function ProfilePicker({ profiles, onSelect, onCreate }: Props) {
  const [creating, setCreating] = useState(profiles.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  return (
    <div className="profiles">
      <h1>{da.appTitle}</h1>
      {!creating ? (
        <>
          <h2>{da.whoAreYou}</h2>
          <div className="profile-list">
            {profiles.map((p) => (
              <button key={p.id} className="profile-card" onClick={() => onSelect(p.id)}>
                <span className="avatar">{p.avatar}</span>
                <span>{p.name}</span>
              </button>
            ))}
            <button className="profile-card add" onClick={() => setCreating(true)}>
              <span className="avatar">＋</span>
              <span>{da.newProfile}</span>
            </button>
          </div>
        </>
      ) : (
        <form
          className="new-profile"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onCreate(name, avatar)
          }}
        >
          <h2>{da.newProfile}</h2>
          <label>
            {da.name}
            <input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          </label>
          <fieldset>
            <legend>{da.pickAvatar}</legend>
            <div className="avatar-grid">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={`avatar-choice ${a === avatar ? 'selected' : ''}`}
                  onClick={() => setAvatar(a)}
                  aria-pressed={a === avatar}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="actions">
            {profiles.length > 0 && (
              <button type="button" className="secondary" onClick={() => setCreating(false)}>
                {da.cancel}
              </button>
            )}
            <button type="submit" disabled={!name.trim()}>
              {da.create}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
