import { useEffect, useMemo, useRef, useState } from 'react'
import timings from '../data/voiceTimings.json'
import type { Audio } from '../lib/audio'

const TICK_MS = 70
/** A voice that hasn't moved by now isn't going to: autoplay was refused or it stalled. */
const START_LIMIT_MS = 2500
const CHUNK_WORDS = 12
const SOFT_BREAK_WORDS = 6

/** Splits a line into short caption phrases: at sentence ends, at commas once long enough, and never too long. */
export function captionChunks(words: string[]): string[][] {
  const chunks: string[][] = []
  let chunk: string[] = []
  for (const word of words) {
    chunk.push(word)
    const sentenceEnd = /[.!?:]$/.test(word)
    const softEnd = /,$/.test(word) && chunk.length >= SOFT_BREAK_WORDS
    if (sentenceEnd || softEnd || chunk.length >= CHUNK_WORDS) {
      chunks.push(chunk)
      chunk = []
    }
  }
  if (chunk.length) chunks.push(chunk)
  return chunks
}

/**
 * The voice line, live: a pill with a waveform that also pauses it, and the words appearing as they're spoken.
 * If the voice can't play it says so, so the words can be shown another way.
 */
export default function VoicePill({ name, text, audio, onUnavailable }: { name: string; text: string; audio: Audio; onUnavailable?: () => void }) {
  const chunks = useMemo(() => captionChunks(text.split(/\s+/)), [text])
  const times = (timings as Record<string, number[]>)[name] ?? []
  const [time, setTime] = useState(0)
  const [state, setState] = useState<'playing' | 'paused' | 'ended'>('playing')
  const reported = useRef(false)
  const started = useRef(false)
  const notify = useRef(onUnavailable)
  notify.current = onUnavailable

  useEffect(() => {
    const opened = Date.now()
    const report = () => {
      if (reported.current) return
      reported.current = true
      notify.current?.()
    }
    const t = setInterval(() => {
      const clock = audio.voiceClock()
      if (!clock) return
      if (clock.time > 0) started.current = true
      if (clock.failed || (!started.current && Date.now() - opened >= START_LIMIT_MS)) report()
      setTime(clock.time)
      setState(clock.ended ? 'ended' : clock.paused ? 'paused' : 'playing')
    }, TICK_MS)
    return () => clearInterval(t)
  }, [audio])

  let spoken = 0
  while (spoken < times.length && times[spoken] <= time) spoken += 1

  let start = 0
  let index = 0
  for (; index < chunks.length - 1; index++) {
    if (spoken <= start + chunks[index].length) break
    start += chunks[index].length
  }
  const chunk = chunks[index]
  const playing = state === 'playing'

  return (
    <div className={`voicepill voicepill--${state}`}>
      <button type="button" className="voicepill__button" onClick={() => audio.toggleVoice()} aria-label={playing ? 'Pause my voice' : state === 'ended' ? 'Replay my voice' : 'Play my voice'}>
        <span className="voicepill__bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
      </button>
      <p className="voicepill__words" key={index} aria-hidden="true">
        {chunk.map((word, i) => (
          <span key={i} className={start + i < spoken ? 'is-said' : undefined}>{word} </span>
        ))}
      </p>
    </div>
  )
}
