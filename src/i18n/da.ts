// All user-facing text. Add another file with the same shape for a new language.

import type { Finger } from '../layouts/da'

export const da = {
  appTitle: 'Lær at skrive med 10 fingre',
  whoAreYou: 'Hvem skal skrive i dag?',
  newProfile: 'Ny profil',
  name: 'Navn',
  pickAvatar: 'Vælg en figur',
  create: 'Opret',
  cancel: 'Annuller',
  back: 'Tilbage',
  switchProfile: 'Skift profil',
  parents: 'Forældre',
  continue: 'Fortsæt',
  allDone: 'Du har klaret alle moduler! 🎉',
  module: (n: number) => `Modul ${n}`,
  newKeys: 'Nye taster',
  exercise: (n: number) => `Øvelse ${n}`,
  test: 'Test',
  moduleTest: (n: number) => `Test for modul ${n}`,
  warmup: 'Opvarmning',
  stars: (n: number) => `${n} ⭐`,
  locked: 'Låst',

  // Typing
  typeTheLine: 'Skriv teksten under hver linje.',
  restart: 'Start forfra',
  restartHint: 'Esc = start forfra',
  showKeyboard: 'Vis tastatur',
  hideKeyboard: 'Skjul tastatur',
  wrongLayout:
    'Det ser ud til, at tastaturet ikke står på dansk. Skift til dansk tastatur i systemindstillingerne (eller med ⌃ mellemrum).',
  startHint: 'Sæt fingrene på F og J (de har små bump) og begynd at skrive.',
  fingers: {
    lp: 'venstre lillefinger',
    lr: 'venstre ringfinger',
    lm: 'venstre langfinger',
    li: 'venstre pegefinger',
    ri: 'højre pegefinger',
    rm: 'højre langfinger',
    rr: 'højre ringfinger',
    rp: 'højre lillefinger',
    th: 'tommelfinger',
  } satisfies Record<Finger, string>,
  useFinger: (finger: string) => `Brug ${finger}`,
  withShift: (finger: string) => `+ Shift med ${finger}`,
  space: 'mellemrum',

  // Results
  passedTitle: ['Godt klaret!', 'Flot!', 'Super!', 'Sådan!'],
  failedTitle: 'Næsten! Prøv igen',
  moduleDone: (n: number) => `Modul ${n} er klaret! 🎉`,
  warmupDone: 'Godt varmet op!',
  speed: 'Hastighed',
  speedUnit: 'anslag i minuttet',
  accuracy: 'Præcision',
  goal: (v: string) => `Mål: ${v}`,
  newRecord: 'Ny rekord!',
  vsLast: (diff: number) => (diff >= 0 ? `+${diff} siden sidst` : `${diff} siden sidst`),
  hardKeys: 'Tasterne der drillede mest',
  tryAgain: 'Prøv igen',
  next: 'Næste',
  toMap: 'Til oversigten',
  warmupSuggestion:
    'Det er svært lige nu. Prøv en kort opvarmning med de taster, der driller – så går det lettere bagefter.',
  startWarmup: 'Start opvarmning',
  slowerHint: 'Tip: Skriv roligt og præcist. Farten kommer af sig selv.',
  fasterHint: 'Meget præcist! Prøv at skrive lidt hurtigere næste gang.',

  // Parents
  parentsTitle: 'Indstillinger for forældre',
  profile: 'Profil',
  minAccuracy: 'Krævet præcision (%)',
  baseKpm: 'Krævet hastighed i modul 1 (anslag/min)',
  kpmStep: 'Ekstra hastighed pr. modul',
  save: 'Gem',
  saved: 'Gemt',
  resetProgress: 'Nulstil fremskridt',
  confirmReset: (name: string) => `Vil du nulstille alle fremskridt for ${name}?`,
  deleteProfile: 'Slet profil',
  confirmDelete: (name: string) => `Vil du slette profilen ${name}? Det kan ikke fortrydes.`,
  noProfiles: 'Der er ingen profiler endnu.',
}

export type Strings = typeof da
