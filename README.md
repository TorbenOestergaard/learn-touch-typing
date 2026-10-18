# Lær at skrive med 10 fingre

A web app for learning touch typing (10-finger typing), made for kids but usable by anyone.
It is Danish first: Danish keyboard layout, Danish interface and Danish words.

## How it works

- **7 modules**, and each one adds a few keys. The order lives in `src/content/da/modules.ts`:
  1. `f j d k e r u i`
  2. `s l w o`
  3. `g h t y`
  4. `a æ ø` + Shift (capital letters start here)
  5. `n m v b c`
  6. `p å q`
  7. `x z , . -`
- **Each module has 6 exercises and a test:**
  - Exercise 1 drills the new keys.
  - Exercises 2–5 mix real words with made-up words.
  - Exercise 6 and the test use real words only.
- **Typing:** you type on the line under the text. A wrong key doesn't move the cursor and you can't erase, so you have to find the right key. Esc restarts.
- **Feedback:** no speed or errors are shown while typing. You see them afterwards, along with 1–3 stars and the keys that gave you the most trouble.
- **Passing:** by default, 95 % accuracy and 30 keystrokes per minute in module 1, plus 5 per module after that. Parents can change this per profile under "Forældre".
- **Storage:** profiles and progress are saved in the browser (localStorage). There is no login.

## Development

```bash
npm install
npm run dev      # http://localhost:5173/learn-touch-typing/
npm test         # unit tests (Vitest)
npm run build
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

### Word list

`src/content/da/words.json` is generated and committed. To rebuild it, you need [hunspell](https://hunspell.github.io/) (`brew install hunspell`):

```bash
curl -LO https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/da/da_50k.txt
curl -LO https://raw.githubusercontent.com/LibreOffice/dictionaries/master/da_DK/da_DK.dic
curl -LO https://raw.githubusercontent.com/LibreOffice/dictionaries/master/da_DK/da_DK.aff
npm run build:words -- da_50k.txt ./da_DK
```

The script keeps the 20,000 most frequent words that the Danish dictionary accepts in lowercase. This removes names and English words. It also drops words on a blocklist of things that shouldn't be shown to kids.

## Credits

- Word frequencies: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave, CC-BY-SA-4.0, derived from OpenSubtitles. The generated `words.json` is under the same license.
- Spell-check filter: [Stavekontrolden](https://www.stavekontrolden.dk) Danish Hunspell dictionary. It is used at build time only and not distributed.
