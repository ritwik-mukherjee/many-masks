import { useState } from 'react'
import { growth } from '../data/growth'
import { links } from '../data/links'
import { marks } from '../data/marks'
import { media } from '../lib/media'
import HowBuilt from './HowBuilt'
import Mark from './Mark'

const Bars = () => (
  <span className="growth__bars" aria-hidden="true">
    <i /><i /><i /><i /><i /><i /><i />
  </span>
)

/**
 * The last page. The mask is off, so the comic ink gives way to Wispr's own world: the mask he wants next.
 * Raw speech runs into the pill and comes out clean, which is the product and the argument in one line.
 */
export default function Growth({ onBack }: { onBack: () => void }) {
  const [howOpen, setHowOpen] = useState(false)
  const { installs, revenue } = growth.gap

  return (
    <div className="growth">
      <section className="growth__open">
        <p className="growth__byline">Ritwik Mukherjee, for growth at Wispr Flow</p>
        <h2 className="growth__title">Growing Wispr Flow <em>in India.</em></h2>
        <div className="growth__ribbon" aria-label={`Spoken: ${growth.ribbon.raw} Written: ${growth.ribbon.clean}`} role="img">
          <div className="growth__strip growth__strip--raw" aria-hidden="true"><span>{growth.ribbon.raw} {growth.ribbon.raw} {growth.ribbon.raw} </span></div>
          <div className="growth__pill" aria-hidden="true"><Bars /></div>
          <div className="growth__strip growth__strip--clean" aria-hidden="true"><span>{growth.ribbon.clean} {growth.ribbon.clean} {growth.ribbon.clean} </span></div>
        </div>
      </section>

      <section className="growth__gap">
        <h3 className="growth__gap-line">{growth.gap.line}</h3>
        <figure className="growth__chart" aria-label={`India is about ${installs}% of Flow's installs but about ${revenue}% of its revenue.`}>
          <div className="growth__row">
            <span className="growth__value">{installs}%</span>
            <div className="growth__track"><div className="growth__bar" style={{ width: `${(installs / installs) * 100}%` }} /></div>
            <span className="growth__label">of Flow’s installs</span>
          </div>
          <div className="growth__row">
            <span className="growth__value">{revenue}%</span>
            <div className="growth__track"><div className="growth__bar" style={{ width: `${(revenue / installs) * 100}%` }} /></div>
            <span className="growth__label">of its revenue</span>
          </div>
          <figcaption>{growth.gap.caption}</figcaption>
        </figure>
      </section>

      <section className="growth__plan">
        <h3>Where I’d start</h3>
        <ol>
          {growth.steps.map((step) => (
            <li key={step.title}>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <aside className="growth__proof">
          <h3>I’ve done this before, remotely</h3>
          <p>{growth.proof.built}</p>
          <p className="growth__proof-result">{growth.proof.result}</p>
        </aside>
      </section>

      <section className="growth__close">
        <img className="growth__me" src={media('img/R01.jpg')} alt="Ritwik Mukherjee giving a thumbs up to the camera" />
        <h3 className="growth__ask">Let’s talk.</h3>
        <a className="growth__email" href={`mailto:${links.email}`}>{links.email}</a>
        <ul className="growth__links">
          {links.linkedin && <li><a href={links.linkedin} target="_blank" rel="noreferrer"><Mark mark={marks.linkedin} /> LinkedIn</a></li>}
          <li><a href={links.github} target="_blank" rel="noreferrer"><Mark mark={marks.github} /> GitHub</a></li>
          {links.resume && <li><a href={links.resume} target="_blank" rel="noreferrer">Resume</a></li>}
        </ul>
        <div className="growth__actions">
          <button type="button" onClick={() => setHowOpen(true)}>How this was built</button>
          <button type="button" onClick={onBack}>Back to the city</button>
        </div>
      </section>
      {howOpen && <HowBuilt onClose={() => setHowOpen(false)} />}
    </div>
  )
}
