/** Maps scroll progress (any number) to a video time, clamped to just before the last frame. */
export function scrollToTime(progress: number, duration: number): number {
  const p = Math.max(0, Math.min(1, progress))
  return Math.min(p * duration, duration - 0.05)
}
