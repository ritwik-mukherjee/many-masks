/** Maps scroll progress (any number) to a video time, clamped to just before the last frame. */
export function scrollToTime(progress: number, duration: number): number {
  const p = Math.max(0, Math.min(1, progress))
  return Math.min(p * duration, duration - 0.05)
}

/** Seek only when no seek is in flight and the target has moved at least one frame: idle scrubbing costs nothing. */
export function shouldSeek(current: number, target: number, seeking: boolean, fps = 30): boolean {
  return !seeking && Math.abs(target - current) >= 1 / fps
}
