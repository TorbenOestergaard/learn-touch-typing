import { useCallback, useEffect, useMemo, useState } from 'react'
import { Home } from './components/Home'
import { ModuleMap } from './components/ModuleMap'
import { ParentSettings } from './components/ParentSettings'
import { ProfilePicker } from './components/ProfilePicker'
import { Progress } from './components/Progress'
import { ResultScreen } from './components/ResultScreen'
import { StoryPicker, StoryResult } from './components/Stories'
import { TypingArea } from './components/TypingArea'
import { EXERCISES_PER_MODULE, STORY_LINE_LENGTH, requiredKpm } from './config'
import { MODULES, allowedKeys, getModule } from './content/da/modules'
import { STORIES, storyKey, storyPart, type StoryLength } from './content/da/stories'
import {
  commonWordsAfter,
  generateExercise,
  generateTest,
  generateWarmup,
  wrapText,
} from './content/generator'
import { starsFor, weakKeys, type SessionResult } from './engine/stats'
import { da } from './i18n/da'
import { newlyUnlocked, type Achievement } from './progress/achievements'
import {
  createProfile,
  exerciseKey,
  loadStore,
  logAttempt,
  nextExercise,
  recordAttempt,
  recordStory,
  resetProgress,
  saveStore,
  soundOn,
  speedUnitOf,
  testCounts,
  type ExerciseId,
  type ExerciseRecord,
  type Profile,
  type Store,
} from './storage/profiles'

type Screen =
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'progress' }
  | { name: 'parents' }
  | { name: 'stories'; storyId?: string; part?: StoryLength }
  | { name: 'story-typing'; storyId: string; part: StoryLength; seed: number }
  | {
      name: 'story-result'
      storyId: string
      part: StoryLength
      result: SessionResult
      points: number
      isRecord: boolean
      unlocked: Achievement[]
    }
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
      unlocked: Achievement[]
      /** False for a test passed before the module's exercises were done. */
      counted: boolean
    }

const newSeed = () => Math.floor(Math.random() * 2 ** 31)
const ALL_KEYS = allowedKeys(MODULES[MODULES.length - 1].id)

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
      ? { name: 'home' }
      : { name: 'profiles' },
  )

  useEffect(() => saveStore(store), [store])

  const profile = store.profiles.find((p) => p.id === store.activeProfileId)

  const updateProfile = useCallback((id: string, fn: (p: Profile) => Profile) => {
    setStore((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? fn(p) : p)) }))
  }, [])

  const start = (moduleId: number, ex: ExerciseId, warmupKeys?: string[]) =>
    setScreen({ name: 'typing', moduleId, ex, seed: newSeed(), warmupKeys })

  const toggleSound = () =>
    profile && updateProfile(profile.id, (p) => ({ ...p, prefs: { ...p.prefs, sound: !soundOn(p) } }))

  const typing = screen.name === 'typing' ? screen : null
  const storyTyping = screen.name === 'story-typing' ? screen : null
  const lines = useMemo(() => {
    if (storyTyping) {
      const story = STORIES.find((s) => s.id === storyTyping.storyId)!
      return wrapText(storyPart(story.text, storyTyping.part), STORY_LINE_LENGTH)
    }
    if (!typing) return []
    if (typing.warmupKeys) return generateWarmup(typing.moduleId, typing.warmupKeys, typing.seed)
    if (typing.ex === 'test') return generateTest(typing.moduleId, typing.seed)
    return generateExercise(typing.moduleId, typing.ex, typing.seed)
  }, [typing, storyTyping])

  const onStoryDone = useCallback(
    (result: SessionResult) => {
      if (!storyTyping || !profile) return
      const { storyId, part } = storyTyping
      const key = storyKey(storyId, part)
      const recorded = recordStory(profile, key, result)
      const updated = logAttempt(recorded.profile, result, { kind: 'story', storyKey: key, points: recorded.points })
      updateProfile(profile.id, () => updated)
      setScreen({
        name: 'story-result',
        storyId,
        part,
        result,
        points: recorded.points,
        isRecord: recorded.isRecord,
        unlocked: newlyUnlocked(profile, updated),
      })
    },
    [storyTyping, profile, updateProfile],
  )

  const onDone = useCallback(
    (result: SessionResult) => {
      if (!typing || !profile) return
      const { moduleId, ex, seed, warmupKeys } = typing
      const kpm = requiredKpm(profile.settings, moduleId)
      const previous = profile.progress[exerciseKey(moduleId, ex)]
      if (warmupKeys) {
        const updated = logAttempt(profile, result, { kind: 'warmup', moduleId })
        updateProfile(profile.id, () => updated)
        setScreen({
          name: 'result',
          moduleId,
          ex,
          seed,
          warmupKeys,
          result,
          stars: 0,
          previous,
          failsInRow: 0,
          unlocked: newlyUnlocked(profile, updated),
          counted: true,
        })
        return
      }
      const stars = starsFor(result, profile.settings.minAccuracy, kpm)
      const counted = ex !== 'test' || testCounts(profile, moduleId)
      const updated = logAttempt(recordAttempt(profile, moduleId, ex, result, stars, counted), result, {
        kind: ex === 'test' ? 'test' : 'exercise',
        moduleId,
        ex: ex === 'test' ? undefined : ex,
        stars,
      })
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
        unlocked: newlyUnlocked(profile, updated),
        counted,
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
            setScreen({ name: 'home' })
          }}
          onCreate={(name, avatar) => {
            const p = createProfile(name, avatar)
            setStore((s) => ({ ...s, profiles: [...s.profiles, p], activeProfileId: p.id }))
            setScreen({ name: 'home' })
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
          onSave={(id, settings, prefs) => updateProfile(id, (p) => ({ ...p, settings, prefs: { ...p.prefs, ...prefs } }))}
          onReset={(id) => updateProfile(id, resetProgress)}
          onDelete={(id) => {
            setStore((s) => ({
              ...s,
              profiles: s.profiles.filter((p) => p.id !== id),
              activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
            }))
            if (id === store.activeProfileId) setScreen({ name: 'profiles' })
          }}
          onBack={() => setScreen({ name: 'home' })}
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
          keyboardAvailable={screen.ex === 0 && !screen.warmupKeys}
          sound={soundOn(profile)}
          onToggleSound={toggleSound}
          onDone={onDone}
          onExit={() => setScreen({ name: 'map' })}
        />
      </main>
    )
  }

  if (screen.name === 'result') {
    const { moduleId, ex, warmupKeys } = screen
    // After a test that didn't count yet, carry on with the training instead of the locked next module.
    const next = screen.counted ? nextAfter(moduleId, ex) : nextExercise(profile)
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
          speedUnit={speedUnitOf(profile)}
          previous={screen.previous}
          failsInRow={screen.failsInRow}
          unlocked={screen.unlocked}
          counted={screen.counted}
          commonWords={ex === 'test' && screen.stars > 0 && screen.counted ? commonWordsAfter(moduleId) : undefined}
          hasNext={warmupKeys ? true : next !== null}
          onRetry={() => start(moduleId, ex, warmupKeys)}
          onNext={() => (warmupKeys ? start(moduleId, ex) : next && start(next.moduleId, next.ex))}
          onWarmup={() => start(moduleId, ex, weak)}
          onMap={() => setScreen({ name: 'map' })}
        />
      </main>
    )
  }

  if (screen.name === 'stories') {
    return (
      <main>
        <StoryPicker
          profiles={store.profiles}
          profile={profile}
          initial={screen.storyId && screen.part ? { storyId: screen.storyId, part: screen.part } : undefined}
          onStart={(storyId, part) => setScreen({ name: 'story-typing', storyId, part, seed: newSeed() })}
          onBack={() => setScreen({ name: 'home' })}
        />
      </main>
    )
  }

  if (screen.name === 'story-typing') {
    const story = STORIES.find((s) => s.id === screen.storyId)!
    return (
      <main>
        <TypingArea
          key={screen.seed}
          title={`${story.emoji} ${story.title}`}
          subtitle={`${story.genre} · ${da.lengths[screen.part]}`}
          lines={lines}
          known={ALL_KEYS}
          keyboardAvailable={false}
          sound={soundOn(profile)}
          onToggleSound={toggleSound}
          compact
          onDone={onStoryDone}
          onExit={() => setScreen({ name: 'stories', storyId: screen.storyId, part: screen.part })}
        />
      </main>
    )
  }

  if (screen.name === 'story-result') {
    const { storyId, part } = screen
    return (
      <main>
        <StoryResult
          profiles={store.profiles}
          profile={profile}
          storyId={storyId}
          part={part}
          result={screen.result}
          points={screen.points}
          isRecord={screen.isRecord}
          unlocked={screen.unlocked}
          onRetry={() => setScreen({ name: 'story-typing', storyId, part, seed: newSeed() })}
          onOther={() => setScreen({ name: 'stories', storyId, part })}
          onHome={() => setScreen({ name: 'home' })}
        />
      </main>
    )
  }

  if (screen.name === 'progress') {
    return (
      <main>
        <Progress
          profile={profile}
          onStartTest={(moduleId) => start(moduleId, 'test')}
          onBack={() => setScreen({ name: 'home' })}
        />
      </main>
    )
  }

  if (screen.name === 'map') {
    return (
      <main>
        <ModuleMap
          profile={profile}
          onStart={(moduleId, ex) => start(moduleId, ex)}
          onHome={() => setScreen({ name: 'home' })}
        />
      </main>
    )
  }

  return (
    <main>
      <Home
        profile={profile}
        onContinue={(moduleId, ex) => start(moduleId, ex)}
        onTraining={() => setScreen({ name: 'map' })}
        onProgress={() => setScreen({ name: 'progress' })}
        onStories={() => setScreen({ name: 'stories' })}
        onSwitchProfile={() => setScreen({ name: 'profiles' })}
        onParents={() => setScreen({ name: 'parents' })}
      />
    </main>
  )
}
