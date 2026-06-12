export interface Version {
  meanings: string[]
  primitives: string[]
  mnemonic: string[]
}

export interface KanjiEntry {
  kanji: string
  id: string
  jlpt: string
  strokes: string
  versions: Record<string, Version>
}

export interface DeckMeta {
  deck: string
  count: number
  skipped: number
  version: number
}

export interface Deck {
  meta: DeckMeta
  kanji: KanjiEntry[]
}

/** Bounds and counts derived from a loaded deck — drives every filter. */
export interface DeckStats {
  idMin: number
  idMax: number
  strokeMin: number
  strokeMax: number
  /** Map of jlpt value -> count, only including levels present in the deck. */
  jlptCounts: Record<string, number>
  /** Language version codes present across the deck (e.g. ['de']). */
  languages: string[]
}
