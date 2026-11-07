import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Finale from '../../src/components/Finale'
import { links } from '../../src/data/links'
import type { Audio } from '../../src/lib/audio'
import { initialJourney, type FinaleStep } from '../../src/state/journey'

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), voiceClock: vi.fn(() => null), toggleVoice: vi.fn(), ambient: vi.fn() })
const at = (finale: FinaleStep) => ({ ...initialJourney, phase: 'finale' as const, current: 'B13' as const, finale })

describe('Finale', () => {
  test('swing plays F01 and moves on when it ends', () => {
    const dispatch = vi.fn()
    const { container } = render(<Finale state={at('swing')} dispatch={dispatch} audio={fakeAudio()} />)
    const v = container.querySelector('video')!
    expect(v.getAttribute('src')).toContain('vid/F01.mp4')
    fireEvent.ended(v)
    expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
  })

  test('face shows the hero, and Take it off unmasks', () => {
    const dispatch = vi.fn()
    const { container } = render(<Finale state={at('face')} dispatch={dispatch} audio={fakeAudio()} />)
    expect(container.querySelector('img[src*="img/F02.jpg"]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'UNMASK' })
  })

  test('face plays no spoken prompt and leaves the mic alone until someone holds the button', () => {
    const start = vi.fn()
    vi.stubGlobal('webkitSpeechRecognition', class { onresult = null; onerror = null; onend = null; onaudiostart = null; lang = ''; interimResults = false; continuous = false; start = start; stop() {} abort() {} })
    vi.useFakeTimers()
    const dispatch = vi.fn()
    const audio = fakeAudio()
    render(<Finale state={at('face')} dispatch={dispatch} audio={audio} />)
    act(() => vi.advanceTimersByTime(10_000))
    expect(audio.voice).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold to say/i }))
    expect(start).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Just take it off' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'UNMASK' })
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('unmasking plays the pull-off with a whoosh and moves on when the cloth has gone dark', () => {
    const dispatch = vi.fn()
    const audio = fakeAudio()
    const { container } = render(<Finale state={at('unmasking')} dispatch={dispatch} audio={audio} />)
    const v = container.querySelector('video')!
    expect(v.getAttribute('src')).toContain('vid/F03.mp4')
    expect(audio.sfx).toHaveBeenCalledWith('whoosh')
    fireEvent.ended(v)
    expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
  })

  test('unmasking still moves on if the clip fails', () => {
    const dispatch = vi.fn()
    const { container } = render(<Finale state={at('unmasking')} dispatch={dispatch} audio={fakeAudio()} />)
    fireEvent.error(container.querySelector('video')!)
    expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
  })

  test('the raw clip has no poster, so the black of the cloth cuts straight to him', () => {
    const { container } = render(<Finale state={at('reveal')} dispatch={vi.fn()} audio={fakeAudio()} />)
    expect(container.querySelector('video')!.hasAttribute('poster')).toBe(false)
  })

  describe('reveal', () => {
    const twist = "You've been wearing my masks. Here's the one I want next."
    const cta = "What I'd do at Wispr"

    test('plays his raw clip with sound, instead of the photo and voice line', () => {
      const audio = fakeAudio()
      const { container } = render(<Finale state={at('reveal')} dispatch={vi.fn()} audio={audio} />)
      const v = container.querySelector('video')!
      expect(v.getAttribute('src')).toContain('vid/raw.mp4')
      expect(v.muted).toBe(false)
      expect(audio.voice).not.toHaveBeenCalled()
      expect(screen.queryByText(twist)).toBeNull()
      expect(screen.queryByRole('button', { name: cta })).toBeNull()
    })

    test('captions follow what he is saying', () => {
      const { container } = render(<Finale state={at('reveal')} dispatch={vi.fn()} audio={fakeAudio()} />)
      const v = container.querySelector('video')!
      const at_ = (t: number) => { Object.defineProperty(v, 'currentTime', { value: t, configurable: true }); fireEvent.timeUpdate(v) }
      at_(10)
      expect(screen.getByText('And now, my next mask is going to be growing Wispr Flow in India.')).toBeInTheDocument()
      at_(14.2)
      expect(screen.getByText('See you there, guys.')).toBeInTheDocument()
    })

    test('when the clip ends the twist and the way on appear', () => {
      const dispatch = vi.fn()
      const { container } = render(<Finale state={at('reveal')} dispatch={dispatch} audio={fakeAudio()} />)
      const v = container.querySelector('video')!
      fireEvent.ended(v)
      expect(screen.getByText(twist)).toBeInTheDocument()
      expect(container.querySelector('.finale__caption')).toBeNull()
      expect(v.className).toContain('finale__raw--ended')
      fireEvent.click(screen.getByRole('button', { name: cta }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
    })

    test('a reviewer can skip the clip', () => {
      const dispatch = vi.fn()
      render(<Finale state={at('reveal')} dispatch={dispatch} audio={fakeAudio()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
    })

    test('if the clip fails it falls back to the photo, the voice line and the twist', () => {
      const audio = fakeAudio()
      const { container } = render(<Finale state={at('reveal')} dispatch={vi.fn()} audio={audio} />)
      fireEvent.error(container.querySelector('video')!)
      expect(container.querySelector('video')).toBeNull()
      expect(container.querySelector('img[src*="img/F05.jpg"]')).not.toBeNull()
      expect(audio.voice).toHaveBeenCalledWith(expect.stringContaining('aud/A-F02.mp3'))
      expect(screen.getByText(twist)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: cta })).toBeInTheDocument()
    })
  })

  test('growth shows the contact links and opens How this was built', () => {
    render(<Finale state={at('growth')} dispatch={vi.fn()} audio={fakeAudio()} />)
    expect(screen.getByRole('link', { name: links.email })).toHaveAttribute('href', `mailto:${links.email}`)
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'How this was built' }))
    expect(screen.getByRole('dialog', { name: 'How this was built' })).toBeInTheDocument()
  })

  test('growth offers a way back to the city', () => {
    const dispatch = vi.fn()
    render(<Finale state={at('growth')} dispatch={dispatch} audio={fakeAudio()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back to the city' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'BACK_TO_CITY' })
  })
})
