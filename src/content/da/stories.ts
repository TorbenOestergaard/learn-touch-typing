// Stories for the competition mode. Each is under one A4 page and uses only keys from
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
    text: `Der var engang en lille ræv. Den hed Rasmus. Rasmus boede i en hule i skoven. Han havde en rød hale og to små ører. Hver nat så han op på månen. Den var stor og gul. Rasmus ville gerne have månen. Han ville lege med den. En nat gik han ud for at finde den. Han gik over en mark. Han gik over en bro. I et træ sad en ugle. Hvor skal du hen, spurgte uglen. Jeg skal finde månen, sagde Rasmus. Uglen lo. Månen bor højt oppe på himlen, sagde hun. Du kan ikke nå den. Men Rasmus gik videre. Han kom til en sø. Søen var helt stille. Og der i vandet lå månen. Den lå lige ved hans fødder. Rasmus blev så glad. Han sprang ud for at tage den. Plask. Nu var han våd, og månen var væk. Rasmus kravlede op på land. Han rystede sin pels. Så kiggede han op. Der var månen igen, højt oppe på himlen. Den lyste på ham. Måske kan man ikke eje månen, tænkte han. Men man kan se på den hver nat. Han gik hjem til sin hule. Han lagde sig i sin seng af blade. Månen lyste ind ad døren. Og Rasmus sov sødt hele natten.`,
  },
  {
    id: 'dragen',
    title: 'Dragens æg',
    genre: 'Fantasy',
    emoji: '🐉',
    text: `Langt mod nord, hvor de mægtige bjerge rejser sig over skyerne, boede en pige ved navn Ilse. Hun passede sin bedstefars geder og drømte om spændende eventyr i fremmede lande. En kold morgen fandt hun en mærkelig sten mellem klipperne, blank som glas og varm som brød, der lige er kommet ud af ovnen. Ilse tog forsigtigt stenen med hjem og lagde den ved ilden. Om natten hørte hun en knasende lyd, som når isen knækker på en frossen sø. Stenen var et æg, og ud af det kravlede en lille drage med grønne skæl og gyldne øjne. Ilse kaldte den Glød og skjulte den i laden, hvor hun fodrede den med fisk og mælk. Glød voksede utroligt hurtigt. Efter en måned kunne den flyve over gården, og efter to måneder kunne den bære Ilse på ryggen. Men en dag ankom en flok riddere til landsbyen og fortalte, at kongen ville betale en formue for en levende drage. Folk i byen begyndte at hviske, for nogen havde set mystiske skygger på himlen. Ilse vidste, at hun måtte træffe et vanskeligt valg. Hun kunne beholde sin bedste ven og risikere, at han blev fanget, eller hun kunne lade ham flyve. Den nat klatrede hun op på bjerget sammen med Glød. Stjernerne lyste, og vinden var skarp og kold. Hun lagde hånden på hans varme hals og hviskede farvel. Glød bøjede hovedet, så hans pande rørte hendes, og derefter foldede han vingerne ud og forsvandt mod nord. Ilse græd hele vejen ned. Men hvert eneste år, på den første kolde morgen, ligger der en blank og varm sten foran hendes dør.`,
  },
  {
    id: 'flytningen',
    title: 'Den nye pige',
    genre: 'Drama',
    emoji: '🎭',
    text: `Da Sofies forældre fortalte, at familien skulle flytte til Aalborg, troede hun først, at det var en misforståelse. Hun havde boet i det samme gule rækkehus i Odense, siden hun blev født, og hendes bedste veninde, Maja, boede blot tre huse længere nede ad vejen. Forældrene forklarede tålmodigt, at hendes far havde fået et nyt arbejde, og at beslutningen allerede var truffet. Sofie løb op på sit værelse og smækkede døren så voldsomt, at billederne på væggen klirrede. De følgende uger var forfærdelige. Hun nægtede at hjælpe med at pakke flyttekasserne, og hun svarede kun med enstavelsesord, når hendes mor forsøgte at begynde en samtale. Maja var lige så ulykkelig, og de to veninder tilbragte de sidste eftermiddage på legepladsen, hvor de lovede hinanden at skrive hver eneste dag. På flyttedagen regnede det. Sofie sad på bagsædet og betragtede de velkendte gader forsvinde bag den duggede rude. I Aalborg var huset større, og hendes nye værelse havde udsigt over fjorden, men alligevel føltes alting fremmed. Den første dag på den nye skole var næsten uudholdelig. Klassekammeraterne kendte allerede hinanden, og frikvartererne virkede uendeligt lange. Men om fredagen skete der noget uventet. En pige ved navn Amira satte sig ved siden af hende i kantinen og spurgte, om hun kunne lide håndbold. Sofie nikkede forsigtigt. Om eftermiddagen tog Amira hende med til træning, og for første gang i flere uger glemte Sofie at være ked af det. Om aftenen skrev hun et langt brev til Maja. Hun fortalte om fjorden, om håndbolden og om Amira. Til sidst tilføjede hun, at hun stadig savnede hende, men at det måske alligevel ikke var helt så slemt at være den nye pige.`,
  },
]

export type StoryLength = 1 | 2 | 3

/** The first `part` thirds of the story, cut at the nearest sentence end. */
export function storyPart(text: string, part: StoryLength): string {
  if (part === 3) return text
  const sentences = text.split(/(?<=\.)\s+/)
  const target = (text.length * part) / 3
  let out = ''
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s
    // Stop at whichever sentence end lies closest to the target.
    if (out && Math.abs(next.length - target) > Math.abs(out.length - target)) break
    out = next
  }
  return out
}

export const storyKey = (id: string, part: StoryLength) => `${id}:${part}`
