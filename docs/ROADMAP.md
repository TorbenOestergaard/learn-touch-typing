# Roadmap and handover

This is the central plan for the project. Each milestone below is a self-contained brief, so a new
session can pick it up with only this file and `CLAUDE.md`.

**To start a milestone in a new session:**

> Start milestone M2 from docs/ROADMAP.md

## Workflow for a milestone

1. **Read first:** `CLAUDE.md`, this file's *Design decisions*, and the milestone's section. If the milestone lists *Questions for the user*, ask them before building.
2. **Branch:** work on `milestone/m<N>-<short-name>`, branched from `main`. A worktree session is fine.
3. **Build and verify:**
   - Pure logic goes in `src/engine`, `src/content`, `src/storage` or `src/progress`, with Vitest tests.
   - Run `npm test`, `npm run build` and `npm run lint`.
   - Check the UI in the browser with the `dev` config in `.claude/launch.json`.
4. **Release notes:**
   - Bump `version` in `package.json`. Each milestone bumps the minor version, as listed in its section. Small fixes bump the patch version.
   - Add an entry to `CHANGELOG.md`.
5. **Hand over:** update this file. Set the status, and add notes for later sessions under the milestone: decisions made, gotchas, and anything left undone.
6. **Ship:** open a PR. GitHub Actions runs the tests on the PR. Merging to `main` deploys to GitHub Pages.

## Status

| Milestone | Status | Version | Can run in parallel with |
|---|---|---|---|
| M0 Foundation: app, modules, stories, attempt log | ✅ Done | 0.1.1 | – |
| M1 Start page with streaks and achievements | ✅ Done | 0.2.0 | Run first; it changes the navigation |
| M2 Progress over time: test history and graphs, stricter passing | ✅ Done | 0.3.0 | M3, M4 (after M1) |
| M3 Profile PINs | Not started | 0.4.0 | M2, M4 |
| M4 Leaderboard with full history and sorting | Not started | 0.5.0 | M2, M3 |
| M5 Accounts and sync across devices | Later | 1.0.0 | – |

M2, M3 and M4 mostly touch different files. Each still makes small edits to `App.tsx` and `src/i18n/da.ts`, so merge them one at a time and expect small conflicts there.

## Design decisions (keep unless the user says otherwise)

- **Audience:** kids aged 7 and 10 first, but it should work for anyone. Danish UI, Danish keyboard and Danish words.
- **Learning path:** 7 modules, each with 7 exercises and a test (the 7th exercise, added in 0.3.0, is the longest). Module tests are always open.
  - Key order is `fjdk+eriu`, `sl+wo`, `gh+ty`, `aæø+Shift`, `nmvbc`, `påq`, `xz,.-`.
  - Capital letters only appear from module 4, when the pinky that presses Shift has been trained.
- **Typing rules:**
  - A wrong key doesn't move the cursor, and Backspace does nothing.
  - **No stats are shown while typing**, only afterwards.
  - Every line except the last ends with a space, shown faintly as ␣.
  - Esc restarts.
- **On-screen keyboard:** only in exercise 1 of each module, so learners don't get used to looking at it.
- **Passing:**
  - By default, 95 % accuracy and 60 correct keystrokes/min, the same in every module (since 0.3.0; it was 30 + 5 per module). Parents can adjust both per profile.
  - A module test only finishes the module (and unlocks the next) once the module's exercises are passed. Earlier test attempts are logged and charted but don't count.
  - Stars: 1 for a pass. 2 for 97 % accuracy and 1.2 × the required speed. 3 for 98 % and 1.5 ×.
- **Motivation:**
  - Results compare with the last attempt and list the hardest keys.
  - After 3 failed attempts in a row, a warm-up drill is offered.
  - Passing a module test shows how many of the 1,000 most common words the learner can now type.
- **Lyntaster (the speed competition, called "Historie-konkurrence" before 0.3.1):**
  - Three kids' texts of about 200 words (easy, medium and hard by LIX), plus "At være eller ikke være" for adults (Hamlet, modernised after Foersom, written from memory). The adult text also uses `? ! " :`; it is marked `adults: true` and isn't needed for the "Bogorm" badge.
  - Lengths are ¼, ½ or the whole story.
  - Points = speed × accuracy².
  - The leaderboard key carries a version (`storyKey`); bump `STORY_SET` whenever the texts change.
- **Content safety:** the word list is filtered by Hunspell plus a blocklist, and made-up words are checked against a rudeness filter. Keep it that way for any new content.
- **Data:**
  - Everything is in `localStorage` under `ltt:v1`, per browser.
  - New `Profile` fields must be optional, or the stored data must be migrated, so existing kids keep their progress.
  - `profile.history` logs every finished attempt from v0.1.1 onward.
- **Hosting:** static site on GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main`.

---

## M1 – Start page with streaks and achievements (0.2.0)

**Why:** the app now has two activities, training and the story competition. The first screen should
make it obvious what to do next and reward coming back every day.

**Scope:**
- **Home screen after picking a profile:**
  - Two big entries: **Træning** (continue the next exercise, open the module map) and **Konkurrence** (stories).
  - A short progress strip: streak 🔥, today's keystrokes, total stars, and the current module with its progress bar.
- **Streak:** consecutive days (local time) with at least one finished attempt. Show the current streak and the best streak.
- **Today and this week:** keystrokes, exercises finished and minutes typed, all computed from `profile.history`.
- **Achievements:**
  - Derive them from history and progress, rather than storing them, so they also work retroactively. Store only "seen" flags if needed for the "new!" celebration.
  - Starter set (adjust as needed):
    - first exercise
    - first 3-star result
    - each module passed
    - 3-, 7- and 30-day streaks
    - 1,000 / 10,000 / 100,000 keystrokes in total
    - first story
    - all three stories finished
    - all 1,000 common words unlocked
- **Celebration:** when an attempt unlocks an achievement, show it on the result screen.

**Where:**
- New `src/progress/` with `streak.ts` and `achievements.ts`, plus tests.
- New `src/components/Home.tsx`.
- Changes to `App.tsx` (new `home` screen as the default) and `i18n/da.ts`.
- `ModuleMap` becomes the training view.

**Questions for the user:** should there be a daily goal, such as 10 minutes or 3 exercises? Should streaks forgive one missed day?

**Done when:** the home screen shows the streak, today's stats and achievements; everything is computed from `history` and covered by tests; and the result screen celebrates newly unlocked achievements.

**Handover notes (M1, done in 0.2.0):**
- **User decisions:** a daily goal of 10 minutes (`DAILY_GOAL_MINUTES`, per profile in `prefs.dailyGoalMinutes` via `dailyGoalOf`, 0 hides it). Streaks are strict: one missed day resets them. Today only counts as missed once it is over, so yesterday's streak still shows until midnight.
- **Navigation:** `home` is the default screen. `map` is the training view (back to home). The parent page, story picker and story results go back to home. Exercise results still go to the map. Leaving a story mid-typing goes back to the story picker. The typing screen's exit link now says "Tilbage".
- **Logic:** `src/progress/streak.ts` (local-day streaks, `today`/`thisWeek`, Monday weeks, DST-safe `dayIndex`) and `src/progress/achievements.ts`. Keystrokes are `correct + errors`. "Øvelser" in the activity table counts every finished attempt, including stories and warm-ups.
- **Achievements aren't stored.** `newlyUnlocked(before, after)` compares the profile before and after an attempt in `App.tsx`. No "seen" flags were needed. Old attempts from before v0.1.1 only count through `progress` and `storyBest` (first exercise, 3 stars, modules, stories); streaks and keystrokes need `history`.
- **Reset:** "Nulstil fremskridt" (`resetProgress`) clears `progress`, `keyErrors`, `history` and `storyBest`, so streaks, badges and the profile's leaderboard entries start over. Settings and prefs are kept (user decision).
- **Ideas left out:** a "new!" marker on the home screen, and a streak freeze. M2's re-test suggestion fits on the home screen, between the entries and the activity table.

## M2 – Progress over time: test history and graphs (0.3.0)

**Why:** show kids (and parents) that speed and accuracy improve, and let them retake module tests to measure it.

**Scope:**
- **Retaking tests:** module tests can be retaken at any time once unlocked. This already works; make it visible as "Tjek din form" on passed modules. Every attempt is logged in `history` with kind `test`.
- **Progress view per profile:**
  - For each module, plot the test attempts over time: speed and accuracy. Draw them with small inline SVG charts; don't add a chart library.
  - Overall trend: average speed per week across all exercises.
- **Suggest a re-test:** if a passed module's last test is more than 14 days old, suggest retaking it. This could live on the M1 home screen.
- **Units:** respect the profile's speed unit (`speedUnitOf`, `formatSpeed`).

**Where:** new `src/components/Progress.tsx` and `src/progress/series.ts` (the grouping logic, with tests).

**Questions for the user:** should the progress view also be visible to parents across all profiles?

**Done when:** a profile with several test attempts sees a chart for each module, and the series logic is unit tested.

**Handover notes (M2, done in 0.3.0):**
- **User decisions:** the progress view shows the active profile only. The user also asked for stricter passing, because the
  son moved on too fast to build muscle memory: a fixed 60 kpm in every module, a 7th (5-line) exercise per module,
  tests always open in every module, and existing progress kept.
- **Passing logic** (`src/storage/profiles.ts`):
  - `isUnlocked(…, 'test')` is always true.
  - `testCounts` = the test is already passed, or the last exercise is passed.
  - `recordAttempt(…, counts)` with `counts = false` logs speed and attempts but not `passed` or `bestStars`. The result screen then shows "Flot test! Klar øvelserne…", and "Næste" continues with `nextExercise`.
  - `nextExercise` skips modules whose test is passed, so the new 7th exercise is optional in modules finished before 0.3.0.
- **Migration:** `migrateProfile` runs in `loadStore`. Profiles on the old defaults (30 + 5) get 60. A custom `baseKpm` is kept. `kpmStepPerModule` is dropped (still optional in `Thresholds` for old data). `rulesVersion: 2` marks a profile as migrated; bump `RULES_VERSION` for future rule changes.
- **Charts:** `src/components/LineChart.tsx` is a plain-SVG single-series chart with a dashed goal line and hover/tap tooltips. Its viewBox follows the container width (ResizeObserver), so text stays the same size. There is one chart per measure; never use a dual axis. The speed axis tops out at a multiple of 60 kpm, so the ticks are round in kps too.
- **Series:** `src/progress/series.ts`:
  - `testSeries` and `weeklySpeed`. The weekly average covers exercises and tests (not stories or warm-ups), weighted by time.
  - `retestDue` (14 days). A module passed before history existed counts as due. Home shows the oldest due module as a banner.
- **Left out:** a parent view across profiles.

**Follow-up (0.3.1): tests and progress redesign.** Run with a UX designer, a behavioural-design expert and a kid panel (ages 7, 10, 12); the owner picked finalist C. The design brief, the round outputs and the canvas are linked from the PR.
- **Home:** three cards: Træning, ⏱️ Test (teal, "Tag en test", one data-driven nudge line from `profileTestNudge`) and ⚡ Lyntaster. The 4th strip tile is "Seneste test" for the latest *valid* test, always naming its module (speeds from different modules are never mixed). A "📈 Din udvikling" card shows first → best in that module.
- **Test picker** (`tests` screen): every module, best stars and speed, the recommended module first. "Tag en test" where the module isn't given; "Tag testen" inside a module row.
- **Progress page:** per-module cards with an Enkel / Standard / Avanceret switch (`prefs.chartMode`, default Standard): a gauge (`Gauge.tsx`), the record staircase over one bar per test (`RecordChart.tsx`), or accuracy × speed with nested star zones (`TargetPlot.tsx`). Tests under the pass accuracy are hatched/hollow and never raise the record. "Dine dage" (`DaysChart.tsx`, keystrokes per day for 7 days) replaced the weekly average line.
- **Results:** `testHeadline()` picks the headline (module done only once; first test; fast but sloppy; not yet; new star; new record; holds; below record; lower tier). `StarLadder` shows the next star as one pill for speed and one for accuracy, after every exercise and test. Tests show `CompareBars`: first test, record before, today.
- **Logic:** `src/progress/stars.ts` (tiers, `nextStarGap`, `starsOf`), `testResult.ts`, and `recordSteps`, `dailyActivity`, `latestTest`, `bestTests`, `testNudge` in `series.ts`, all with tests. `weeklySpeed` and `LineChart.tsx` were removed.
- **Ideas not built:** a Wrapped-style monthly card (the 12-year-old's wish); a one-time first-result star explanation; the "Dagsform" copy was dropped on purpose (the kid panel disliked it).

## M3 – Profile PINs (0.4.0)

**Why:** keep siblings from playing on each other's profiles. This is not real security.

**Scope:**
- **Profile PIN:**
  - Optional per profile. For the 7-year-old, consider a picture PIN (pick 3 of 9 animals) instead of digits.
  - Store it as a salted SHA-256 hash (`crypto.subtle`), never in plain text.
- **Parent PIN:** optional, protects the "Forældre" page. Otherwise kids can lower their own thresholds.
- **Forgotten PIN:** the parent page can reset a profile's PIN. A forgotten parent PIN is reset by clearing site data, which also deletes all progress; say so in the UI.
- **Be honest about it:** everything is in localStorage, so anyone with developer tools can bypass it. Real accounts come with M5.

**Where:** `ProfilePicker.tsx`, `ParentSettings.tsx`, new `src/storage/pin.ts` (with tests), `i18n/da.ts`.

**Done when:** a profile with a PIN can't be opened without it, the parent page can be locked, and both can be reset.

## M4 – Leaderboard with full history and sorting (0.5.0)

**Why:** today the leaderboard keeps only each user's best score per story, which is overwritten. Kids want to see all their tries and compare in different ways.

**Scope:**
- **Source:** build the leaderboard from `profile.history` (kind `story`) instead of only `storyBest`. Keep `storyBest` as a fallback for attempts from before v0.1.1.
- **By game:** pick a story and length, then see the top results. Toggle between "best per person" and "all attempts".
- **By person:** all of one profile's story results across games, with their best for each.
- **Sorting:** sortable columns for points, speed, accuracy and date.
- **Units:** respect the viewer's speed unit.

**Where:** `src/components/Stories.tsx` (or a new `Leaderboard.tsx`), and `leaderboard()` in `src/storage/profiles.ts` or a new `src/progress/leaderboard.ts` (with tests).

**Done when:** both views work with sorting, and the leaderboard logic is unit tested.

## M5 – Accounts and sync across devices (1.0.0, later)

**When:** once friends and family want to use it, or the kids use more than one device.

**Sketch:**
- A small backend: Supabase (auth plus Postgres, free tier) or similar. The site stays static on GitHub Pages.
- Real login replaces the M3 PINs, and a family account holds several kid profiles.
- On first login, migrate local profiles and history.
- Shared leaderboards become possible across families.

---

## Backlog (unscheduled)

- Train difficult keys more intensively, using the lifetime `keyErrors` per profile.
- More stories, including stories that only use the keys learned so far, so they can be played before finishing the course.
- Numbers and special characters (module 8+).
- Upload your own text to type.
- A larger, curated Danish vocabulary for the exercises (possibly its own repo).
- More languages and keyboard layouts. All UI text already lives in `src/i18n/da.ts`.
- Posture and break reminders.
- Sound options, such as a gentler beep or a "correct line" chime.
