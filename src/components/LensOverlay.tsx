/**
 * The view through the hero's goggles: a soft wide rim, darker at the corners, with a warm yellow
 * tint at the edges. Drawn in code so it stays crisp over any video. `shake` adds a short jolt when a cable fires.
 */
export default function LensOverlay({ visible = true, shake = false }: { visible?: boolean; shake?: boolean }) {
  return (
    <div className={`lens${visible ? ' lens--on' : ''}${shake ? ' lens--shake' : ''}`} aria-hidden="true">
      <div className="lens__rim" />
      <div className="lens__tint" />
    </div>
  )
}
