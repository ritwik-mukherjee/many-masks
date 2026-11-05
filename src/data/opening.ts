export interface Beat {
  /** Fractions of opening.mp4, 0..1. */
  from: number
  to: number
  text: string
}

export const openingBeats: Beat[] = [
  { from: 0, to: 0.1, text: 'Thane, dawn' },
  { from: 0.1, to: 0.21, text: '11th and 12th: preparing for IIT' },
  { from: 0.21, to: 0.5, text: 'Then, a drop year' },
  { from: 0.5, to: 0.82, text: 'The gym. The books.' },
  { from: 0.82, to: 0.93, text: '98.3 percentile, MHT CET' },
  { from: 0.93, to: 1, text: 'SPIT, Mumbai' },
]

export const openingLine = 'Every time I built something, I had to become someone else first.'
