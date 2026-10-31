import { afterEach, expect, test, vi } from 'vitest'
import { loadVisited, saveVisited } from '../../src/lib/visited'

afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

test('round-trips visited ids', () => {
  saveVisited(['B01', 'B04'])
  expect(loadVisited()).toEqual(['B01', 'B04'])
})

test('Review Focus 5: blocked storage returns [] and never throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  expect(loadVisited()).toEqual([])
  expect(() => saveVisited(['B01'])).not.toThrow()
})

test('garbage in storage is ignored', () => {
  localStorage.setItem('many-masks:visited', '{not json')
  expect(loadVisited()).toEqual([])
  localStorage.setItem('many-masks:visited', JSON.stringify(['B01', 'B99', 7]))
  expect(loadVisited()).toEqual(['B01'])
})
