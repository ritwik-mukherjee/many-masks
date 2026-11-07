import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Experience from '../../src/Experience'

const fake = vi.hoisted(() => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), music: vi.fn(), stopMusic: vi.fn(), voiceClock: vi.fn(() => null), toggleVoice: vi.fn(), ambient: vi.fn(), dispose: vi.fn() }))
vi.mock('../../src/lib/audio', () => ({ createAudio: () => fake }))

describe('Experience voice', () => {
  beforeEach(() => vi.clearAllMocks())

  test('putting the mask on starts the score, with no voice line over it', () => {
    render(<Experience />)
    expect(fake.music).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(fake.music).toHaveBeenCalledWith(expect.stringContaining('aud/score.mp3'))
    expect(fake.voice).not.toHaveBeenCalled()
  })

  test('arriving in the city fades the score out and brings the city sound back up', () => {
    render(<Experience />)
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(fake.stopMusic).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(fake.stopMusic).toHaveBeenCalled()
    expect(fake.ambient).toHaveBeenLastCalledWith('city', 0.35)
  })

  test('arriving in the city cuts off any line still playing', () => {
    render(<Experience />)
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(fake.stopVoice).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(fake.stopVoice).toHaveBeenCalled()
  })
})
