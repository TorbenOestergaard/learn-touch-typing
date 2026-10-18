# Changelog

## 0.2.0 – 2026-10-18

- A new home screen after picking a profile, with two entries: **Træning** (continue, or open the module map) and **Konkurrence** (stories).
- A progress strip with the streak 🔥 (days in a row with at least one finished attempt), today's keystrokes, total stars and the current module.
- A daily goal of 10 minutes of typing. Parents can change it per profile, or set it to 0 to hide it.
- Keystrokes, attempts and minutes for today and this week.
- 18 achievements (badges), computed from the history and progress, so earlier results count too. Newly unlocked ones are celebrated on the result screen.
- The module map is now the training view, with a link back to the home screen.

## 0.1.1 – 2026-10-18

- The version number is shown on the start and overview pages.
- Each line in an exercise ends with a space, shown faintly as ␣, like the end of a word in running text.
- Parents can choose to show speed in keystrokes per minute or per second (2 decimals). The speed is now stored with decimals.
- Stories are shorter: about 200 words, with the lengths ¼, ½ and the whole story. The leaderboards start over because the texts changed.
- Every finished attempt is logged in `profile.history`. This is the groundwork for streaks, progress graphs and leaderboards.
- Added `CLAUDE.md` and `docs/ROADMAP.md` for handover between sessions. PRs now run the tests in GitHub Actions.

## 0.1.0 – 2026-10-18

- 7 modules with 6 exercises and a test each, on a Danish keyboard with Danish words.
- Local profiles, results with stars, a warm-up after repeated misses, and parent settings.
- A beep on wrong keys (can be switched off), and the on-screen keyboard only in exercise 1.
- After a module test, a count of how many of the 1,000 most common words the learner can type.
- Story competition with 3 stories at different LIX levels, and a leaderboard.
