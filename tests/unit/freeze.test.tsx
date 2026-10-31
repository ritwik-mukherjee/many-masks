import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ComicFreeze from '../../src/components/ComicFreeze'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const source = () => document.createElement('canvas')

test('without WebGL it falls back to a CSS ink effect and finishes within 1400 ms', () => {
  const onDone = vi.fn()
  const { container } = render(<ComicFreeze source={source()} panelSrc="img/P01.jpg" onDone={onDone} reducedMotion={false} />)
  expect(container.querySelector('.freeze--css')).not.toBeNull()
  act(() => vi.advanceTimersByTime(1399))
  expect(onDone).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(1))
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(container.querySelector('img[src*="img/P01.jpg"]')).not.toBeNull()
})

test('a WebGL setup failure (e.g. shader compile error) falls back to the CSS ink, never a black canvas', () => {
  const brokenGl = new Proxy({}, { get: () => () => { throw new Error('shader compile failed') } })
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(((type: string) => (type === 'webgl' ? brokenGl : null)) as never)
  const onDone = vi.fn()
  const { container } = render(<ComicFreeze source={source()} panelSrc="img/P01.jpg" onDone={onDone} reducedMotion={false} />)
  expect(container.querySelector('.freeze--css')).not.toBeNull()
  expect(container.querySelector('.freeze__canvas.is-inked')).not.toBeNull()
  act(() => vi.advanceTimersByTime(1400))
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('reduced motion crossfades straight to the panel within 450 ms', () => {
  const onDone = vi.fn()
  render(<ComicFreeze source={source()} panelSrc="img/P01.jpg" onDone={onDone} reducedMotion />)
  act(() => vi.advanceTimersByTime(450))
  expect(onDone).toHaveBeenCalledTimes(1)
})
