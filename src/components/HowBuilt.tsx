import { useEffect, useRef } from 'react'

/** How the site was made: by voice, through Wispr Flow, into Claude Code and Emergent. */
export default function HowBuilt({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="howbuilt" role="dialog" aria-modal="true" aria-label="How this was built" tabIndex={-1} ref={ref}>
      <div className="howbuilt__card">
        <h2>How this was built</h2>
        <p>
          I built this by talking: I spoke most of my instructions to Claude Code through Wispr Flow to design and build it.
          The suit, the city, the swings, the comic scenes and the opening score were made with AI image, video and music
          tools, and I chose the takes. A shader written for this site inks the comic panels. The voice and the clip at the
          end are really me.
        </p>
        <button type="button" className="cta" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
