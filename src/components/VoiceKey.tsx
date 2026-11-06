import { useEffect, useRef, useState } from 'react'
import { createVoiceKey } from '../lib/voiceKey'

/** "Say take it off": voice is the key to the finale. The button always works too. */
export default function VoiceKey({ onUnmask, listenAfterMs = 0 }: { onUnmask: () => void; listenAfterMs?: number }) {
  const fired = useRef(false)
  const [listening, setListening] = useState(false)

  const unmask = () => {
    if (fired.current) return
    fired.current = true
    onUnmask()
  }

  useEffect(() => {
    const key = createVoiceKey(unmask, () => setListening(false))
    if (!key.supported) return
    const listen = () => {
      setListening(true)
      key.start()
    }
    if (!listenAfterMs) {
      listen()
      return () => key.stop()
    }
    // The mic stays off while a spoken prompt plays, or laptop speakers would say the key to it.
    const t = setTimeout(listen, listenAfterMs)
    return () => {
      clearTimeout(t)
      key.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="voicekey">
      <p className="voicekey__prompt caption">Say “take it off”</p>
      {listening && <p className="voicekey__listening" aria-live="polite"><span className="voicekey__dot" /> Listening</p>}
      <button type="button" className="cta" onClick={unmask}>Take it off</button>
    </div>
  )
}
