/**
 * The seven human capabilities Brain Benchmark measures.
 *
 * Keys are kept stable because they are persisted in analytics and used by the
 * progress radar; labels and descriptions are the user-facing taxonomy.
 */
export type DomainKey =
  | 'motor'
  | 'memory'
  | 'cognitive'
  | 'perception'
  | 'puzzles'
  | 'computation'
  | 'linguistic'

export interface Domain {
  key: DomainKey
  label: string
  /** One-line description of the capability */
  tagline: string
  /** Hex color used for dots, bars and the radar */
  color: string
}

export const DOMAINS: Domain[] = [
  {
    key: 'motor',
    label: 'Speed',
    tagline: 'How fast your nervous system turns a signal into action.',
    color: '#ff5a36',
  },
  {
    key: 'memory',
    label: 'Memory',
    tagline: 'How much you can hold in mind, and for how long.',
    color: '#8b5cf6',
  },
  {
    key: 'cognitive',
    label: 'Attention',
    tagline: 'Staying on target when everything else competes for focus.',
    color: '#f2a900',
  },
  {
    key: 'perception',
    label: 'Perception',
    tagline: 'The resolution of your senses — color, time and change.',
    color: '#ec4899',
  },
  {
    key: 'puzzles',
    label: 'Reasoning',
    tagline: 'Spatial and logical problem solving under the clock.',
    color: '#10b981',
  },
  {
    key: 'computation',
    label: 'Numeracy',
    tagline: 'Fluency and speed with numbers, equations and shapes.',
    color: '#0ea5e9',
  },
  {
    key: 'linguistic',
    label: 'Language',
    tagline: 'Reading, spelling and producing words at speed.',
    color: '#14b8a6',
  },
]

export const DOMAIN_BY_KEY: Record<DomainKey, Domain> = DOMAINS.reduce(
  (acc, d) => {
    acc[d.key] = d
    return acc
  },
  {} as Record<DomainKey, Domain>
)

export function getDomain(key: string): Domain {
  return DOMAIN_BY_KEY[key as DomainKey] ?? DOMAINS[0]
}
