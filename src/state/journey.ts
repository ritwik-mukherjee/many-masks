import type { BuildingId } from '../data/buildings'

export type Phase = 'loading' | 'intro' | 'opening' | 'hub' | 'swinging' | 'freezing' | 'panel' | 'finale'
export type FinaleStep = 'swing' | 'face' | 'unmasking' | 'reveal' | 'growth'

export interface JourneyState {
  phase: Phase
  current: BuildingId | null
  finale: FinaleStep | null
  visited: BuildingId[]
}

export type JourneyAction =
  | { type: 'START' }
  | { type: 'INTRO_DONE' }
  | { type: 'OPENING_DONE' }
  | { type: 'SKIP_INTRO' }
  | { type: 'CLICK_BUILDING'; id: BuildingId }
  | { type: 'SWING_ENDED' }
  | { type: 'FREEZE_DONE' }
  | { type: 'BACK_TO_CITY' }
  | { type: 'FINALE_NEXT' }
  | { type: 'UNMASK' }

export const initialJourney: JourneyState = { phase: 'loading', current: null, finale: null, visited: [] }

const FINALE_ORDER: Partial<Record<FinaleStep, FinaleStep>> = { swing: 'face', unmasking: 'reveal', reveal: 'growth' }

export function journey(s: JourneyState, a: JourneyAction): JourneyState {
  switch (a.type) {
    case 'START':
      return s.phase === 'loading' ? { ...s, phase: 'intro' } : s
    case 'INTRO_DONE':
      return s.phase === 'intro' ? { ...s, phase: 'opening' } : s
    case 'OPENING_DONE':
      return s.phase === 'opening' ? { ...s, phase: 'hub' } : s
    case 'SKIP_INTRO':
      return s.phase === 'intro' || s.phase === 'opening' ? { ...s, phase: 'hub' } : s
    case 'CLICK_BUILDING':
      if (s.phase !== 'hub' && s.phase !== 'panel') return s
      return a.id === 'B13'
        ? { ...s, phase: 'finale', finale: 'swing', current: 'B13' }
        : { ...s, phase: 'swinging', current: a.id }
    case 'SWING_ENDED':
      return s.phase === 'swinging' ? { ...s, phase: 'freezing' } : s
    case 'FREEZE_DONE':
      if (s.phase !== 'freezing' || !s.current) return s
      return { ...s, phase: 'panel', visited: s.visited.includes(s.current) ? s.visited : [...s.visited, s.current] }
    case 'BACK_TO_CITY':
      if (s.phase === 'panel') return { ...s, phase: 'hub', current: null }
      if (s.phase === 'finale' && s.finale === 'growth') {
        return { ...s, phase: 'hub', current: null, finale: null, visited: s.visited.includes('B13') ? s.visited : [...s.visited, 'B13'] }
      }
      return s
    case 'FINALE_NEXT': {
      const next = s.phase === 'finale' && s.finale ? FINALE_ORDER[s.finale] : undefined
      return next ? { ...s, finale: next } : s
    }
    case 'UNMASK':
      return s.phase === 'finale' && s.finale === 'face' ? { ...s, finale: 'unmasking' } : s
  }
}
