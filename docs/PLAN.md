# Plan: Touch-typing web app (Danish first)

## Context
A web app that teaches touch typing (10-finger typing), first for the user's kids (10 and 7), but usable by anyone. The learning path is module-based: each module adds a few keys, has 6 exercises and ends with a test. Danish keyboard, Danish UI and Danish text by default, with the structure ready for other languages later. The folder `learn-touch-typing` is empty and not yet a git repo. Node and `gh` are not installed, but Homebrew is.

Decisions made:
- **Stack:** Vite + React + TypeScript, tested with Vitest.
- **Hosting:** a public GitHub repo, deployed to GitHub Pages by GitHub Actions.
- **Key order:** the revised order below.
- **Profiles:** simple local profiles in the first version.

## Learning path (revised key order)
| # | New keys | Note |
|---|---|---|
| 1 | f j d k + e r u i | Anchor on the F/J bumps. Gives real words: der, fik, ikke, red, due |
| 2 | s l + w o | Ring fingers |
| 3 | g h + t y | Index-finger reaches. t and g are very frequent in Danish |
| 4 | a æ ø + **Shift** | Home-row pinkies. **Capital letters start here**, because Shift is pressed with the opposite pinky |
| 5 | n m v b c | Bottom row, index and middle fingers. n is the 3rd most frequent Danish letter. Adds the missing **b** |
| 6 | p å q | Top-row pinkies |
| 7 | x z , . - | Bottom-row ring fingers and pinkies, plus punctuation |

Space (thumb) is part of every module. The module list is data in `content/da/modules.ts`, so the order can be changed without touching any code.

### Module structure
Every module has 6 exercises plus a test. The number of exercises is configurable.
- **Exercise 1, key intro:** drills on the new keys only (`fff jjj fjf jfj`, `ded kik`), 2 lines.
- **Exercises 2–5:** the new keys mixed with earlier keys. The word variety grows and one line is added per exercise. Real words are used first, and gibberish fills in for keys the real words don't cover.
- **Exercise 6:** real words only, with short "sentences". From module 4 onward, sentences start with a capital letter.
- **Module test:** real words only, about 4 lines, using every key learned so far with emphasis on the new ones.
- **Pass criteria** (in `src/config.ts`, and adjustable per profile on the parent page):
  - Accuracy: at least 95%.
  - Speed: starts at 30 keystrokes/min, then ramps by about 5 per module.

## Typing mechanics
- The exercise text is shown in large monospace with double line spacing. The input row sits directly under each text line, and the cursor appears under the next character.
- **Correct key:** the cursor advances. **Wrong key:** the error count increases (internally only), the cursor stays, and the target character flashes briefly. Backspace does nothing.
- At the end of a line, the cursor moves to the next line automatically, with no Enter needed.
- Keys are matched on `event.key`, so the Mac's Danish input layout determines the characters. Modifier-only key presses and dead-key composition are ignored.
- **Wrong-layout detection:** if the user types `;` where `æ` is expected (or `[` where `å` is), a one-time hint says "Skift til dansk tastatur".
- The timer starts on the first key press.
  - Speed = correct keystrokes per minute.
  - Accuracy = correct ÷ (correct + errors).
- **No stats while typing.** They appear only on the results screen.
- **Restart:** the Esc key or a "Start forfra" button.
- An on-screen keyboard highlights the next key and colours keys by finger, so the learner looks at the screen, not their hands. It can be hidden, for example in module tests.

## Motivation (MVP-level)
- **1–3 stars per exercise.** Passing gives 1 star; faster or more accurate attempts earn more. Kids can replay for stars, so the result is never just "failed".
- **Progress feedback:** the results screen compares against the last attempt ("+4 anslag/min", "Ny rekord!") and lists the 2–3 hardest keys.
- **Short exercises** of about 1–2 minutes each.
- **No getting stuck:** after 3 failed attempts, the app suggests a short warm-up drill on that learner's weak keys.
- **Module map:** a visual path with completed modules and stars, plus a small celebration when a module test is passed.

## Content: Danish words
- `scripts/build-wordlist.ts` turns a Danish frequency list (e.g. hermitdave/FrequencyWords `da_50k`, CC-BY-SA, credited in the README) into `src/content/da/words.json`.
  - Filters: lowercase only, letters only, length 2–8.
  - A **blocklist of inappropriate words**, because subtitle corpora contain swear words. These are kids.
- At runtime, `generator.ts` picks words whose letters are all among the allowed keys, preferring words that contain the new keys. If a key has too few real words, it fills in with pronounceable gibberish.
- Generation uses a seeded RNG, so an exercise is reproducible.
- A larger, curated Danish vocabulary can become a separate sub-project later.

## Project structure
```
src/
  config.ts                 thresholds, exercise counts
  engine/session.ts         pure typing-state reducer (cursor, errors, timing)
  engine/stats.ts           speed, accuracy, stars, weak keys
  content/generator.ts      builds exercise lines from allowed letters
  content/da/modules.ts     module definitions (keys, new keys)
  content/da/words.json     generated word list
  i18n/da.ts                UI strings (all text lives here)
  layouts/da.ts             Danish keyboard rows, finger mapping
  storage/profiles.ts       localStorage, versioned schema, per-profile progress
  components/               ProfilePicker, ModuleMap, TypingArea, Keyboard,
                            ResultScreen, ParentSettings
scripts/build-wordlist.ts
.github/workflows/deploy.yml   build + deploy to GitHub Pages
vite.config.ts                 base: '/learn-touch-typing/'
```
- Progress is stored in localStorage with a schema version, so it can migrate later to a backend (e.g. Supabase) when login comes.
- **Parent page ("Forældre"):** adjust thresholds per profile and reset progress.

## Phases
0. **Setup:**
   - Run `brew install node gh`.
   - The user runs `gh auth login` themselves.
   - `git init`, scaffold Vite + React + TS, create the public repo `learn-touch-typing`, add the Pages workflow, and deploy a hello page.
1. **Typing core:**
   - The engine plus tests.
   - TypingArea for module 1, exercise 1.
   - Results screen and restart.
2. **Full path:**
   - The generator and word list.
   - All 7 modules, exercises, tests, pass logic and module map.
   - Profiles and the on-screen keyboard.
3. **Motivation polish:**
   - Stars, comparison with the last attempt, weak-key warm-up.
   - Parent settings.

## Backlog
- Real login and sync (e.g. Supabase).
- Intensive training of weak keys.
- Daily streak, keys per day, speed graph per module.
- Achievements.
- Uploading your own text.
- Numbers and special characters.
- Sound feedback (optional).
- Posture and break reminders.
- More languages and layouts.

## Verification
- **Vitest:**
  - The session reducer: correct and wrong keys, line wrap, timing, stats.
  - The generator: every character is within the allowed keys, and the new keys appear.
  - Profile storage.
- **Manual testing:** run `npm run dev` and open it in the built-in browser. Type through module 1, exercise 1. Check the cursor behaviour, the error flash, restart, the results screen and pass/fail.
- **Deploy:** push to `main`, then check that the GitHub Actions run is green and the Pages URL loads.
- **Real-world check:** the 10-year-old tries module 1, and we tune the thresholds from that.
