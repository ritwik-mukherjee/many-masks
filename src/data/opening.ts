export interface Beat {
  /** Fractions of opening.mp4, 0..1. */
  from: number
  to: number
  text: string
}

export const openingBeats: Beat[] = [
  { from: 0, to: 0.25, text: 'Thane, dawn' },
  { from: 0.25, to: 0.42, text: '11th and 12th: preparing for IIT' },
  { from: 0.42, to: 0.58, text: 'Then, a drop year' },
  { from: 0.58, to: 0.74, text: 'The gym. The books.' },
  { from: 0.74, to: 0.88, text: '98.3 percentile, MHT CET' },
  { from: 0.88, to: 1, text: 'SPIT, Mumbai' },
]

export const openingLine = 'Every time I built something, I had to become someone else first.'
