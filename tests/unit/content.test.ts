import { describe, expect, test } from 'vitest'
import { all as mediaList } from '../../../scripts/media-list.mjs'
import { buildingById, buildings } from '../../src/data/buildings'
import { links } from '../../src/data/links'
import { openingBeats } from '../../src/data/opening'

describe('buildings', () => {
  test('13 buildings with unique ids, B13 is the finale', () => {
    expect(buildings).toHaveLength(13)
    expect(new Set(buildings.map((b) => b.id)).size).toBe(13)
    expect(buildingById('B13').district).toBe('finale')
  })

  test('every hotspot is a polygon inside the image', () => {
    for (const b of buildings) {
      expect(b.hotspot.length, b.id).toBeGreaterThanOrEqual(3)
      for (const [x, y] of b.hotspot) {
        expect(x, b.id).toBeGreaterThanOrEqual(0)
        expect(x, b.id).toBeLessThanOrEqual(100)
        expect(y, b.id).toBeGreaterThanOrEqual(0)
        expect(y, b.id).toBeLessThanOrEqual(100)
      }
    }
  })

  test('every must-have building except the finale has a swing clip', () => {
    for (const b of buildings.filter((b) => b.priority === 'M' && b.id !== 'B13')) expect(b.clip, b.id).toBeTruthy()
  })

  test('must-have set matches the spec', () => {
    expect(buildings.filter((b) => b.priority === 'M').map((b) => b.id)).toEqual(['B01', 'B02', 'B04', 'B07', 'B08', 'B12', 'B13'])
  })

  test('every media path a building uses is in the media list', () => {
    for (const b of buildings) {
      for (const p of [b.clip, b.landing, b.panel, b.voice].filter(Boolean)) expect(mediaList, `${b.id} ${p}`).toContain(p)
    }
  })

  test('CET uses the corrected paid count', () => {
    expect(JSON.stringify(buildingById('B01'))).toContain('30 to 35')
  })

  test('no forbidden names or wrong claims anywhere in the content', () => {
    const text = JSON.stringify({ buildings, links, openingBeats })
    expect(text).not.toMatch(/150\+ paying|marvel|spider|ifec|ufound|grr baow/i)
  })
})

describe('opening beats', () => {
  test('ordered, non-overlapping, covering 0 to 1', () => {
    expect(openingBeats[0].from).toBe(0)
    expect(openingBeats.at(-1)!.to).toBe(1)
    for (let i = 1; i < openingBeats.length; i++) expect(openingBeats[i].from).toBe(openingBeats[i - 1].to)
    expect(openingBeats.map((b) => b.text)).toContain('98.3 percentile, MHT CET')
  })
})

describe('links', () => {
  test('contact email is the gmail address', () => {
    expect(links.email).toBe('ritwikmukherjee08@gmail.com')
  })
})
