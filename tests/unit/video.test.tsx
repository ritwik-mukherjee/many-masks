import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import Finale from '../../src/components/Finale'
import Hub from '../../src/components/Hub'
import ManagedVideo from '../../src/components/ManagedVideo'
import type { Audio } from '../../src/lib/audio'
import { createWarmer, releaseVideo } from '../../src/lib/video'
import { initialJourney, type FinaleStep } from '../../src/state/journey'

let play: ReturnType<typeof vi.spyOn>
let load: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), voiceClock: vi.fn(() => null), toggleVoice: vi.fn(), ambient: vi.fn(), dispose: vi.fn() })
const at = (finale: FinaleStep) => ({ ...initialJourney, phase: 'finale' as const, current: 'B13' as const, finale })

describe('releaseVideo', () => {
  test('stops the download, not just the picture', () => {
    const v = document.createElement('video')
    v.src = 'a.mp4'
    releaseVideo(v)
    expect(v.hasAttribute('src')).toBe(false)
    expect(load).toHaveBeenCalled()
  })
})

describe('ManagedVideo', () => {
  test('leaving the screen stops its download', () => {
    const { container, unmount } = render(<ManagedVideo src="a.mp4" muted />)
    const v = container.querySelector('video')!
    expect(v.getAttribute('src')).toBe('a.mp4')
    unmount()
    expect(v.hasAttribute('src')).toBe(false)
    expect(load).toHaveBeenCalled()
  })

  test('with autoStart it plays as soon as it can, rather than waiting for Chrome to buffer more', () => {
    const { container } = render(<ManagedVideo src="a.mp4" muted autoStart />)
    fireEvent.canPlay(container.querySelector('video')!)
    expect(play).toHaveBeenCalled()
  })

  test('without autoStart it leaves playback to its owner', () => {
    const { container } = render(<ManagedVideo src="a.mp4" muted />)
    fireEvent.canPlay(container.querySelector('video')!)
    expect(play).not.toHaveBeenCalled()
  })
})

describe('createWarmer', () => {
  test('warms one clip at a time, and repeating the same one does nothing', () => {
    const warmer = createWarmer()
    const a = warmer.warm('a.mp4')!
    expect(a.preload).toBe('auto')
    expect(warmer.warm('a.mp4')).toBe(a)
    const b = warmer.warm('b.mp4')!
    expect(b).not.toBe(a)
    expect(a.hasAttribute('src')).toBe(false)
    expect(b.getAttribute('src')).toBe('b.mp4')
  })

  test('release stops whatever is warming', () => {
    const warmer = createWarmer()
    const a = warmer.warm('a.mp4')!
    warmer.release()
    expect(a.hasAttribute('src')).toBe(false)
  })
})

describe('the site warms only what comes next', () => {
  test('hovering a second building stops loading the first', () => {
    const made = vi.spyOn(document, 'createElement')
    render(<Hub dispatch={vi.fn()} visited={[]} />)
    const spots = within(screen.getByTestId('hotspots'))
    const videos = () => made.mock.results.filter((r) => (r.value as Element).tagName === 'VIDEO').map((r) => r.value as HTMLVideoElement)
    fireEvent.mouseEnter(spots.getByRole('button', { name: 'Velnora' }))
    fireEvent.mouseEnter(spots.getByRole('button', { name: 'Palo' }))
    const [first, second] = videos().slice(-2)
    expect(first.hasAttribute('src')).toBe(false)
    expect(second.getAttribute('src')).toContain('vid/V04.mp4')
  })

  test('leaving the city stops the warm-up', () => {
    const made = vi.spyOn(document, 'createElement')
    const { unmount } = render(<Hub dispatch={vi.fn()} visited={[]} />)
    fireEvent.mouseEnter(within(screen.getByTestId('hotspots')).getByRole('button', { name: 'Palo' }))
    const warmed = made.mock.results.map((r) => r.value as Element).filter((e) => e.tagName === 'VIDEO').at(-1) as HTMLVideoElement
    unmount()
    expect(warmed.hasAttribute('src')).toBe(false)
  })

  test('at the mask it loads the pull-off, and during the pull-off it loads his clip', () => {
    const made = vi.spyOn(document, 'createElement')
    const warmedSrcs = () => made.mock.results.map((r) => r.value as Element).filter((e) => e.tagName === 'VIDEO').map((e) => (e as HTMLVideoElement).getAttribute('src'))
    const { rerender } = render(<Finale state={at('face')} dispatch={vi.fn()} audio={fakeAudio()} />)
    const atMask = warmedSrcs().filter(Boolean)
    expect(atMask).toHaveLength(1)
    expect(atMask[0]).toContain('vid/F03.mp4')
    rerender(<Finale state={at('unmasking')} dispatch={vi.fn()} audio={fakeAudio()} />)
    expect(warmedSrcs().filter((s) => s?.includes('vid/raw.mp4'))).toHaveLength(1)
  })
})
