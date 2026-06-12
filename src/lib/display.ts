import type { KanjiEntry, Version } from './types'

const EMPTY_VERSION: Version = { meanings: [], primitives: [], mnemonic: [] }

/** Resolve the requested language version, falling back to the first available. */
export function versionOf(entry: KanjiEntry, lang: string): Version {
  return entry.versions[lang] ?? Object.values(entry.versions)[0] ?? EMPTY_VERSION
}

export function meaningText(entry: KanjiEntry, lang: string): string {
  return versionOf(entry, lang).meanings.join(', ')
}

export function primitivesText(entry: KanjiEntry, lang: string): string {
  return versionOf(entry, lang).primitives.join(', ')
}

/** Display order for JLPT chips (easiest -> hardest, then "no level"). */
export const JLPT_ORDER = ['5', '4', '3', '2', '1', '0']

export const JLPT_LABELS: Record<string, string> = {
  '5': 'N5',
  '4': 'N4',
  '3': 'N3',
  '2': 'N2',
  '1': 'N1',
  '0': '—',
}

export function jlptLabel(level: string): string {
  return JLPT_LABELS[level] ?? level
}

export const LANG_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
}

export function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code.toUpperCase()
}

/** Link to look the kanji up on the Jisho online dictionary. */
export function jishoUrl(kanji: string): string {
  return `https://jisho.org/search/${encodeURIComponent(`${kanji} #kanji`)}`
}
