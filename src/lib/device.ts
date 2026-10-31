/** Phones, tablets and narrow windows get the "Best on laptop" card instead of the experience. */
export function shouldShowPhoneCard(width: number, finePointer: boolean): boolean {
  return width < 900 || !finePointer
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
