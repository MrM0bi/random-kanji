/**
 * Rare "loot drop" elements that can appear instead of a kanji/meaning on a
 * spin. The items, their per-tier chances and rarity styling all live in the
 * runtime `config` store (loaded from `public/config.json`).
 */
import { get } from 'svelte/store'
import { config, type Rarity, type SpecialItem } from './config'

export type { Rarity, SpecialItem }

const TIERS: Rarity[] = ['rare', 'epic', 'legendary', 'secret']

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Roll once for a special. Each tier contributes its own disjoint slice of the
 * probability space; returns `null` (the common case) for a normal pick.
 */
export function maybePickSpecial(): SpecialItem | null {
  const { rarities, specials } = get(config)
  const r = Math.random()
  let acc = 0
  for (const tier of TIERS) {
    acc += rarities[tier]?.chance ?? 0
    if (r < acc) {
      const inTier = specials.filter((s) => s.rarity === tier)
      return inTier.length ? randomOf(inTier) : null
    }
  }
  return null
}

/** Pick one of an item's flavour descriptions at random. */
export function pickDescription(item: SpecialItem): string {
  return item.descriptions?.length ? randomOf(item.descriptions) : ''
}
