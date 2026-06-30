import { writable, derived, type Writable } from 'svelte/store'
import type { DeckStats, KanjiEntry } from './types'
import { applyFilters, type ResolvedFilters } from './filters'
import { DEFAULT_SOURCE_ID } from './sources'
import type { SpinSpeed } from './config'
import type { SpecialItem } from './specials'

export type Mode = 'kanji' | 'meaning'
export type Theme = 'light' | 'dark'
export type LoadState = 'loading' | 'ready' | 'error'

/** A spin result: either a normal kanji entry or a rare special element. */
export type Pick =
  | { kind: 'kanji'; entry: KanjiEntry }
  | { kind: 'special'; item: SpecialItem; description: string }

/**
 * Raw filter values as edited by the user. `null` means "open / full range",
 * which is resolved against the current deck's bounds. This keeps persisted
 * filters valid even if a different deck (with different bounds) loads later.
 */
export interface RawFilters {
  idFrom: number | null
  idTo: number | null
  strokeMin: number | null
  strokeMax: number | null
  /** null = all present levels selected. */
  jlptLevels: string[] | null
}

export const FULL_FILTERS: RawFilters = {
  idFrom: null,
  idTo: null,
  strokeMin: null,
  strokeMax: null,
  jlptLevels: null,
}

/* ------------------------------------------------------------------ */
/* localStorage-backed store helper                                    */
/* ------------------------------------------------------------------ */

function persisted<T>(key: string, initial: T): Writable<T> {
  let start = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) start = JSON.parse(raw) as T
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  const store = writable<T>(start)
  store.subscribe((value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be unavailable (private mode, etc.) */
    }
  })
  return store
}

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/* ------------------------------------------------------------------ */
/* Persisted user preferences                                          */
/* ------------------------------------------------------------------ */

export const theme = persisted<Theme>('rk:theme', prefersDark() ? 'dark' : 'light')
export const mode = persisted<Mode>('rk:mode', 'kanji')
export const lang = persisted<string>('rk:lang', 'de')
export const sourceId = persisted<string>('rk:source', DEFAULT_SOURCE_ID)
export const rawFilters = persisted<RawFilters>('rk:filters', { ...FULL_FILTERS })
export const spinSpeed = persisted<SpinSpeed>('rk:speed', 'normal')
/** Whether rare "loot drop" specials can appear on a spin. */
export const specialsOn = persisted<boolean>('rk:specials', true)

/* ------------------------------------------------------------------ */
/* Session-only state (cleared on reload)                              */
/* ------------------------------------------------------------------ */

/** Button OFF (default) = no repeats: a kanji drawn this session won't recur. */
export const avoidRepeats = persisted<boolean>('rk:avoidRepeats', true)
/** Ids drawn this session; only consulted while `avoidRepeats` is on. */
export const seenIds = writable<Set<string>>(new Set())

/* ------------------------------------------------------------------ */
/* Runtime (deck) state                                                */
/* ------------------------------------------------------------------ */

export const entries = writable<KanjiEntry[]>([])
export const deckStats = writable<DeckStats | null>(null)
export const loadState = writable<LoadState>('loading')
export const loadError = writable<string>('')

export const currentPick = writable<Pick | null>(null)
export const lastPickId = writable<string | undefined>(undefined)

/** Resolve raw filters against the live deck stats (null -> deck bound). */
export const filters = derived(
  [rawFilters, deckStats],
  ([$raw, $stats]): ResolvedFilters | null => {
    if (!$stats) return null
    const levels = $raw.jlptLevels ?? Object.keys($stats.jlptCounts)
    return {
      idFrom: $raw.idFrom ?? $stats.idMin,
      idTo: $raw.idTo ?? $stats.idMax,
      strokeMin: $raw.strokeMin ?? $stats.strokeMin,
      strokeMax: $raw.strokeMax ?? $stats.strokeMax,
      jlptLevels: new Set(levels),
    }
  },
)

/** The entries matching the active filters, and their count. */
export const filtered = derived(
  [entries, filters],
  ([$entries, $filters]): KanjiEntry[] =>
    $filters ? applyFilters($entries, $filters) : [],
)

export const poolCount = derived(filtered, ($filtered) => $filtered.length)

/** Pickable kanji right now: full pool, or unseen-only when avoiding repeats. */
export const availableCount = derived(
  [filtered, avoidRepeats, seenIds],
  ([$filtered, $avoid, $seen]): number =>
    $avoid ? $filtered.filter((e) => !$seen.has(e.id)).length : $filtered.length,
)

/** Filtered kanji temporarily removed by the no-repeat setting (0 when off). */
export const eliminatedCount = derived(
  [filtered, avoidRepeats, seenIds],
  ([$filtered, $avoid, $seen]): number =>
    $avoid ? $filtered.filter((e) => $seen.has(e.id)).length : 0,
)

export function resetFilters(): void {
  rawFilters.set({ ...FULL_FILTERS })
}
