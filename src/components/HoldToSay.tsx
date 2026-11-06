import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { askForMic, listen, matchesTakeItOff, micPermission, speechSupported, type SpeechSession } from '../lib/holdToSpeak'

/** How long the visitor's own words stay on screen before the mask comes off. */
const BEAT_MS = 450
/** The last words arrive just after letting go, but never wait for them longer than this. */
const SETTLE_MS = 1500
const CAPTION_CHARS = 90

const HINT_HOLD = 'Hold the button while you speak. Allow the mic if your browser asks.'
const HINT_SILENCE = "Didn't catch that. Hold and try again."
const HINT_MISHEARD = 'Not quite. Hold and say “take it off”.'
const HINT_NO_MIC = "The mic isn't available here. No problem."
const HINT_MIC_ON = "Mic's on. Now hold and say it."

type Phase = 'ready' | 'asking' | 'listening' | 'checking' | 'heard'

/**
 * The unmasking key: hold the button, say "take it off", and watch the words land live, the way Flow works.
 * The mic is only touched while the button is held, and a plain button is always there as well.
 */
export default function HoldToSay({ onUnmask }: { onUnmask: () => void }) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [available, setAvailable] = useState(speechSupported)
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)

  const session = useRef<SpeechSession | null>(null)
  const holding = useRef(false)
  const done = useRef(false)
  const micOn = useRef(false)
  const heard = useRef('')
  const permission = useRef<PermissionState | 'unknown'>('unknown')
  const asking = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const beatTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Knowing this up front keeps a press instant. Checking never shows a popup.
  useEffect(() => {
    if (speechSupported()) void micPermission().then((state) => { permission.current = state })
  }, [])

  useEffect(() => () => {
    clearTimeout(settleTimer.current)
    clearTimeout(beatTimer.current)
    session.current?.abort()
  }, [])

  const settle = () => {
    clearTimeout(settleTimer.current)
    holding.current = false
    session.current?.abort()
    session.current = null
    if (done.current) return
    setPhase('ready')
    setHint(!micOn.current ? HINT_HOLD : heard.current ? HINT_MISHEARD : HINT_SILENCE)
  }

  const giveUpOnMic = () => {
    setPhase('ready')
    setAvailable(false)
    setHint(HINT_NO_MIC)
  }

  const ask = () => {
    asking.current = true
    setText('')
    setHint(null)
    setPhase('asking')
    void askForMic().then((answer) => {
      asking.current = false
      if (done.current) return
      if (answer === 'unavailable') return giveUpOnMic()
      setPhase('ready')
      if (answer === 'granted') permission.current = 'granted'
      setHint(answer === 'granted' ? HINT_MIC_ON : HINT_HOLD)
    })
  }

  const press = () => {
    if (done.current || holding.current || asking.current) return
    if (permission.current === 'prompt') return ask()
    clearTimeout(settleTimer.current)
    session.current?.abort()
    holding.current = true
    micOn.current = false
    heard.current = ''
    setText('')
    setHint(null)
    setPhase('listening')
    session.current = listen({
      onAudioStart: () => { micOn.current = true },
      onText: (words) => {
        if (done.current) return
        heard.current = words
        setText(words)
        if (!matchesTakeItOff(words)) return
        done.current = true
        holding.current = false
        clearTimeout(settleTimer.current)
        session.current?.abort()
        setPhase('heard')
        beatTimer.current = setTimeout(onUnmask, BEAT_MS)
      },
      onEnd: settle,
      onUnavailable: () => {
        clearTimeout(settleTimer.current)
        holding.current = false
        session.current = null
        giveUpOnMic()
      },
    })
  }

  const release = () => {
    if (!holding.current) return
    holding.current = false
    setPhase('checking')
    session.current?.stop()
    settleTimer.current = setTimeout(settle, SETTLE_MS)
  }

  const unmaskNow = () => {
    if (done.current) return
    done.current = true
    clearTimeout(settleTimer.current)
    session.current?.abort()
    onUnmask()
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button > 0) return
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* the release handlers still cover it */ }
    press()
  }
  const isHoldKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter'

  const listening = phase === 'listening'
  const caption = text.length > CAPTION_CHARS ? `…${text.slice(-CAPTION_CHARS)}` : text

  return (
    <div className="holdkey">
      {caption && <p className="holdkey__caption"><span className="caption">{caption}</span></p>}
      {hint && <p className="holdkey__hint" role="status">{hint}</p>}
      {available ? (
        <>
          <button
            type="button"
            className={`cta holdkey__hold${listening ? ' is-on' : ''}`}
            disabled={phase === 'heard'}
            onPointerDown={onPointerDown}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onBlur={release}
            onKeyDown={(e) => {
              if (!isHoldKey(e)) return
              e.preventDefault()
              if (!e.repeat) press()
            }}
            onKeyUp={(e) => { if (isHoldKey(e)) release() }}
          >
            {listening ? (
              <><span className="holdkey__wave" aria-hidden="true"><i /><i /><i /><i /><i /></span> Listening</>
            ) : phase === 'heard' ? 'Taking it off' : phase === 'asking' ? 'Allow the mic' : 'Hold to say “take it off”'}
          </button>
          <button type="button" className="holdkey__plain" onClick={unmaskNow}>Just take it off</button>
        </>
      ) : (
        <button type="button" className="cta" onClick={unmaskNow}>Take it off</button>
      )}
    </div>
  )
}
