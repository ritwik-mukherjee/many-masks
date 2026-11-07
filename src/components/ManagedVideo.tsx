import { useEffect, useRef, type ReactEventHandler, type Ref, type VideoHTMLAttributes } from 'react'
import { releaseVideo } from '../lib/video'

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  src: string
  /** Start as soon as there's enough to play. Chrome's own autoplay waits for far more, which stalls on slower connections. */
  autoStart?: boolean
  videoRef?: Ref<HTMLVideoElement>
  muted?: boolean
}

/** A video that stops downloading when it leaves the screen. */
export default function ManagedVideo({ src, autoStart = false, videoRef, onCanPlay, ...rest }: Props) {
  const own = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = own.current
    if (!video) return
    // React's development double-run releases then remounts the same element, so put the source back.
    if (!video.getAttribute('src')) video.setAttribute('src', src)
    return () => releaseVideo(video)
  }, [src])

  const canPlay: ReactEventHandler<HTMLVideoElement> = (e) => {
    onCanPlay?.(e)
    const video = e.currentTarget
    if (!autoStart || !video.paused || video.ended) return
    try {
      Promise.resolve(video.play()).catch(() => {})
    } catch {
      /* the owner's stall handling covers this */
    }
  }

  return (
    <video
      {...rest}
      src={src}
      ref={(el) => {
        own.current = el
        if (typeof videoRef === 'function') videoRef(el)
        else if (videoRef) videoRef.current = el
      }}
      onCanPlay={canPlay}
    />
  )
}
