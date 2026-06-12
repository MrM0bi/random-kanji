export interface Source {
  id: string
  label: string
  url: string
}

/**
 * Statically configured deck sources. Today there is a single Heisig (German)
 * deck; adding more is just another entry here — no structural change needed.
 * `import.meta.env.BASE_URL` keeps it working when hosted under a sub-path.
 */
export const SOURCES: Source[] = [
  {
    id: 'heisig1-de',
    label: 'Heisig 1',
    url: `${import.meta.env.BASE_URL}kanji.json`,
  },
]

export const DEFAULT_SOURCE_ID = SOURCES[0].id

export function sourceById(id: string): Source {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0]
}
