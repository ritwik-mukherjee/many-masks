import { describe, expect, test } from 'vitest'
import { initialJourney, journey, type JourneyState } from '../../src/state/journey'

const at = (over: Partial<JourneyState>): JourneyState => ({ ...initialJourney, ...over })

describe('journey', () => {
  test('starts in loading', () => {
    expect(initialJourney).toEqual({ phase: 'loading', current: null, finale: null, visited: [] })
  })
  test('START moves loading to intro', () => {
    expect(journey(at({ phase: 'loading' }), { type: 'START' }).phase).toBe('intro')
  })
  test('INTRO_DONE moves intro to opening', () => {
    expect(journey(at({ phase: 'intro' }), { type: 'INTRO_DONE' }).phase).toBe('opening')
  })
  test('OPENING_DONE moves opening to hub', () => {
    expect(journey(at({ phase: 'opening' }), { type: 'OPENING_DONE' }).phase).toBe('hub')
  })
  test('SKIP_INTRO jumps to hub from intro and opening', () => {
    expect(journey(at({ phase: 'intro' }), { type: 'SKIP_INTRO' }).phase).toBe('hub')
    expect(journey(at({ phase: 'opening' }), { type: 'SKIP_INTRO' }).phase).toBe('hub')
  })
  test('CLICK_BUILDING from hub starts a swing', () => {
    expect(journey(at({ phase: 'hub' }), { type: 'CLICK_BUILDING', id: 'B01' })).toMatchObject({ phase: 'swinging', current: 'B01' })
  })
  test('SWING_ENDED freezes, FREEZE_DONE opens the panel and records the visit once', () => {
    let s = journey(at({ phase: 'swinging', current: 'B01' }), { type: 'SWING_ENDED' })
    expect(s.phase).toBe('freezing')
    s = journey(s, { type: 'FREEZE_DONE' })
    expect(s).toMatchObject({ phase: 'panel', current: 'B01', visited: ['B01'] })
    const again = journey(at({ phase: 'freezing', current: 'B01', visited: ['B01'] }), { type: 'FREEZE_DONE' })
    expect(again.visited).toEqual(['B01'])
  })
  test('BACK_TO_CITY returns to hub and clears current', () => {
    expect(journey(at({ phase: 'panel', current: 'B01' }), { type: 'BACK_TO_CITY' })).toMatchObject({ phase: 'hub', current: null })
  })
  test('BACK_TO_CITY from the growth page returns to the hub and marks Wispr visited', () => {
    const s = journey(at({ phase: 'finale', finale: 'growth', current: 'B13', visited: ['B01'] }), { type: 'BACK_TO_CITY' })
    expect(s).toEqual({ phase: 'hub', current: null, finale: null, visited: ['B01', 'B13'] })
  })
  test('BACK_TO_CITY is ignored in the middle of the finale', () => {
    const face = at({ phase: 'finale', finale: 'face', current: 'B13' })
    expect(journey(face, { type: 'BACK_TO_CITY' })).toBe(face)
  })
  test('CLICK_BUILDING from a panel swings to the next building', () => {
    expect(journey(at({ phase: 'panel', current: 'B01' }), { type: 'CLICK_BUILDING', id: 'B02' })).toMatchObject({ phase: 'swinging', current: 'B02' })
  })
  test('CLICK_BUILDING B13 starts the finale', () => {
    expect(journey(at({ phase: 'hub' }), { type: 'CLICK_BUILDING', id: 'B13' })).toMatchObject({ phase: 'finale', finale: 'swing', current: 'B13' })
  })
  test('finale steps: swing, face, unmasking, reveal, growth', () => {
    let s = at({ phase: 'finale', finale: 'swing', current: 'B13' })
    s = journey(s, { type: 'FINALE_NEXT' })
    expect(s.finale).toBe('face')
    s = journey(s, { type: 'UNMASK' })
    expect(s.finale).toBe('unmasking')
    s = journey(s, { type: 'FINALE_NEXT' })
    expect(s.finale).toBe('reveal')
    s = journey(s, { type: 'FINALE_NEXT' })
    expect(s.finale).toBe('growth')
  })
  test('Review Focus 3: clicks during a swing or freeze are ignored', () => {
    const swinging = at({ phase: 'swinging', current: 'B01' })
    const freezing = at({ phase: 'freezing', current: 'B01' })
    expect(journey(swinging, { type: 'CLICK_BUILDING', id: 'B02' })).toBe(swinging)
    expect(journey(freezing, { type: 'CLICK_BUILDING', id: 'B02' })).toBe(freezing)
  })
  test('FINALE_NEXT during face is ignored, only UNMASK advances', () => {
    const face = at({ phase: 'finale', finale: 'face', current: 'B13' })
    expect(journey(face, { type: 'FINALE_NEXT' })).toBe(face)
  })
  test('unlisted actions return the same state', () => {
    const hub = at({ phase: 'hub' })
    expect(journey(hub, { type: 'SWING_ENDED' })).toBe(hub)
    expect(journey(hub, { type: 'UNMASK' })).toBe(hub)
    const loading = at({ phase: 'loading' })
    expect(journey(loading, { type: 'CLICK_BUILDING', id: 'B01' })).toBe(loading)
  })
})
