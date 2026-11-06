import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Experience from '../../src/Experience'

const fake = vi.hoisted(() => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), ambient: vi.fn(), dispose: vi.fn() }))
vi.mock('../../src/lib/audio', () => ({ createAudio: () => fake }))

describe('Experience voice', () => {
  beforeEach(() => vi.clearAllMocks())

  test('putting the mask on speaks the opening line', () => {
    render(<Experience />)
    expect(fake.voice).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(fake.voice).toHaveBeenCalledWith(expect.stringContaining('aud/A-O01.mp3'))
  })

  test('arriving in the city cuts off any line still playing', () => {
    render(<Experience />)
    fireEvent.click(screen.getByRole('button', { name: 'Put it on' }))
    expect(fake.stopVoice).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(fake.stopVoice).toHaveBeenCalled()
  })
})
