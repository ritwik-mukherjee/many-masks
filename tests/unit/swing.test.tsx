import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import SwingPlayer from '../../src/components/SwingPlayer'
import { buildingById } from '../../src/data/buildings'

const cet = buildingById('B01')
const shared = buildingById('B05')
const noClip = { ...buildingById('B03'), clip: undefined }

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('SwingPlayer', () => {
  test('the chapters left on the two shared clips split evenly between them', () => {
    const clips = (['B05', 'B06', 'B09', 'B11'] as const).map((id) => buildingById(id).clip)
    expect(clips.filter((c) => c === 'vid/swing-a.mp4')).toHaveLength(2)
    expect(clips.filter((c) => c === 'vid/swing-b.mp4')).toHaveLength(2)
  })

  test.each([['B01', 'V01'], ['B02', 'V02'], ['B03', 'V03'], ['B04', 'V04'], ['B07', 'V07'], ['B08', 'V08'], ['B10', 'V10'], ['B12', 'V12']] as const)('%s plays its own swing and freezes on its last frame', (id, clip) => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={buildingById(id)} onEnded={onEnded} reducedMotion={false} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toContain(`vid/${clip}.mp4`)
    fireEvent.canPlay(video)
    fireEvent.ended(video)
    expect(onEnded).toHaveBeenCalledTimes(1)
    expect(container.querySelector('img.swing__landing')).toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('a building on a shared clip plays it muted with CORS, lands on its still and ends once', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={shared} onEnded={onEnded} reducedMotion={false} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toContain('vid/swing-a.mp4')
    expect(video.getAttribute('crossorigin')).toBe('anonymous')
    expect(video.muted).toBe(true)
    fireEvent.canPlay(video)
    fireEvent.ended(video)
    fireEvent.ended(video)
    fireEvent.load(container.querySelector('img.swing__landing')!)
    act(() => vi.advanceTimersByTime(10_000))
    expect(onEnded).toHaveBeenCalledTimes(1)
    expect(container.querySelector('canvas[data-last-frame]')).not.toBeNull()
  })

  test('without a clip it pushes in on the hub, shows the landing frame, then ends', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={noClip} onEnded={onEnded} reducedMotion={false} />)
    expect(container.querySelector('video')).toBeNull()
    act(() => vi.advanceTimersByTime(1200))
    const landing = container.querySelector('img[src*="img/K03.jpg"]')
    expect(landing).not.toBeNull()
    expect(onEnded).not.toHaveBeenCalled()
    fireEvent.load(landing!)
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('Review Focus 1: a video error falls back to the push-in and still ends once', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={cet} onEnded={onEnded} reducedMotion={false} />)
    fireEvent.error(container.querySelector('video')!)
    expect(container.querySelector('video')).toBeNull()
    act(() => vi.advanceTimersByTime(1200))
    act(() => vi.advanceTimersByTime(5000))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('Review Focus 1: no canplay within 4 s falls back and still ends once', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={cet} onEnded={onEnded} reducedMotion={false} />)
    act(() => vi.advanceTimersByTime(4000))
    expect(container.querySelector('video')).toBeNull()
    act(() => vi.advanceTimersByTime(1200))
    act(() => vi.advanceTimersByTime(5000))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('reduced motion cuts straight to the landing frame', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={cet} onEnded={onEnded} reducedMotion />)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img[src*="img/K01.jpg"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(300))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })
})
