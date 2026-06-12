import type { KanjiEntry } from './types'

export interface ResolvedFilters {
  idFrom: number
  idTo: number
  strokeMin: number
  strokeMax: number
  jlptLevels: Set<string>
}

/** Keep entries that satisfy every active filter. */
export function applyFilters(
  entries: KanjiEntry[],
  f: ResolvedFilters,
): KanjiEntry[] {
  return entries.filter((e) => {
    const id = parseInt(e.id, 10)
    const strokes = parseInt(e.strokes, 10)
    if (id < f.idFrom || id > f.idTo) return false
    if (strokes < f.strokeMin || strokes > f.strokeMax) return false
    if (!f.jlptLevels.has(e.jlpt)) return false
    return true
  })
}

/** Pick a random entry, avoiding an immediate repeat when the pool allows. */
export function pickRandom(
  pool: KanjiEntry[],
  lastId?: string,
): KanjiEntry | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]
  let pick: KanjiEntry
  do {
    pick = pool[Math.floor(Math.random() * pool.length)]
  } while (pick.id === lastId)
  return pick
}
