import { afterEach, beforeEach, expect, test, vi } from 'vitest'
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
