import type { MarkShape } from '../data/marks'

/** One tool's logo, in the colour of the text around it. */
export default function Mark({ mark }: { mark: MarkShape }) {
  return (
    <svg className="mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={mark.d} />
    </svg>
  )
}
