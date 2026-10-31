import { useEffect, useRef, useState } from 'react'
import { createVoiceKey } from '../lib/voiceKey'

/** "Say take it off": voice is the key to the finale. The button always works too. */
export default function VoiceKey({ onUnmask }: { onUnmask: () => void }) {
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
    setListening(true)
    key.start()
    return () => key.stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="voicekey">
      <p className="voicekey__prompt caption">Say “take it off”</p>
      {listening && <p className="voicekey__listening" aria-live="polite"><span className="voicekey__dot" /> Listening</p>}
      <button type="button" className="cta" onClick={unmask}>Take it off</button>
    </div>
  )
}
