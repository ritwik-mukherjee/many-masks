import { useRef, useState } from 'react'
import { links } from '../data/links'
import { media } from '../lib/media'

export default function PhoneCard() {
  const [note, setNote] = useState<string | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const url = typeof location === 'undefined' ? '' : location.href

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(url)
      setNote('Link copied')
    } catch {
      urlRef.current?.select()
      setNote('Link selected, copy it manually')
    }
  }

  return (
    <main className="phone-card">
      <img
        className="phone-card__poster"
        src={media('img/O01.jpg')}
        alt="A dark desk at night: yellow goggles and a cream face wrap resting on a maroon jacket, the Mumbai skyline through the window"
      />
      <div className="phone-card__body">
        <p className="phone-card__name">Ritwik Mukherjee</p>
        <h1 className="phone-card__title">Best on laptop</h1>
        <p>
          Many Masks is a portfolio you swing through: a first-person ride across Mumbai's rooftops, where every
          building is something I built. It needs a big screen and a mouse.
        </p>
        <div className="phone-card__copy">
          <input ref={urlRef} readOnly value={url} aria-label="Portfolio link" />
          <button type="button" onClick={copy}>Copy link</button>
        </div>
        {note && <p role="status">{note}</p>}
        <a href={links.resume}>Read my resume instead</a>
      </div>
    </main>
  )
}
