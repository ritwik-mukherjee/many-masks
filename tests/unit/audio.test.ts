import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createAudio } from '../../src/lib/audio'

let play: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

test('nothing plays before unlock', () => {
  const a = createAudio()
  a.sfx('fire')
  a.voice('aud/A-B01.mp3')
  expect(a.unlocked()).toBe(false)
  expect(play).not.toHaveBeenCalled()
})

test('sfx and voice play after unlock', () => {
  const a = createAudio()
  a.unlock()
  a.sfx('fire')
  a.voice('aud/A-B01.mp3')
  expect(a.unlocked()).toBe(true)
  expect(play).toHaveBeenCalledTimes(2)
})

test('stopVoice pauses the current voice line', () => {
  const a = createAudio()
  a.unlock()
  a.voice('aud/A-B01.mp3')
  a.stopVoice()
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
})

describe('music', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('does not play before unlock', () => {
    const a = createAudio()
    a.music('aud/score.mp3')
    expect(play).not.toHaveBeenCalled()
  })

  test('plays once unlocked, and a second call does not stack another track', () => {
    const a = createAudio()
    a.unlock()
    a.music('aud/score.mp3')
    a.music('aud/score.mp3')
    expect(play).toHaveBeenCalledTimes(1)
  })

  test('stopMusic fades it down to silence, then pauses', () => {
    const made: HTMLAudioElement[] = []
    const Real = globalThis.Audio
    vi.stubGlobal('Audio', class extends Real { constructor(src?: string) { super(src); made.push(this) } })
    const a = createAudio()
    a.unlock()
    a.music('aud/score.mp3', 0.8)
    expect(made[0].volume).toBeCloseTo(0.8)
    a.stopMusic(1000)
    vi.advanceTimersByTime(500)
    expect(made[0].volume).toBeGreaterThan(0)
    expect(made[0].volume).toBeLessThan(0.8)
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(made[0].volume).toBe(0)
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  test('the score can start again after it has been stopped', () => {
    const a = createAudio()
    a.unlock()
    a.music('aud/score.mp3')
    a.stopMusic(0)
    a.music('aud/score.mp3')
    expect(play).toHaveBeenCalledTimes(2)
  })
})
