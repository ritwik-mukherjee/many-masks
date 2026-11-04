import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Finale from '../../src/components/Finale'
import { links } from '../../src/data/links'
import type { Audio } from '../../src/lib/audio'
import { initialJourney, type FinaleStep } from '../../src/state/journey'

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), ambient: vi.fn() })
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

  test('face shows the hero, plays the prompt line, and Take it off unmasks', () => {
    const dispatch = vi.fn()
    const audio = fakeAudio()
    const { container } = render(<Finale state={at('face')} dispatch={dispatch} audio={audio} />)
    expect(container.querySelector('img[src*="img/F02.jpg"]')).not.toBeNull()
    expect(audio.voice).toHaveBeenCalledWith(expect.stringContaining('aud/A-F01.mp3'))
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'UNMASK' })
  })

  test('unmasking crossfades from the mask to the face and moves on', () => {
    vi.useFakeTimers()
    const dispatch = vi.fn()
    const { container } = render(<Finale state={at('unmasking')} dispatch={dispatch} audio={fakeAudio()} />)
    expect(container.querySelector('img[src*="img/F05.jpg"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(2200))
    expect(dispatch).toHaveBeenCalledWith({ type: 'FINALE_NEXT' })
    vi.useRealTimers()
  })

  test('reveal holds F05, plays the line, and shows the twist', () => {
    const audio = fakeAudio()
    const { container } = render(<Finale state={at('reveal')} dispatch={vi.fn()} audio={audio} />)
    expect(container.querySelector('img[src*="img/F05.jpg"]')).not.toBeNull()
    expect(audio.voice).toHaveBeenCalledWith(expect.stringContaining('aud/A-F02.mp3'), expect.any(Function))
    expect(screen.getByText("You've been wearing my masks. Here's the one I want next.")).toBeInTheDocument()
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
