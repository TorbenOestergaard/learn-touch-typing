import { useCallback, useEffect, useMemo, useState } from 'react'
import { ModuleMap } from './components/ModuleMap'
import { ParentSettings } from './components/ParentSettings'
import { ProfilePicker } from './components/ProfilePicker'
import { ResultScreen } from './components/ResultScreen'
import { TypingArea } from './components/TypingArea'
import { EXERCISES_PER_MODULE, requiredKpm } from './config'
import { MODULES, allowedKeys, getModule } from './content/da/modules'
import { generateExercise, generateTest, generateWarmup } from './content/generator'
import { starsFor, weakKeys, type SessionResult } from './engine/stats'
import { da } from './i18n/da'
import {
  createProfile,
  exerciseKey,
  loadStore,
  recordAttempt,
  saveStore,
  type ExerciseId,
  type ExerciseRecord,
  type Profile,
  type Store,
} from './storage/profiles'

type Screen =
  | { name: 'profiles' }
  | { name: 'map' }
  | { name: 'parents' }
  | { name: 'typing'; moduleId: number; ex: ExerciseId; seed: number; warmupKeys?: string[] }
  | {
      name: 'result'
      moduleId: number
      ex: ExerciseId
      seed: number
      warmupKeys?: string[]
      result: SessionResult
      stars: number
      previous?: ExerciseRecord
      failsInRow: number
    }

const newSeed = () => Math.floor(Math.random() * 2 ** 31)

function nextAfter(moduleId: number, ex: ExerciseId): { moduleId: number; ex: ExerciseId } | null {
  if (ex === 'test') {
    const idx = MODULES.findIndex((m) => m.id === moduleId)
    return idx + 1 < MODULES.length ? { moduleId: MODULES[idx + 1].id, ex: 0 } : null
  }
  return ex + 1 < EXERCISES_PER_MODULE ? { moduleId, ex: ex + 1 } : { moduleId, ex: 'test' }
}

export default function App() {
  const [store, setStore] = useState<Store>(() => loadStore())
  const [screen, setScreen] = useState<Screen>(() =>
    store.activeProfileId && store.profiles.some((p) => p.id === store.activeProfileId)
      ? { name: 'map' }
      : { name: 'profiles' },
  )

  useEffect(() => saveStore(store), [store])

  const profile = store.profiles.find((p) => p.id === store.activeProfileId)

  const updateProfile = useCallback((id: string, fn: (p: Profile) => Profile) => {
    setStore((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? fn(p) : p)) }))
  }, [])

  const start = (moduleId: number, ex: ExerciseId, warmupKeys?: string[]) =>
    setScreen({ name: 'typing', moduleId, ex, seed: newSeed(), warmupKeys })

  const typing = screen.name === 'typing' ? screen : null
  const lines = useMemo(() => {
    if (!typing) return []
    if (typing.warmupKeys) return generateWarmup(typing.moduleId, typing.warmupKeys, typing.seed)
    if (typing.ex === 'test') return generateTest(typing.moduleId, typing.seed)
    return generateExercise(typing.moduleId, typing.ex, typing.seed)
  }, [typing])

  const onDone = useCallback(
    (result: SessionResult) => {
      if (!typing || !profile) return
      const { moduleId, ex, seed, warmupKeys } = typing
      const kpm = requiredKpm(profile.settings, moduleId)
      const previous = profile.progress[exerciseKey(moduleId, ex)]
      if (warmupKeys) {
        setScreen({ name: 'result', moduleId, ex, seed, warmupKeys, result, stars: 0, previous, failsInRow: 0 })
        return
      }
      const stars = starsFor(result, profile.settings.minAccuracy, kpm)
      const updated = recordAttempt(profile, moduleId, ex, result, stars)
      updateProfile(profile.id, () => updated)
      setScreen({
        name: 'result',
        moduleId,
        ex,
        seed,
        result,
        stars,
        previous,
        failsInRow: updated.progress[exerciseKey(moduleId, ex)].failsInRow,
      })
    },
    [typing, profile, updateProfile],
  )

  if (screen.name === 'profiles' || !profile) {
    return (
      <main>
        <ProfilePicker
          profiles={store.profiles}
          onSelect={(id) => {
            setStore((s) => ({ ...s, activeProfileId: id }))
            setScreen({ name: 'map' })
          }}
          onCreate={(name, avatar) => {
            const p = createProfile(name, avatar)
            setStore((s) => ({ ...s, profiles: [...s.profiles, p], activeProfileId: p.id }))
            setScreen({ name: 'map' })
          }}
        />
      </main>
    )
  }

  if (screen.name === 'parents') {
    return (
      <main>
        <ParentSettings
          profiles={store.profiles}
          initialProfileId={store.activeProfileId}
          onSave={(id, settings) => updateProfile(id, (p) => ({ ...p, settings }))}
          onReset={(id) => updateProfile(id, (p) => ({ ...p, progress: {}, keyErrors: {} }))}
          onDelete={(id) => {
            setStore((s) => ({
              ...s,
              profiles: s.profiles.filter((p) => p.id !== id),
              activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
            }))
            if (id === store.activeProfileId) setScreen({ name: 'profiles' })
          }}
          onBack={() => setScreen({ name: 'map' })}
        />
      </main>
    )
  }

  if (screen.name === 'typing') {
    const m = getModule(screen.moduleId)
    const title = screen.warmupKeys
      ? da.warmup
      : screen.ex === 'test'
        ? da.moduleTest(m.id)
        : `${da.module(m.id)} · ${da.exercise(screen.ex + 1)}`
    const subtitle = screen.warmupKeys
      ? screen.warmupKeys.map((k) => (k === ' ' ? da.space : k)).join(' ')
      : `${da.newKeys}: ${m.newKeys.join(' ')}${m.introducesShift ? ' ⇧' : ''}`
    return (
      <main>
        <TypingArea
          key={screen.seed}
          title={title}
          subtitle={subtitle}
          lines={lines}
          known={allowedKeys(m.id)}
          keyboardByDefault={screen.ex !== 'test'}
          onDone={onDone}
          onExit={() => setScreen({ name: 'map' })}
        />
      </main>
    )
  }

  if (screen.name === 'result') {
    const { moduleId, ex, warmupKeys } = screen
    const next = nextAfter(moduleId, ex)
    const weak = [
      ...new Set([
        ...weakKeys(screen.result.errorsByChar, 3),
        ...weakKeys(profile.keyErrors, 3),
      ]),
    ].slice(0, 3)
    return (
      <main>
        <ResultScreen
          result={screen.result}
          stars={screen.stars}
          isWarmup={!!warmupKeys}
          isTest={ex === 'test'}
          moduleId={moduleId}
          requiredKpm={requiredKpm(profile.settings, moduleId)}
          minAccuracy={profile.settings.minAccuracy}
          previous={screen.previous}
          failsInRow={screen.failsInRow}
          hasNext={warmupKeys ? true : next !== null}
          onRetry={() => start(moduleId, ex, warmupKeys)}
          onNext={() => (warmupKeys ? start(moduleId, ex) : next && start(next.moduleId, next.ex))}
          onWarmup={() => start(moduleId, ex, weak)}
          onMap={() => setScreen({ name: 'map' })}
        />
      </main>
    )
  }

  return (
    <main>
      <ModuleMap
        profile={profile}
        onStart={(moduleId, ex) => start(moduleId, ex)}
        onSwitchProfile={() => setScreen({ name: 'profiles' })}
        onParents={() => setScreen({ name: 'parents' })}
      />
    </main>
  )
}
