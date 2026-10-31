import { describe, expect, test } from 'vitest'
import { coverTransform, pctToScreen } from '../../src/lib/cover'

const img = { w: 3344, h: 1882 }

describe.each([
  { w: 1280, h: 720 },
  { w: 2560, h: 1080 },
  { w: 1440, h: 900 },
])('Review Focus 4: cover fit at $w x $h', (view) => {
  test('scale fills the view', () => {
    expect(coverTransform(img, view).scale).toBeCloseTo(Math.max(view.w / img.w, view.h / img.h), 10)
  })
  test('the image centre lands on the view centre', () => {
    const [x, y] = pctToScreen([50, 50], img, view)
    expect(x).toBeCloseTo(view.w / 2, 6)
    expect(y).toBeCloseTo(view.h / 2, 6)
  })
  test('the image corner lands on the offset', () => {
    const { offsetX, offsetY } = coverTransform(img, view)
    expect(pctToScreen([0, 0], img, view)).toEqual([offsetX, offsetY])
  })
})
