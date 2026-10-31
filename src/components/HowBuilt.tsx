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
          Every prompt behind this site was spoken, not typed, through Wispr Flow: into Claude Code to design and build it,
          and into Emergent to ship it. The suit, the city and every swing were generated from prompts I wrote and spoke.
        </p>
        <p className="howbuilt__todo">TODO_RITWIK: Flow stats screenshot and two short dictation clips.</p>
        <button type="button" className="cta" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
