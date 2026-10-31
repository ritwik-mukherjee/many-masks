import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import VoiceKey from '../../src/components/VoiceKey'
import { matchesTakeItOff } from '../../src/lib/voiceKey'

describe('matchesTakeItOff', () => {
  test.each(['take it off', 'Take it off!', 'take it of', 'takeitoff', 'please take it off now', 'mask off'])('accepts %j', (t) => {
    expect(matchesTakeItOff(t)).toBe(true)
  })
  test.each(['take it', 'tick it off', ''])('rejects %j', (t) => {
    expect(matchesTakeItOff(t)).toBe(false)
  })
})

describe('VoiceKey', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  test('Review Focus 2: without speech recognition only the button shows, it works, and nothing errors', () => {
    vi.stubGlobal('SpeechRecognition', undefined)
    vi.stubGlobal('webkitSpeechRecognition', undefined)
    const err = vi.spyOn(console, 'error')
    const onUnmask = vi.fn()
    render(<VoiceKey onUnmask={onUnmask} />)
    expect(screen.queryByText(/listening/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(onUnmask).toHaveBeenCalledTimes(1)
    expect(err).not.toHaveBeenCalled()
  })

  test('Review Focus 2: mic permission denied keeps the button working', () => {
    class Denied {
      onerror: ((e: { error: string }) => void) | null = null
      onresult: unknown = null
      onend: unknown = null
      lang = ''
      interimResults = false
      continuous = false
      start() { this.onerror?.({ error: 'not-allowed' }) }
      stop() {}
      abort() {}
    }
    vi.stubGlobal('webkitSpeechRecognition', Denied)
    const err = vi.spyOn(console, 'error')
    const onUnmask = vi.fn()
    render(<VoiceKey onUnmask={onUnmask} />)
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(onUnmask).toHaveBeenCalledTimes(1)
    expect(err).not.toHaveBeenCalled()
  })

  test('hearing "take it off" unmasks', () => {
    let instance: { onresult: ((e: unknown) => void) | null } | null = null
    class Hears {
      onresult: ((e: unknown) => void) | null = null
      onerror = null
      onend = null
      lang = ''
      interimResults = false
      continuous = false
      constructor() { instance = this }
      start() {}
      stop() {}
      abort() {}
    }
    vi.stubGlobal('webkitSpeechRecognition', Hears)
    const onUnmask = vi.fn()
    render(<VoiceKey onUnmask={onUnmask} />)
    expect(screen.getByText(/listening/i)).toBeInTheDocument()
    instance!.onresult!({ resultIndex: 0, results: [[{ transcript: 'okay take it off' }]] })
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })
})
