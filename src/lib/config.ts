/**
 * Runtime app configuration. Everything tunable — spinner feel, spin speeds,
 * loot rarities and the loot items themselves — lives in `public/config.json`,
 * which is fetched on startup (like the kanji deck) so it stays editable AFTER
 * the build (just replace/mount the file). The values here are only a built-in
 * fallback used if that file is missing or invalid.
 */
import { writable } from 'svelte/store'

export type SpinSpeed = 'normal' | 'fast' | 'instant'
export type Rarity = 'rare' | 'epic' | 'legendary' | 'secret'

/** Tunable spinner-reel animation settings (read by `SpinnerReel.svelte`). */
export interface SpinnerConfig {
  /** Total duration of a single spin, in ms. Larger = slower. */
  durationMs: number
  /** CSS timing function — a strong ease-out gives the CS:GO case feel. */
  easing: string
  /** Cells the reel travels per spin (more = longer visible travel). */
  spinCells: number
  /** Quick nudge that snaps the landed cell to exact centre, in ms. */
  settleMs: number
  /** Easing for that final centring nudge. */
  settleEasing: string
}

export interface SpeedConfig {
  label: string
  durationMs: number
}

export interface RarityConfig {
  label: string
  /** Coloured dot shown on the rarity badge. */
  dot: string
  /** Accent colour for badge/glow/sparkle. */
  color: string
  /** Per-spin drop chance for this tier (disjoint across tiers). */
  chance: number
  /** Sparkle burst in the rarity colour. */
  sparkle: boolean
  /** Soft ambient glow behind the card. */
  glow: boolean
  /** The item's emoji rains down across the screen. */
  emojiRain: boolean
}

export interface SpecialItem {
  id: string
  /** The big glyph shown — an emoji, or a kanji (e.g. 龍). */
  glyph: string
  name: string
  /** Japanese reading shown under the name (e.g. 寿司). */
  kanji?: string
  rarity: Rarity
  /** Render the glyph with an animated gold shimmer (龍). */
  gold?: boolean
  /** Flavour lines — one is picked at random when the item drops. */
  descriptions: string[]
}

export interface AppConfig {
  spinner: SpinnerConfig
  spinSpeeds: Record<SpinSpeed, SpeedConfig>
  rarities: Record<Rarity, RarityConfig>
  specials: SpecialItem[]
}

/** Built-in fallback used only if `config.json` fails to load. */
export const DEFAULT_CONFIG: AppConfig = {
  spinner: {
    durationMs: 5000,
    easing: 'cubic-bezier(0.18, 0.9, 0.24, 1)',
    spinCells: 48,
    settleMs: 450,
    settleEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  spinSpeeds: {
    normal: { label: 'Normal', durationMs: 5000 },
    fast: { label: 'Fast', durationMs: 2200 },
    instant: { label: 'Instant', durationMs: 800 },
  },
  rarities: {
    rare: { label: 'Rare', dot: '🟣', color: '#a855f7', chance: 0.04, sparkle: false, glow: false, emojiRain: false },
    epic: { label: 'Epic', dot: '🔴', color: '#ef4444', chance: 0.03, sparkle: true, glow: false, emojiRain: false },
    legendary: { label: 'Legendary', dot: '🟡', color: '#f5b301', chance: 0.02, sparkle: true, glow: true, emojiRain: false },
    secret: { label: 'Secret', dot: '💛', color: '#fde047', chance: 0.01, sparkle: true, glow: true, emojiRain: true },
  },
  specials: [],
}

/** Live config, populated by `loadConfig()` before the app mounts. */
export const config = writable<AppConfig>(DEFAULT_CONFIG)

const SPEEDS: SpinSpeed[] = ['normal', 'fast', 'instant']
const RARITIES: Rarity[] = ['rare', 'epic', 'legendary', 'secret']

/** Merge a (possibly partial) loaded config over the defaults so missing or
 *  hand-edited keys never break the app. */
function mergeConfig(data: Partial<AppConfig> | null): AppConfig {
  if (!data || typeof data !== 'object') return DEFAULT_CONFIG

  const spinSpeeds = {} as Record<SpinSpeed, SpeedConfig>
  for (const s of SPEEDS) {
    spinSpeeds[s] = { ...DEFAULT_CONFIG.spinSpeeds[s], ...(data.spinSpeeds?.[s] ?? {}) }
  }

  const rarities = {} as Record<Rarity, RarityConfig>
  for (const r of RARITIES) {
    rarities[r] = { ...DEFAULT_CONFIG.rarities[r], ...(data.rarities?.[r] ?? {}) }
  }

  return {
    spinner: { ...DEFAULT_CONFIG.spinner, ...(data.spinner ?? {}) },
    spinSpeeds,
    rarities,
    specials: Array.isArray(data.specials) ? data.specials : DEFAULT_CONFIG.specials,
  }
}

/** Fetch `config.json` and populate the `config` store. Falls back silently. */
export async function loadConfig(): Promise<void> {
  try {
    const res = await fetch(`/config.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as Partial<AppConfig>
    config.set(mergeConfig(data))
  } catch (e) {
    console.warn('[config] config.json could not be loaded; using built-in defaults.', e)
    config.set(DEFAULT_CONFIG)
  }
}
