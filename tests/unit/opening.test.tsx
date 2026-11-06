import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import LoadingScreen from '../../src/components/LoadingScreen'
import Opening, { Intro } from '../../src/components/Opening'
import { openingBeats } from '../../src/data/opening'
import type { Audio } from '../../src/lib/audio'

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), ambient: vi.fn() })

describe('LoadingScreen', () => {
  test('shows the name, the line and Put it on; clicking unlocks audio and starts', () => {
    const audio = fakeAudio()
    const dispatch = vi.fn()
    render(<LoadingScreen audio={audio} dispatch={dispatch} />)
    expect(screen.getByText('Ritwik Mukherjee')).toBeInTheDocument()
    expect(screen.getByText('Every time I built something, I had to become someone else first.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(audio.unlock).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'START' })
  })
})

describe('LoadingScreen opening moment', () => {
  test('the cable and both lenses sit in the same world as the poster, hidden from assistive tech', () => {
    const { container } = render(<LoadingScreen audio={fakeAudio()} dispatch={vi.fn()} />)
    const world = container.querySelector('.loading__world')!
    expect(world.querySelector('img.loading__poster')).not.toBeNull()
    expect(world.querySelector('svg.loading__cable')?.getAttribute('aria-hidden')).toBe('true')
    expect(world.querySelectorAll('.loading__lens')).toHaveLength(2)
  })
})

describe('Intro', () => {
  test('plays O02 and moves on when it ends', () => {
    const dispatch = vi.fn()
    const { container } = render(<Intro dispatch={dispatch} reducedMotion={false} />)
    const video = container.querySelector('video')!
    expect(video.getAttribute('src')).toContain('vid/O02.mp4')
    fireEvent.ended(video)
    expect(dispatch).toHaveBeenCalledWith({ type: 'INTRO_DONE' })
  })
})

describe('Opening', () => {
  test('has a Skip intro button', () => {
    const dispatch = vi.fn()
    render(<Opening dispatch={dispatch} audio={fakeAudio()} reducedMotion={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'SKIP_INTRO' })
  })

  test('reduced motion shows the beats as stepped stills with no video', () => {
    const dispatch = vi.fn()
    const { container } = render(<Opening dispatch={dispatch} audio={fakeAudio()} reducedMotion />)
    expect(container.querySelector('video')).toBeNull()
    for (const b of openingBeats) expect(screen.getByText(b.text)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Into the city' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'OPENING_DONE' })
  })
})
