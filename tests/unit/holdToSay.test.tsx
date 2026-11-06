import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import HoldToSay from '../../src/components/HoldToSay'
import { matchesTakeItOff } from '../../src/lib/holdToSpeak'

class FakeRec {
  static all: FakeRec[] = []
  lang = ''
  interimResults = false
  continuous = false
  onaudiostart: (() => void) | null = null
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = 0
  stopped = 0
  aborted = 0
  constructor() { FakeRec.all.push(this) }
  start() { this.started++ }
  stop() { this.stopped++ }
  abort() { this.aborted++ }
  say(...parts: string[]) {
    act(() => this.onresult?.({ resultIndex: 0, results: parts.map((transcript) => [{ transcript }]) }))
  }
  audio() { act(() => this.onaudiostart?.()) }
  end() { act(() => this.onend?.()) }
  fail(error: string) { act(() => this.onerror?.({ error })) }
}
const last = () => FakeRec.all[FakeRec.all.length - 1]
const holdButton = () => screen.getByRole('button', { name: /hold to say|listening/i })

describe('matchesTakeItOff', () => {
  test.each(['take it off', 'Take it off!', 'take it of', 'takeitoff', 'please take it off now', 'mask off'])('accepts %j', (t) => {
    expect(matchesTakeItOff(t)).toBe(true)
  })
  test.each(['take it', 'tick it off', ''])('rejects %j', (t) => {
    expect(matchesTakeItOff(t)).toBe(false)
  })
})

describe('HoldToSay without speech recognition', () => {
  test('shows only a plain button, which unmasks', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    expect(screen.queryByRole('button', { name: /hold/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })
})

describe('HoldToSay', () => {
  beforeEach(() => {
    FakeRec.all = []
    vi.useFakeTimers()
    vi.stubGlobal('webkitSpeechRecognition', FakeRec)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('the mic is untouched until the button is held', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    act(() => vi.advanceTimersByTime(10_000))
    expect(FakeRec.all).toHaveLength(0)
    fireEvent.pointerDown(holdButton())
    expect(last().started).toBe(1)
    expect(last().lang).toBe('en-IN')
    expect(last().interimResults).toBe(true)
  })

  test('words appear live as a caption while held', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    expect(screen.getByRole('button', { name: /listening/i })).toBeInTheDocument()
    last().say('hello there')
    expect(screen.getByText('hello there')).toBeInTheDocument()
    last().say('hello there', 'mumbai')
    expect(screen.getByText('hello there mumbai')).toBeInTheDocument()
  })

  test('hearing the words shows them for a beat, then unmasks once, while still held', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().say('okay take it off')
    expect(screen.getByText('okay take it off')).toBeInTheDocument()
    expect(onUnmask).not.toHaveBeenCalled()
    last().say('okay take it off', 'now')
    act(() => vi.advanceTimersByTime(600))
    expect(onUnmask).toHaveBeenCalledTimes(1)
    expect(last().aborted).toBeGreaterThan(0)
  })

  test('the words can land just after letting go', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().audio()
    fireEvent.pointerUp(holdButton())
    expect(last().stopped).toBe(1)
    last().say('take it off')
    act(() => vi.advanceTimersByTime(600))
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })

  test('a mishearing keeps the caption and invites another go, and a new hold clears it', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().audio()
    last().say('tech it often')
    fireEvent.pointerUp(holdButton())
    last().end()
    expect(screen.getByText('tech it often')).toBeInTheDocument()
    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(onUnmask).not.toHaveBeenCalled()
    fireEvent.pointerDown(holdButton())
    expect(screen.queryByText('tech it often')).toBeNull()
    expect(screen.queryByText(/not quite/i)).toBeNull()
  })

  test('silence says it did not catch anything', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    last().audio()
    fireEvent.pointerUp(holdButton())
    last().end()
    expect(screen.getByText(/didn.t catch that/i)).toBeInTheDocument()
  })

  test('letting go before the mic started explains what to do, which covers the first permission popup', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    fireEvent.pointerUp(holdButton())
    last().end()
    expect(screen.getByText(/allow the mic/i)).toBeInTheDocument()
  })

  test('it never hangs if the recogniser does not report back after letting go', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    last().audio()
    fireEvent.pointerUp(holdButton())
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('button', { name: /hold to say/i })).toBeInTheDocument()
    expect(screen.getByText(/didn.t catch that/i)).toBeInTheDocument()
  })

  test('losing the pointer or the window counts as letting go', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    fireEvent.pointerCancel(holdButton())
    expect(last().stopped).toBe(1)
    last().end()
    fireEvent.pointerDown(holdButton())
    fireEvent.blur(holdButton())
    expect(last().stopped).toBe(1)
  })

  test('the keyboard can hold too, and key repeat does not restart it', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.keyDown(holdButton(), { key: ' ' })
    fireEvent.keyDown(holdButton(), { key: ' ', repeat: true })
    expect(FakeRec.all).toHaveLength(1)
    fireEvent.keyUp(holdButton(), { key: ' ' })
    expect(last().stopped).toBe(1)
  })

  test('Chrome stopping after silence during a hold restarts it and keeps the words so far', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    last().say('take it')
    last().end()
    expect(FakeRec.all).toHaveLength(2)
    expect(last().started).toBe(1)
    last().say('slowly')
    expect(screen.getByText('take it slowly')).toBeInTheDocument()
  })

  test('words split across a restart still count', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().say('take it')
    last().end()
    last().say('off')
    act(() => vi.advanceTimersByTime(600))
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })

  test('a recogniser that keeps ending does not loop forever', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    for (let i = 0; i < 10; i++) last().end()
    expect(FakeRec.all.length).toBeLessThanOrEqual(4)
    expect(screen.getByRole('button', { name: /hold to say/i })).toBeInTheDocument()
  })

  test.each(['not-allowed', 'service-not-allowed', 'audio-capture', 'network'])('%s falls back to the plain button, which works', (error) => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().fail(error)
    expect(screen.queryByRole('button', { name: /hold to say|listening/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })

  test('no-speech is not treated as a failure', () => {
    render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    last().fail('no-speech')
    expect(holdButton()).toBeInTheDocument()
  })

  test('Just take it off always works, without the mic', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.click(screen.getByRole('button', { name: 'Just take it off' }))
    expect(onUnmask).toHaveBeenCalledTimes(1)
    expect(FakeRec.all).toHaveLength(0)
  })

  test('it cannot unmask twice', () => {
    const onUnmask = vi.fn()
    render(<HoldToSay onUnmask={onUnmask} />)
    fireEvent.pointerDown(holdButton())
    last().say('take it off')
    fireEvent.click(screen.getByRole('button', { name: 'Just take it off' }))
    act(() => vi.advanceTimersByTime(600))
    expect(onUnmask).toHaveBeenCalledTimes(1)
  })

  describe('the first time, when the browser still has to ask', () => {
    const setMic = (state: () => string, getUserMedia?: () => Promise<unknown>) => {
      Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: async () => ({ state: state() }) } })
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: getUserMedia ? { getUserMedia } : undefined })
    }
    const settle = () => act(async () => { await vi.advanceTimersByTimeAsync(0) })
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'permissions')
      Reflect.deleteProperty(navigator, 'mediaDevices')
    })

    test('the first press only asks, starts no recognition, and then invites a real hold', async () => {
      const stopTrack = vi.fn()
      const ask = vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] }))
      setMic(() => 'prompt', ask)
      render(<HoldToSay onUnmask={vi.fn()} />)
      await settle()
      expect(ask).not.toHaveBeenCalled()
      const button = holdButton()
      fireEvent.pointerDown(button)
      fireEvent.pointerUp(button)
      expect(ask).toHaveBeenCalledTimes(1)
      expect(FakeRec.all).toHaveLength(0)
      await settle()
      expect(stopTrack).toHaveBeenCalled()
      expect(screen.getByText(/now hold and say it/i)).toBeInTheDocument()
      fireEvent.pointerDown(holdButton())
      expect(ask).toHaveBeenCalledTimes(1)
      expect(FakeRec.all).toHaveLength(1)
    })

    test('pressing again while the popup is up does not ask twice', async () => {
      const ask = vi.fn(() => new Promise(() => {}))
      setMic(() => 'prompt', ask)
      render(<HoldToSay onUnmask={vi.fn()} />)
      await settle()
      fireEvent.pointerDown(screen.getByRole('button', { name: /hold to say/i }))
      fireEvent.pointerUp(screen.getByRole('button', { name: /allow the mic/i }))
      fireEvent.pointerDown(screen.getByRole('button', { name: /allow the mic/i }))
      expect(ask).toHaveBeenCalledTimes(1)
      expect(FakeRec.all).toHaveLength(0)
    })

    test('closing the popup without choosing does not lock them out', async () => {
      setMic(() => 'prompt', async () => { throw Object.assign(new Error('no'), { name: 'NotAllowedError' }) })
      render(<HoldToSay onUnmask={vi.fn()} />)
      await settle()
      fireEvent.pointerDown(holdButton())
      await settle()
      await settle()
      expect(holdButton()).toBeInTheDocument()
      expect(screen.getByText(/allow the mic/i)).toBeInTheDocument()
    })

    test('refusing falls back to the plain button', async () => {
      let state = 'prompt'
      setMic(() => state, async () => { state = 'denied'; throw Object.assign(new Error('no'), { name: 'NotAllowedError' }) })
      const onUnmask = vi.fn()
      render(<HoldToSay onUnmask={onUnmask} />)
      await settle()
      fireEvent.pointerDown(holdButton())
      await settle()
      await settle()
      fireEvent.click(screen.getByRole('button', { name: 'Take it off' }))
      expect(onUnmask).toHaveBeenCalledTimes(1)
    })

    test('having no microphone falls back to the plain button', async () => {
      setMic(() => 'prompt', async () => { throw Object.assign(new Error('none'), { name: 'NotFoundError' }) })
      render(<HoldToSay onUnmask={vi.fn()} />)
      await settle()
      fireEvent.pointerDown(holdButton())
      await settle()
      expect(screen.getByRole('button', { name: 'Take it off' })).toBeInTheDocument()
    })

    test('a mic already allowed goes straight to listening', async () => {
      const ask = vi.fn()
      setMic(() => 'granted', ask)
      render(<HoldToSay onUnmask={vi.fn()} />)
      await settle()
      fireEvent.pointerDown(holdButton())
      expect(ask).not.toHaveBeenCalled()
      expect(FakeRec.all).toHaveLength(1)
    })
  })

  test('leaving releases the mic', () => {
    const { unmount } = render(<HoldToSay onUnmask={vi.fn()} />)
    fireEvent.pointerDown(holdButton())
    const rec = last()
    unmount()
    expect(rec.aborted).toBe(1)
  })
})
