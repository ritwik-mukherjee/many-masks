/**
 * Taking a video off the screen doesn't stop it downloading: the browser carries on until it gets round to collecting it.
 * Left alone, abandoned clips compete with the one the visitor is waiting for, so every video here gets released.
 */
export function releaseVideo(video: HTMLVideoElement) {
  try {
    video.pause()
    video.removeAttribute('src')
    video.load()
  } catch {
    /* already gone */
  }
}

/** Loads the one clip likely to be needed next, and stops loading the last one. */
export function createWarmer() {
  let current: HTMLVideoElement | null = null
  let currentSrc = ''
  const release = () => {
    if (current) releaseVideo(current)
    current = null
    currentSrc = ''
  }
  return {
    warm(src: string) {
      if (typeof document === 'undefined') return null
      if (src === currentSrc) return current
      release()
      const video = document.createElement('video')
      video.muted = true
      video.preload = 'auto'
      video.src = src
      current = video
      currentSrc = src
      return video
    },
    release,
  }
}
