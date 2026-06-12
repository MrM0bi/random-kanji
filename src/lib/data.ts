import type { Deck, DeckStats } from './types'

/** Fetch + parse + minimally validate a deck JSON file. */
export async function loadDeck(url: string): Promise<Deck> {
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error(`Failed to load deck (HTTP ${res.status})`)
  }
  const data = (await res.json()) as unknown
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray((data as Deck).kanji)
  ) {
    throw new Error('Invalid deck format: missing "kanji" array')
  }
  return data as Deck
}

/** Compute filter bounds and per-level counts from a deck. Nothing hardcoded. */
export function computeStats(deck: Deck): DeckStats {
  let idMin = Infinity
  let idMax = -Infinity
  let strokeMin = Infinity
  let strokeMax = -Infinity
  const jlptCounts: Record<string, number> = {}
  const languages = new Set<string>()

  for (const e of deck.kanji) {
    const id = parseInt(e.id, 10)
    const strokes = parseInt(e.strokes, 10)
    if (Number.isFinite(id)) {
      idMin = Math.min(idMin, id)
      idMax = Math.max(idMax, id)
    }
    if (Number.isFinite(strokes)) {
      strokeMin = Math.min(strokeMin, strokes)
      strokeMax = Math.max(strokeMax, strokes)
    }
    jlptCounts[e.jlpt] = (jlptCounts[e.jlpt] ?? 0) + 1
    for (const lang of Object.keys(e.versions)) languages.add(lang)
  }

  if (deck.kanji.length === 0) {
    idMin = idMax = strokeMin = strokeMax = 0
  }

  return {
    idMin,
    idMax,
    strokeMin,
    strokeMax,
    jlptCounts,
    languages: [...languages].sort(),
  }
}
