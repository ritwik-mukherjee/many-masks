type Size = { w: number; h: number }

/** How an image of size `img` is scaled and offset when drawn with object-fit: cover into `view`. */
export function coverTransform(img: Size, view: Size): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.max(view.w / img.w, view.h / img.h)
  return { scale, offsetX: (view.w - img.w * scale) / 2, offsetY: (view.h - img.h * scale) / 2 }
}

/** A point given in percent of the image, as screen pixels inside the view. */
export function pctToScreen(p: [number, number], img: Size, view: Size): [number, number] {
  const { scale, offsetX, offsetY } = coverTransform(img, view)
  return [offsetX + (p[0] / 100) * img.w * scale, offsetY + (p[1] / 100) * img.h * scale]
}
