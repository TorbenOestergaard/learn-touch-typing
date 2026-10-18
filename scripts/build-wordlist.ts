// Builds src/content/da/words.json from a Danish frequency list, keeping only words
// the Danish Hunspell dictionary accepts in lowercase (this drops names and English).
//
// Usage:
//   node scripts/build-wordlist.ts <da_50k.txt> <path/to/da_DK (without .dic/.aff)>
//
// Sources:
//   Frequency list: https://github.com/hermitdave/FrequencyWords (content/2018/da/da_50k.txt, CC-BY-SA-4.0)
//   Dictionary:     https://github.com/LibreOffice/dictionaries (da_DK, Stavekontrolden)
//   Needs `hunspell` on PATH (brew install hunspell).

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE_WORDS = 20_000
const MAX_LENGTH = 8

// Words of one or two letters are mostly abbreviations or noise, so only these are kept.
const SHORT_WORDS = new Set(
  'i å ø er du de ud se os jo et en at og ej ja vi af om nu så på ti to is ro ko ny ål æg ur ed'.split(' '),
)

// Valid Danish words we still don't want in front of kids, plus leftover names/English.
const BLOCKED = new Set(
  `eddie dirk die did sir lord wow kuk sikke sgu hey the yes okay world look owe roll old
   dixie felix cox
   lort pis pisse pik pikke fisse kusse røv røven røvhul fanden fandens satan satans
   helvede helvedes kraftedeme kneppe knep knepper kneppet bøsse bøsser neger negre perker
   hore horer luder ludder kælling idiot idioter idiotisk spasser spade nazi nazister
   skide skid skider skiderik sex sexy nøgen nøgne porno bryster patter
   kokain narko heroin stoffer druk drukket
   dræb dræbe dræbt dræber dræbte drab mord morder mordet myrde myrdet myrdede
   lig liget ligene voldtægt voldtage selvmord bombe bomber skyd skyde skudt`.split(/\s+/),
)

// Anything containing these is dropped, e.g. "oralsex", "nazist".
const BLOCKED_PARTS = /sex|nazi|porno|fuck|lort|knep|pisse|luder|ludder|dræb|mord|voldt/

const [freqPath, dicBase] = process.argv.slice(2)
if (!freqPath || !dicBase) {
  console.error('Usage: node scripts/build-wordlist.ts <da_50k.txt> <path/to/da_DK>')
  process.exit(1)
}

const candidates = readFileSync(freqPath, 'utf8')
  .split('\n')
  .slice(0, SOURCE_WORDS)
  .map((line) => line.split(' ')[0])
  .filter((w) => /^[a-zæøå]+$/.test(w))
  .filter((w) => w.length <= MAX_LENGTH && /[aeiouyæøå]/.test(w))
  .filter((w) => (w.length <= 2 ? SHORT_WORDS.has(w) : true))
  .filter((w) => !BLOCKED.has(w) && !BLOCKED_PARTS.test(w))

// `hunspell -G` prints only the correctly spelled words from stdin.
const result = spawnSync('hunspell', ['-i', 'UTF-8', '-d', dicBase, '-G'], {
  input: candidates.join('\n'),
  encoding: 'utf8',
  env: { ...process.env, LC_ALL: 'en_US.UTF-8' },
})
if (result.status !== 0) {
  console.error(result.stderr || 'hunspell failed')
  process.exit(1)
}
const accepted = new Set(result.stdout.split('\n').filter(Boolean))
const words = candidates.filter((w) => accepted.has(w) || SHORT_WORDS.has(w))

const out = new URL('../src/content/da/words.json', import.meta.url)
writeFileSync(out, JSON.stringify(words) + '\n')
console.log(`Wrote ${words.length} words to ${out.pathname}`)
