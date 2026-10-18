// Stories for the competition mode. Each is about 200 words and uses only keys from
// the learning path: letters, capitals, space, comma, full stop and hyphen.

export interface Story {
  id: string
  title: string
  genre: string
  emoji: string
  text: string
}

export const STORIES: Story[] = [
  {
    id: 'raeven',
    title: 'Den lille ræv og månen',
    genre: 'Eventyr',
    emoji: '🦊',
    text: `Der var engang en lille ræv. Den hed Rasmus. Rasmus boede i en hule i skoven. Hver nat så han op på månen. Den var stor og gul. Rasmus ville gerne have månen. Han ville lege med den. En nat gik han ud for at finde den. Han gik over en mark. Han gik over en bro. I et træ sad en ugle. Hvor skal du hen, spurgte uglen. Jeg skal finde månen, sagde Rasmus. Uglen lo. Månen bor højt oppe på himlen, sagde hun. Du kan ikke nå den. Men Rasmus gik videre. Han kom til en sø. Søen var helt stille. Og der i vandet lå månen. Den lå lige ved hans fødder. Rasmus blev så glad. Han sprang ud for at tage den. Plask. Nu var han våd, og månen var væk. Rasmus kravlede op på land. Så kiggede han op. Der var månen igen, højt oppe på himlen. Den lyste på ham. Måske kan man ikke eje månen, tænkte han. Men man kan se på den hver nat. Han gik hjem til sin hule. Månen lyste ind ad døren. Og Rasmus sov sødt hele natten.`,
  },
  {
    id: 'dragen',
    title: 'Dragens æg',
    genre: 'Fantasy',
    emoji: '🐉',
    text: `Langt mod nord, hvor de mægtige bjerge rejser sig over skyerne, boede en pige ved navn Ilse. Hun passede sin bedstefars geder og drømte om spændende eventyr. En kold morgen fandt hun en mærkelig sten mellem klipperne, blank som glas og varm som nybagt brød. Om natten hørte hun en knasende lyd, som når isen knækker på en frossen sø. Stenen var et æg, og ud af det kravlede en lille drage med grønne skæl og gyldne øjne. Ilse kaldte den Glød og skjulte den i laden. Glød voksede utroligt hurtigt, og efter to måneder kunne den bære Ilse på ryggen. Men en dag ankom en flok riddere til landsbyen og fortalte, at kongen ville betale en formue for en levende drage. Ilse vidste, at hun måtte træffe et vanskeligt valg. Den nat klatrede hun op på bjerget sammen med Glød. Hun lagde hånden på hans varme hals og hviskede farvel. Glød bøjede hovedet, så hans pande rørte hendes, og derefter forsvandt han mod nord. Men hvert eneste år, på den første kolde morgen, ligger der en blank og varm sten foran hendes dør.`,
  },
  {
    id: 'flytningen',
    title: 'Den nye pige',
    genre: 'Drama',
    emoji: '🎭',
    text: `Da Sofies forældre fortalte, at familien skulle flytte til Aalborg, troede hun først, at det var en misforståelse. Hun havde boet i det samme gule rækkehus i Odense, siden hun blev født, og hendes bedste veninde, Maja, boede blot tre huse længere nede ad vejen. Sofie løb op på sit værelse og smækkede døren så voldsomt, at billederne på væggen klirrede. De følgende uger var forfærdelige, og de to veninder lovede hinanden at skrive hver eneste dag. På flyttedagen regnede det. Sofie sad på bagsædet og betragtede de velkendte gader forsvinde bag den duggede rude. Den første dag på den nye skole var næsten uudholdelig. Klassekammeraterne kendte allerede hinanden, og frikvartererne virkede uendeligt lange. Men om fredagen satte en pige ved navn Amira sig ved siden af hende i kantinen og spurgte, om hun kunne lide håndbold. Om eftermiddagen tog Amira hende med til træning, og for første gang i flere uger glemte Sofie at være ked af det. Om aftenen skrev hun et langt brev til Maja. Til sidst tilføjede hun, at hun stadig savnede hende, men at det måske alligevel ikke var helt så slemt at være den nye pige.`,
  },
]

export type StoryLength = 1 | 2 | 3

/** Share of the story typed for each length: a quarter, half or all of it. */
export const STORY_FRACTION: Record<StoryLength, number> = { 1: 0.25, 2: 0.5, 3: 1 }

/** The start of the story for the chosen length, cut at the nearest sentence end. */
export function storyPart(text: string, part: StoryLength): string {
  if (part === 3) return text
  const sentences = text.split(/(?<=\.)\s+/)
  const target = text.length * STORY_FRACTION[part]
  let out = ''
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s
    // Stop at whichever sentence end lies closest to the target.
    if (out && Math.abs(next.length - target) > Math.abs(out.length - target)) break
    out = next
  }
  return out
}

// Bump when story texts or lengths change, so old scores don't mix with new ones.
const STORY_SET = 2

export const storyKey = (id: string, part: StoryLength) => `${id}:${part}:v${STORY_SET}`
