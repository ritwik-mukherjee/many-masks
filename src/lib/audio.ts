import { media } from './media'

export type SfxName = 'fire' | 'whoosh' | 'wind' | 'city' | 'ink'

const FADE_STEP_MS = 50

/**
 * All sound goes through here. Nothing plays until unlock() is called from the
 * "Put it on" click, because browsers block audio before a user gesture.
 */
export function createAudio() {
  let isUnlocked = false
  let currentVoice: HTMLAudioElement | null = null
  let currentMusic: HTMLAudioElement | null = null
  const loops = new Map<SfxName, HTMLAudioElement>()

  const safePlay = (el: HTMLMediaElement) => {
    try {
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* autoplay refused or not supported: stay silent */
    }
  }

  return {
    unlock() {
      isUnlocked = true
    },
    unlocked() {
      return isUnlocked
    },
    sfx(name: SfxName) {
      if (!isUnlocked) return
      const el = new Audio(media(`sfx/${name}.mp3`))
      el.volume = 0.8
      safePlay(el)
    },
    /** Looping ambience (wind, city) at a volume from 0 to 1; 0 pauses it. */
    ambient(name: SfxName, volume: number) {
      if (!isUnlocked) return
      let el = loops.get(name)
      if (!el) {
        el = new Audio(media(`sfx/${name}.mp3`))
        el.loop = true
        loops.set(name, el)
      }
      el.volume = Math.max(0, Math.min(1, volume))
      if (volume > 0 && el.paused) safePlay(el)
      if (volume === 0 && !el.paused) el.pause()
    },
    voice(src: string, onEnd?: () => void) {
      if (!isUnlocked) return
      currentVoice?.pause()
      const el = new Audio(src)
      if (onEnd) el.addEventListener('ended', onEnd, { once: true })
      currentVoice = el
      safePlay(el)
    },
    stopVoice() {
      currentVoice?.pause()
      currentVoice = null
    },
    /** Where the current voice line has got to, or null when none is playing. */
    voiceClock() {
      if (!currentVoice) return null
      const el = currentVoice
      return { time: el.currentTime, duration: el.duration, paused: el.paused, ended: el.ended, failed: Boolean(el.error) }
    },
    /** Pauses the voice line, resumes it, or plays it again once it has ended. */
    toggleVoice() {
      const el = currentVoice
      if (!el) return
      if (el.paused) safePlay(el)
      else el.pause()
    },
    /** The score. Starts only once; calling it again while it plays does nothing. */
    music(src: string, volume = 0.8) {
      if (!isUnlocked || currentMusic) return
      const el = new Audio(src)
      el.loop = true
      el.volume = volume
      currentMusic = el
      safePlay(el)
    },
    /** Fades the score out over ms, then stops it, so it can be started again later. */
    stopMusic(ms = 1500) {
      const el = currentMusic
      if (!el) return
      currentMusic = null
      const from = el.volume
      const steps = Math.max(1, Math.round(ms / FADE_STEP_MS))
      let step = 0
      const finish = () => {
        el.volume = 0
        el.pause()
      }
      if (ms <= 0) return finish()
      const t = setInterval(() => {
        step += 1
        if (step >= steps) {
          clearInterval(t)
          finish()
        } else {
          el.volume = from * (1 - step / steps)
        }
      }, FADE_STEP_MS)
    },
    /** Stops every loop, the score and the current voice line. */
    dispose() {
      for (const el of loops.values()) el.pause()
      loops.clear()
      currentVoice?.pause()
      currentVoice = null
      currentMusic?.pause()
      currentMusic = null
    },
  }
}

export type Audio = ReturnType<typeof createAudio>
