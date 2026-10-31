/** Resolves a media path (e.g. 'vid/V01.mp4') against the media host in VITE_MEDIA_BASE. */
export function media(path: string): string {
  const base = (import.meta.env.VITE_MEDIA_BASE ?? '/media').replace(/\/+$/, '')
  return `${base}/${path.replace(/^\/+/, '')}`
}
