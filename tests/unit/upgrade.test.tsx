import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import Growth from '../../src/components/Growth'
import Mark from '../../src/components/Mark'
import Panel from '../../src/components/Panel'
import VoicePill, { captionChunks } from '../../src/components/VoicePill'
import { buildingById, buildings, nextStop } from '../../src/data/buildings'
import { growth } from '../../src/data/growth'
import { links } from '../../src/data/links'
import { marks } from '../../src/data/marks'
import { originTranscript } from '../../src/data/opening'
import timings from '../../src/data/voiceTimings.json'
import { createAudio, type Audio } from '../../src/lib/audio'

const fakeAudio = (clock: ReturnType<Audio['voiceClock']> = null): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), voiceClock: vi.fn(() => clock), toggleVoice: vi.fn(), ambient: vi.fn(), dispose: vi.fn() })
const clockAt = (time: number, over = {}) => ({ time, duration: 30, paused: false, ended: false, failed: false, ...over })

describe('voice timings', () => {
  const lines = { ...Object.fromEntries(buildings.filter((b) => b.id !== 'B13').map((b) => [b.voice.match(/A-[A-Z0-9]+/)![0], b.transcript])), 'A-P00': originTranscript }

  test.each(Object.entries(lines))('%s has one rising time for every word on screen', (name, text) => {
    const t = (timings as Record<string, number[]>)[name]
    expect(t).toHaveLength(text.split(/\s+/).length)
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1])
  })
})

describe('captionChunks', () => {
  test('never loses a word and keeps caption lines short', () => {
    const text = buildingById('B04').transcript
    const chunks = captionChunks(text.split(/\s+/))
    expect(chunks.flat().join(' ')).toBe(text.split(/\s+/).join(' '))
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(13)
  })
  test('breaks after a full stop', () => {
    expect(captionChunks('One two three. Four five.'.split(' '))).toEqual([['One', 'two', 'three.'], ['Four', 'five.']])
  })
})

describe('VoicePill', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const text = buildingById('B03').transcript
  const words = text.split(/\s+/)
  const t = (timings as Record<string, number[]>)['A-B03']

  test('shows the phrase being spoken, with the words said so far marked', () => {
    const audio = fakeAudio(clockAt(t[2] + 0.01))
    const { container } = render(<VoicePill name="A-B03" text={text} audio={audio} />)
    act(() => vi.advanceTimersByTime(100))
    const said = [...container.querySelectorAll('.voicepill__words .is-said')].map((e) => e.textContent!.trim())
    expect(said).toEqual(words.slice(0, 3))
  })

  test('the caption moves on with the voice', () => {
    const audio = fakeAudio(clockAt(0))
    const { container, rerender } = render(<VoicePill name="A-B03" text={text} audio={audio} />)
    act(() => vi.advanceTimersByTime(100))
    const first = container.querySelector('.voicepill__words')!.textContent
    vi.mocked(audio.voiceClock).mockReturnValue(clockAt(t[t.length - 1]))
    rerender(<VoicePill name="A-B03" text={text} audio={audio} />)
    act(() => vi.advanceTimersByTime(100))
    expect(container.querySelector('.voicepill__words')!.textContent).not.toBe(first)
  })

  test('the button pauses and plays', () => {
    const audio = fakeAudio(clockAt(1))
    render(<VoicePill name="A-B03" text={text} audio={audio} />)
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(audio.toggleVoice).toHaveBeenCalled()
  })

  test.each([
    ['fails to load', clockAt(0, { failed: true }), 100],
    ['never starts, as when autoplay is refused', clockAt(0, { paused: true }), 2600],
  ])('reports when the voice %s, so the words can be shown another way', (_n, clock, wait) => {
    const onUnavailable = vi.fn()
    render(<VoicePill name="A-B03" text={text} audio={fakeAudio(clock)} onUnavailable={onUnavailable} />)
    act(() => vi.advanceTimersByTime(wait))
    expect(onUnavailable).toHaveBeenCalledTimes(1)
  })

  test('a slow start is not mistaken for a failure', () => {
    const onUnavailable = vi.fn()
    render(<VoicePill name="A-B03" text={text} audio={fakeAudio(clockAt(0.5))} onUnavailable={onUnavailable} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(onUnavailable).not.toHaveBeenCalled()
  })
})

describe('audio clock', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  test('reports nothing with no voice playing, and the line once one is', () => {
    const a = createAudio()
    a.unlock()
    expect(a.voiceClock()).toBeNull()
    a.voice('aud/A-B01.mp3')
    expect(a.voiceClock()).toMatchObject({ time: 0, failed: false })
    a.stopVoice()
    expect(a.voiceClock()).toBeNull()
  })

  test('toggleVoice with nothing playing does nothing', () => {
    expect(() => createAudio().toggleVoice()).not.toThrow()
  })
})

describe('Panel', () => {
  test('marks show only what the chapter used, by name', () => {
    const { container } = render(<Panel building={buildingById('B09')} onBack={vi.fn()} audio={fakeAudio()} />)
    expect([...container.querySelectorAll('.panel__marks li')].map((li) => li.textContent!.trim())).toEqual(['NVIDIA', 'PyTorch', 'ONNX'])
  })

  test('chapters with no known tool show no marks', () => {
    const { container } = render(<Panel building={buildingById('B02')} onBack={vi.fn()} audio={fakeAudio()} />)
    expect(container.querySelector('.panel__marks')).toBeNull()
  })

  test('offers the next stop', () => {
    const onNext = vi.fn()
    render(<Panel building={buildingById('B01')} next={buildingById('B02')} onNext={onNext} onBack={vi.fn()} audio={fakeAudio()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Velnora' }))
    expect(onNext).toHaveBeenCalledWith('B02')
  })

  test('the full transcript is folded away, and opens if the voice cannot play', () => {
    vi.useFakeTimers()
    const b = buildingById('B01')
    const { container } = render(<Panel building={b} onBack={vi.fn()} audio={fakeAudio(clockAt(0, { failed: true }))} />)
    const details = container.querySelector('details')!
    expect(details.textContent).toContain(b.transcript)
    expect(details.open).toBe(false)
    act(() => vi.advanceTimersByTime(100))
    expect(details.open).toBe(true)
    vi.useRealTimers()
  })
})

describe('nextStop', () => {
  test('goes to the next chapter', () => {
    expect(nextStop('B01', ['B01']).id).toBe('B02')
  })
  test('skips chapters already seen and wraps around', () => {
    expect(nextStop('B12', ['B12', 'B01', 'B02']).id).toBe('B03')
  })
  test('ends at Wispr once all twelve are seen', () => {
    const all = buildings.filter((b) => b.id !== 'B13').map((b) => b.id)
    expect(nextStop('B05', all).id).toBe('B13')
  })
})

describe('Growth', () => {
  test('says what the Wispr chapter says, with the same numbers', () => {
    const proof = buildingById('B13').proof
    expect(proof).toContain(`${growth.gap.installs}%`)
    expect(proof).toContain(`${growth.gap.revenue}%`)
    expect(growth.gap.caption).toContain('100%')
    expect(growth.steps[0].body).toContain('30 to 35 paying students with zero ads')
    expect(growth.proof.result).toContain('4 creators')
  })

  test('the bars are drawn to the same scale', () => {
    const { container } = render(<Growth onBack={vi.fn()} />)
    const [a, b] = [...container.querySelectorAll<HTMLElement>('.growth__bar')].map((e) => parseFloat(e.style.width))
    expect(a / b).toBeCloseTo(growth.gap.installs / growth.gap.revenue)
  })

  test('the chart reads aloud, and the page keeps its contact links and way back', () => {
    const onBack = vi.fn()
    render(<Growth onBack={onBack} />)
    expect(screen.getByRole('figure', { name: /14% of Flow's installs but about 2% of its revenue/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: links.email })).toHaveAttribute('href', `mailto:${links.email}`)
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', links.linkedin)
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', links.github)
    expect(screen.queryByRole('link', { name: 'Resume' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Back to the city' }))
    expect(onBack).toHaveBeenCalled()
  })

  test('ends on his real face', () => {
    render(<Growth onBack={vi.fn()} />)
    expect(screen.getByAltText(/Ritwik Mukherjee/).getAttribute('src')).toContain('img/R01.jpg')
  })

  test('How this was built opens', () => {
    render(<Growth onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'How this was built' }))
    expect(screen.getByRole('dialog', { name: 'How this was built' })).toBeInTheDocument()
  })
})

test('Mark draws the logo without adding to the accessible name', () => {
  const { container } = render(<Mark mark={marks.nvidia} />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('path')!.getAttribute('d')).toBe(marks.nvidia.d)
})
