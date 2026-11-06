import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import SwingPlayer from '../../src/components/SwingPlayer'
import { buildingById, type BuildingId } from '../../src/data/buildings'

const cet = buildingById('B01')
const stillLanding = { ...buildingById('B05'), landsOnClip: false }
const chapters = (['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const).map((n) => [`B${n}` as BuildingId, `V${n}`] as const)
const noClip = { ...buildingById('B03'), clip: undefined }

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('SwingPlayer', () => {
  test.each(chapters)('%s plays its own swing and freezes on its last frame', (id, clip) => {
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

  test('a clip that does not land on its own frame plays muted with CORS, lands on its still and ends once', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={stillLanding} onEnded={onEnded} reducedMotion={false} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toContain('vid/V05.mp4')
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
