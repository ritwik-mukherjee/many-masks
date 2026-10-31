import { afterEach, expect, test, vi } from 'vitest'
import { media } from '../../src/lib/media'

afterEach(() => vi.unstubAllEnvs())

test('joins a base with a trailing slash', () => {
  vi.stubEnv('VITE_MEDIA_BASE', 'http://x/')
  expect(media('vid/V01.mp4')).toBe('http://x/vid/V01.mp4')
})

test('joins a base without a trailing slash', () => {
  vi.stubEnv('VITE_MEDIA_BASE', 'http://x')
  expect(media('vid/V01.mp4')).toBe('http://x/vid/V01.mp4')
})

test('drops a leading slash on the path', () => {
  vi.stubEnv('VITE_MEDIA_BASE', 'http://x')
  expect(media('/img/H01.jpg')).toBe('http://x/img/H01.jpg')
})
