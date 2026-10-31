import { media } from './media'

export type SfxName = 'fire' | 'whoosh' | 'wind' | 'city' | 'ink'

/**
 * All sound goes through here. Nothing plays until unlock() is called from the
 * "Put it on" click, because browsers block audio before a user gesture.
 */
export function createAudio() {
  let isUnlocked = false
  let currentVoice: HTMLAudioElement | null = null
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
    /** Stops every loop and the current voice line. */
    dispose() {
      for (const el of loops.values()) el.pause()
      loops.clear()
      currentVoice?.pause()
      currentVoice = null
    },
  }
}

export type Audio = ReturnType<typeof createAudio>
