import { act, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../../src/App'
import ComicFreeze from '../../src/components/ComicFreeze'
import Finale from '../../src/components/Finale'
import HowBuilt from '../../src/components/HowBuilt'
import Hub from '../../src/components/Hub'
import Opening, { Intro } from '../../src/components/Opening'
import SwingPlayer from '../../src/components/SwingPlayer'
import { buildingById } from '../../src/data/buildings'
import { rooftopDetails } from '../../src/data/links'
import { createAudio, type Audio } from '../../src/lib/audio'
import { shouldSeek } from '../../src/lib/scrub'
import { initialJourney } from '../../src/state/journey'

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), voiceClock: vi.fn(() => null), toggleVoice: vi.fn(), ambient: vi.fn(), dispose: vi.fn() })

describe('Critical 1: the push-in never freezes on an unloaded (black) landing frame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('waits for the landing image to load before ending', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={{ ...buildingById('B03'), clip: undefined }} onEnded={onEnded} reducedMotion={false} />)
    act(() => vi.advanceTimersByTime(1200))
    expect(onEnded).not.toHaveBeenCalled()
    fireEvent.load(container.querySelector('img.swing__landing')!)
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('a landing image that fails or never loads still ends once', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={{ ...buildingById('B03'), clip: undefined }} onEnded={onEnded} reducedMotion={false} />)
    act(() => vi.advanceTimersByTime(1200))
    fireEvent.error(container.querySelector('img.swing__landing')!)
    act(() => vi.advanceTimersByTime(5000))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('ComicFreeze skips the ink on a blank source and goes straight to the panel', () => {
    const blank = { getImageData: () => ({ data: new Uint8ClampedArray(64 * 4) }) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((t: string) => (t === '2d' ? blank : null)) as never)
    const onDone = vi.fn()
    const { container } = render(<ComicFreeze source={document.createElement('canvas')} panelSrc="img/P03.jpg" onDone={onDone} reducedMotion={false} />)
    expect(container.querySelector('.freeze__panel.is-on')).not.toBeNull()
    act(() => vi.advanceTimersByTime(450))
    expect(onDone).toHaveBeenCalledTimes(1)
    vi.restoreAllMocks()
  })
})

describe('Important 2 and 9: swings cannot hang, and a ready clip is not cut', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  test('a clip that stalls after canplay still ends by duration + 2 s', () => {
    const onEnded = vi.fn()
    const { container } = render(<SwingPlayer building={buildingById('B01')} onEnded={onEnded} reducedMotion={false} />)
    const v = container.querySelector('video')!
    Object.defineProperty(v, 'duration', { value: 5, configurable: true })
    fireEvent.loadedMetadata(v)
    fireEvent.canPlay(v)
    act(() => vi.advanceTimersByTime(7000))
    act(() => vi.advanceTimersByTime(3000))
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  test('a clip already playable before the watchdog attaches is not cut at 4 s', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
    const { container } = render(<SwingPlayer building={buildingById('B01')} onEnded={vi.fn()} reducedMotion={false} />)
    act(() => vi.advanceTimersByTime(4000))
    expect(container.querySelector('video')).not.toBeNull()
  })
})

describe('Important 3: the opening scrub does not seek when idle', () => {
  test('no seek while a seek is in flight', () => expect(shouldSeek(1, 2, true)).toBe(false))
  test('no seek for less than one frame of change', () => expect(shouldSeek(1, 1.01, false)).toBe(false))
  test('seeks for a real change', () => expect(shouldSeek(1, 1.5, false)).toBe(true))
})

describe('Important 4: no black screens while video loads', () => {
  test('intro, opening and finale videos have posters', () => {
    const intro = render(<Intro dispatch={vi.fn()} reducedMotion={false} />)
    expect(intro.container.querySelector('video')!.getAttribute('poster')).toContain('img/O01.jpg')
    intro.unmount()
    const opening = render(<Opening dispatch={vi.fn()} audio={fakeAudio()} reducedMotion={false} />)
    expect(opening.container.querySelector('video')!.getAttribute('poster')).toContain('img/O03.jpg')
    opening.unmount()
    const at = (finale: 'swing' | 'unmasking') => ({ ...initialJourney, phase: 'finale' as const, current: 'B13' as const, finale })
    const f1 = render(<Finale state={at('swing')} dispatch={vi.fn()} audio={fakeAudio()} />)
    expect(f1.container.querySelector('video')!.getAttribute('poster')).toContain('img/O03.jpg')
    f1.unmount()
    const f4 = render(<Finale state={at('unmasking')} dispatch={vi.fn()} audio={fakeAudio()} />)
    expect(f4.container.querySelector('video')!.getAttribute('poster')).toContain('img/F02.jpg')
  })
})

describe('Important 5: resizing does not wipe the journey; audio is disposed', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  test('narrowing a laptop window keeps the experience', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(pointer: fine)', addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal('innerWidth', 1440)
    render(<App />)
    expect(screen.queryByText('Best on laptop')).toBeNull()
    vi.stubGlobal('innerWidth', 850)
    act(() => { dispatchEvent(new Event('resize')) })
    expect(screen.queryByText('Best on laptop')).toBeNull()
  })

  test('dispose pauses ambience loops', () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const a = createAudio()
    a.unlock()
    a.ambient('city', 0.3)
    a.dispose()
    expect(pause).toHaveBeenCalled()
  })
})

describe('Important 6: reduced motion still shows the rooftop details', () => {
  test('a static list replaces the ticker', () => {
    render(<Hub dispatch={vi.fn()} visited={[]} reducedMotion />)
    for (const d of rooftopDetails) expect(screen.getByText(d)).toBeInTheDocument()
  })
})

describe('Important 7 and 20: copy stays within the facts', () => {
  test('HollrAI says intern and nothing beyond the allowed public detail', () => {
    const b = buildingById('B11')
    expect(JSON.stringify(b)).not.toMatch(/live client delivery/i)
    expect(b.transcript).toMatch(/engineer intern/)
  })
  test('How this was built does not claim Ritwik wrote the prompts', () => {
    render(<HowBuilt onClose={vi.fn()} />)
    const text = screen.getByRole('dialog').textContent ?? ''
    expect(text).not.toMatch(/prompts I wrote/i)
    // The asset prompts were pasted into image and video tools, so only Ritwik's own instructions were spoken.
    expect(text).not.toMatch(/every prompt/i)
  })
})

describe('Important 15: re-delivered media is not stuck in caches', () => {
  test('the media host does not mark files immutable', () => {
    const cfg = fs.readFileSync(path.resolve(__dirname, '../../../media/vercel.json'), 'utf8')
    expect(cfg).not.toMatch(/immutable/)
  })
})
