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
          I built this by talking: I spoke most of my instructions to Claude Code to design and build it, and to Emergent to ship
          it, through Wispr Flow. The suit, the city and the swings were made with AI image and video tools, and I chose
          the takes. The comic panels are those same images, inked by a shader written for this site.
        </p>
        <button type="button" className="cta" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
