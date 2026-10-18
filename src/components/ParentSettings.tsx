import { useState } from 'react'
import type { Thresholds } from '../config'
import { da } from '../i18n/da'
import type { Profile } from '../storage/profiles'

interface Props {
  profiles: Profile[]
  initialProfileId: string | null
  onSave: (id: string, settings: Thresholds) => void
  onReset: (id: string) => void
  onDelete: (id: string) => void
  onBack: () => void
}

export function ParentSettings({ profiles, initialProfileId, onSave, onReset, onDelete, onBack }: Props) {
  const [id, setId] = useState(initialProfileId ?? profiles[0]?.id ?? null)
  const profile = profiles.find((p) => p.id === id)

  return (
    <div className="parents">
      <header className="typing-header">
        <button className="link" onClick={onBack}>
          ← {da.back}
        </button>
        <h2>{da.parentsTitle}</h2>
        <span />
      </header>

      {profiles.length === 0 || !profile ? (
        <p>{da.noProfiles}</p>
      ) : (
        <>
          <label>
            {da.profile}
            <select value={profile.id} onChange={(e) => setId(e.target.value)}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar} {p.name}
                </option>
              ))}
            </select>
          </label>
          <ThresholdForm key={profile.id} profile={profile} onSave={(s) => onSave(profile.id, s)} />
          <div className="actions danger-zone">
            <button
              className="secondary"
              onClick={() => confirm(da.confirmReset(profile.name)) && onReset(profile.id)}
            >
              {da.resetProgress}
            </button>
            <button
              className="danger"
              onClick={() => confirm(da.confirmDelete(profile.name)) && onDelete(profile.id)}
            >
              {da.deleteProfile}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ThresholdForm({ profile, onSave }: { profile: Profile; onSave: (s: Thresholds) => void }) {
  const [accuracy, setAccuracy] = useState(Math.round(profile.settings.minAccuracy * 100))
  const [baseKpm, setBaseKpm] = useState(profile.settings.baseKpm)
  const [step, setStep] = useState(profile.settings.kpmStepPerModule)
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="settings-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ minAccuracy: accuracy / 100, baseKpm, kpmStepPerModule: step })
        setSaved(true)
      }}
      onChange={() => setSaved(false)}
    >
      <label>
        {da.minAccuracy}
        <input type="number" min={50} max={100} value={accuracy} onChange={(e) => setAccuracy(+e.target.value)} />
      </label>
      <label>
        {da.baseKpm}
        <input type="number" min={5} max={400} value={baseKpm} onChange={(e) => setBaseKpm(+e.target.value)} />
      </label>
      <label>
        {da.kpmStep}
        <input type="number" min={0} max={50} value={step} onChange={(e) => setStep(+e.target.value)} />
      </label>
      <div className="actions">
        <button type="submit">{da.save}</button>
        {saved && <span className="muted">{da.saved} ✓</span>}
      </div>
    </form>
  )
}
