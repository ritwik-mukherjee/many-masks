/** True when a transcript asks to take the mask off. Lenient about recognizer slips ("take it of"). */
export function matchesTakeItOff(transcript: string): boolean {
  const t = transcript.toLowerCase().replace(/[^a-z\s]/g, ' ')
  return /take\s*it\s*of+\b/.test(t) || /mask\s*off\b/.test(t)
}

type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onaudiostart: (() => void) | null
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

const recognitionCtor = () => {
  const w = globalThis as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechSupported = () => Boolean(recognitionCtor())

/** The mic or the speech service can't be used here, so there's no point trying again. */
const UNAVAILABLE = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'])
/** Chrome ends a session after silence, so a hold restarts it, but only so many times without hearing anything. */
const MAX_RESTARTS = 3

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim()

export interface SpeechHandlers {
  /** The mic is actually on, which also means any permission popup has been answered. */
  onAudioStart(): void
  /** Everything heard so far in this hold, updated live. */
  onText(text: string): void
  /** Listening has finished, after stop() or after giving up on a silent hold. */
  onEnd(): void
  onUnavailable(): void
}

export interface SpeechSession {
  /** Stop listening but still deliver the last words, which often arrive just after. */
  stop(): void
  /** Stop now and report nothing more. */
  abort(): void
}

/** Whether the browser would still have to ask for the mic. Never shows a popup. */
export async function micPermission(): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return status.state
  } catch {
    return 'unknown'
  }
}

/**
 * Shows the browser's mic popup, separately from any recognition. The visitor has to let go of the button to answer
 * it, and stopping recognition with the question still open could read as a refusal.
 */
export async function askForMic(): Promise<'granted' | 'dismissed' | 'unavailable'> {
  const devices = navigator.mediaDevices
  if (!devices?.getUserMedia) return 'granted'
  try {
    const stream = await devices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return 'granted'
  } catch (e) {
    const refused = (e as Error).name === 'NotAllowedError'
    return refused && (await micPermission()) === 'prompt' ? 'dismissed' : 'unavailable'
  }
}

/** Listens for one hold of the button. Only call this when speechSupported() is true. */
export function listen(handlers: SpeechHandlers): SpeechSession {
  const Ctor = recognitionCtor()!
  let rec: Recognition | null = null
  let holding = true
  let closed = false
  let earlier = ''
  let restarts = 0

  const unavailable = () => {
    if (closed) return
    closed = true
    handlers.onUnavailable()
  }

  const begin = () => {
    let current = ''
    try {
      const r = new Ctor()
      rec = r
      r.lang = 'en-IN'
      r.interimResults = true
      r.continuous = true
      r.onaudiostart = () => { if (!closed) handlers.onAudioStart() }
      r.onresult = (e) => {
        if (closed) return
        restarts = 0
        current = Array.from(e.results, (result) => result[0]?.transcript ?? '').join(' ')
        handlers.onText(tidy(`${earlier} ${current}`))
      }
      r.onerror = (e) => { if (UNAVAILABLE.has(e.error)) unavailable() }
      r.onend = () => {
        if (closed) return
        if (holding && restarts < MAX_RESTARTS) {
          restarts += 1
          earlier = tidy(`${earlier} ${current}`)
          begin()
          return
        }
        closed = true
        handlers.onEnd()
      }
      r.start()
    } catch {
      unavailable()
    }
  }
  begin()

  return {
    stop() {
      holding = false
      try { rec?.stop() } catch { /* already stopped */ }
    },
    abort() {
      closed = true
      holding = false
      try { rec?.abort() } catch { /* already stopped */ }
    },
  }
}
