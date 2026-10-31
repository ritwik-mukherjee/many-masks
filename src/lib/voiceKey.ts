/** True when a speech transcript asks to take the mask off. Lenient about recognizer slips ("take it of"). */
export function matchesTakeItOff(transcript: string): boolean {
  const t = transcript.toLowerCase().replace(/[^a-z\s]/g, ' ')
  return /take\s*it\s*of+\b/.test(t) || /mask\s*off\b/.test(t)
}

type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionCtor = new () => Recognition

/**
 * Listens for "take it off" with the browser's speech recognition (Chrome, Edge). Where it is missing
 * or the mic is refused, `supported` is false or listening simply stops; the click fallback always works.
 */
export function createVoiceKey(onMatch: () => void, onUnavailable?: () => void): { supported: boolean; start(): void; stop(): void } {
  const w = globalThis as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Ctor) return { supported: false, start() {}, stop() {} }

  let rec: Recognition | null = null
  let active = false
  let matched = false

  const begin = () => {
    try {
      rec = new Ctor()
      rec.lang = 'en-IN'
      rec.interimResults = true
      rec.continuous = true
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (!matched && matchesTakeItOff(e.results[i][0]?.transcript ?? '')) {
            matched = true
            active = false
            onMatch()
          }
        }
      }
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          active = false
          onUnavailable?.()
        }
      }
      rec.onend = () => {
        if (active) begin() // Chrome stops after silence; keep listening until matched or stopped
      }
      rec.start()
    } catch {
      active = false
      onUnavailable?.()
    }
  }

  return {
    supported: true,
    start() {
      if (active) return
      active = true
      begin()
    },
    stop() {
      active = false
      try { rec?.stop() } catch { /* already stopped */ }
    },
  }
}
