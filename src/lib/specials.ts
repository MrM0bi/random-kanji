/**
 * Rare "loot drop" elements that can appear instead of a kanji/meaning on a
 * spin. Each tier has its own (static, tunable) per-spin chance.
 */

export type Rarity = 'rare' | 'epic' | 'legendary' | 'secret'

export interface SpecialItem {
  id: string
  /** The big glyph shown — an emoji, or a kanji (e.g. 龍). */
  glyph: string
  name: string
  message: string
  rarity: Rarity
  /** Render the glyph with an animated gold shimmer (龍). */
  gold?: boolean
  /** Trigger a standout full-screen effect. */
  effect?: 'sakura'
}

/** Per-spin chance for each tier (disjoint). Tune freely. */
export const TIER_CHANCE: Record<Rarity, number> = {
  // rare: 0.04,
  rare: 1,
  epic: 0.025,
  // epic: 1,
  legendary: 0.01,
  // legendary: 1,
  secret: 0.01,
  // secret: 1,
}

export const RARITY_META: Record<
  Rarity,
  { label: string; dot: string; color: string }
> = {
  rare: { label: 'Rare', dot: '🟣', color: '#a855f7' },
  epic: { label: 'Epic', dot: '🔴', color: '#ef4444' },
  legendary: { label: 'Legendary', dot: '🟡', color: '#f5b301' },
  secret: { label: 'Secret', dot: '💛', color: '#fde047' },
}

export const SPECIALS: SpecialItem[] = [
  // --- Rare 🟣 ---
  { id: 'sushi', glyph: '🍣', name: 'Sushi', rarity: 'rare', message: 'You got sushi! Take a snack break.' },
  { id: 'fuji', glyph: '🗾', name: 'Fuji-san', rarity: 'rare', message: 'Sugoi! Mt. Fuji appeared!' },
  { id: 'dragon', glyph: '🐉', name: 'Dragon', rarity: 'rare', message: 'A classic Japanese mythical creature.' },
  { id: 'koinobori', glyph: '🎏', name: 'Koinobori', rarity: 'rare', message: "Carp streamers for Boys' Day!" },
  { id: 'blackbelt', glyph: '🥋', name: 'Black Belt', rarity: 'rare', message: 'Shodan achieved!' },

  // --- Epic 🔴 ---
  { id: 'kitsune', glyph: '🦊', name: 'Kitsune', rarity: 'epic', message: 'A magical nine-tailed fox spirit.' },
  { id: 'kimono', glyph: '👘', name: 'Golden Kimono', rarity: 'epic', message: 'Dressed to impress the Emperor.' },
  { id: 'ramen', glyph: '🍜', name: 'Ramen Bowl', rarity: 'epic', message: 'Ichiraku Ramen — Naruto would be proud.' },
  { id: 'torii', glyph: '⛩️', name: 'Torii Gate', rarity: 'epic', message: 'The spirits are with you.' },

  // --- Legendary / Ultra-Rare 🟡 ---
  { id: 'ryu', glyph: '龍', name: 'Ryū', rarity: 'legendary', gold: true, message: 'The dragon itself, forged in gold.' },
  { id: 'oni', glyph: '👺', name: 'Oni Mask', rarity: 'legendary', message: 'An Oni has cursed your studies… skip a card!' },
  { id: 'katana', glyph: '🗡️', name: 'Katana', rarity: 'legendary', message: 'Clean, iconic, perfectly balanced.' },
  { id: 'sakura', glyph: '🌸', name: 'Sakura Storm', rarity: 'legendary', effect: 'sakura', message: 'Petals fill the air — a rare bloom!' },

  // --- Secret / Meme Tier 💛 ---
  { id: 'gundam', glyph: '🤖', name: 'Gundam', rarity: 'secret', message: 'A wild Gundam appeared!' },
  { id: 'taiyaki', glyph: '🐟', name: 'Taiyaki', rarity: 'secret', message: 'The fish-shaped cake — mundane but beloved.' },
  { id: 'gigachad', glyph: '👴', name: 'Giga-Chad Samurai', rarity: 'secret', message: 'A legendary warrior blesses your session.' },
  { id: 'dango', glyph: '🍡', name: 'Dango', rarity: 'secret', message: 'Dango, dango, dango…' },
]

const TIERS: Rarity[] = ['rare', 'epic', 'legendary', 'secret']

function randomOf(items: SpecialItem[]): SpecialItem {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Roll once for a special. Each tier contributes its own disjoint slice of the
 * probability space; returns `null` (the common case) for a normal pick.
 */
export function maybePickSpecial(): SpecialItem | null {
  const r = Math.random()
  let acc = 0
  for (const tier of TIERS) {
    acc += TIER_CHANCE[tier]
    if (r < acc) {
      const inTier = SPECIALS.filter((s) => s.rarity === tier)
      return inTier.length ? randomOf(inTier) : null
    }
  }
  return null
}
