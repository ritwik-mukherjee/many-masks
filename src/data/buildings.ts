export type District = 'founder' | 'growth' | 'builder' | 'workshop' | 'finale'
export type BuildingId = 'B01' | 'B02' | 'B03' | 'B04' | 'B05' | 'B06' | 'B07' | 'B08' | 'B09' | 'B10' | 'B11' | 'B12' | 'B13'

export interface Building {
  id: BuildingId
  name: string
  district: District
  hook: string
  /** Polygon in percent of H01 width/height, 0..100. */
  hotspot: [number, number][]
  priority: 'M' | 'S'
  /** 'vid/V01.mp4'; absent means the 2.5D push-in fallback. */
  clip?: string
  landing: string
  panel: string
  voice: string
  transcript: string
  built: string
  proof: string
  cracked?: string
  /** Related projects shown under the chapter. */
  more?: { name: string; note: string; url?: string }[]
}

export const districtNames: Record<District, string> = {
  founder: 'Founder district',
  growth: 'Growth district',
  builder: 'Builder district',
  workshop: 'The workshop',
  finale: 'Bengaluru',
}

// Every swing is a real first-person clip; two cuts alternate so repeat visits feel different.
const media = (n: string) => ({ clip: Number(n) % 2 ? 'vid/swing-a.mp4' : 'vid/swing-b.mp4', landing: `img/K${n}.jpg`, panel: `img/P${n}.jpg`, voice: `aud/A-B${n}.mp3` })

export const buildings: Building[] = [
  {
    id: 'B01', name: 'CET Campus Circle', district: 'founder', priority: 'M', ...media('01'),
    hook: 'The tallest thing I built. Admissions advisory, zero ads.',
    hotspot: [[23.4, 5], [29.2, 4], [29.5, 40], [23.4, 40]],
    built: 'A paid admissions advisory for the Maharashtra CAP rounds, plus a Python pipeline that reads a 1,580 page cutoff PDF and turns it into ranked, risk banded recommendations in minutes.',
    proof: 'Free community of 150+ students from Reddit. 30 to 35 paid. Zero paid ads. ₹1,000 early bird, first payment within minutes; 10 to 15 referred students chose the ₹2,500 tier.',
    cracked: 'A student was unhappy and my co-founders disagreed on a refund. I refunded him in full from my own share.',
    transcript: "CET Campus Circle is my admissions advisory for the Maharashtra CAP rounds. We grew a free community of over 150 students from Reddit, and 30 to 35 of them paid, with zero ads. I wrote a pipeline that reads a 1,580 page cutoff PDF, so every student got ranked options in minutes, not hours. The hardest call: one student wasn't happy, my co-founders didn't agree on a refund, so I paid it back in full from my own share.",
  },
  {
    id: 'B02', name: 'Velnora', district: 'founder', priority: 'M', ...media('02'),
    hook: 'An AI agency. The lights went out in October.',
    hotspot: [[51.5, 40], [63, 40], [63, 55], [51.5, 55]],
    built: 'An AI automation agency co-founded with Vivaan Muttoo: custom CRMs and workflow automation, owned end to end from cold discovery and pricing to contracts, delivery and handover.',
    proof: '5+ paying clients across salons, gyms, real estate and enterprise services.',
    cracked: 'Paused in October 2026.',
    transcript: 'Velnora was the AI automation agency I co-founded with Vivaan. Salons, gyms, real estate: five plus paying clients, from the cold call to the contract to the handover. Biggest lesson: what a client asks for is almost never the workflow they actually run. We paused it in October.',
  },
  {
    id: 'B03', name: 'The Fusion Street', district: 'founder', priority: 'S', ...media('03'),
    hook: 'A food stall, before any of the tech.',
    hotspot: [[33, 79], [44, 72], [55, 70], [67, 66], [69, 70], [56, 76], [44, 84], [36, 86]],
    built: 'A street food stall I co-founded.',
    proof: '₹10,000+ in sales in a single day.',
    transcript: 'Before any of the tech, there was a food stall. The Fusion Street. We did over ten thousand rupees in sales in a single day. Nothing teaches you selling like a walk-in customer who can just keep walking.',
  },
  {
    id: 'B04', name: 'Palo', district: 'growth', priority: 'M', ...media('04'),
    hook: "I opened Mumbai for a Bay Area startup. 4+ clients in month one.",
    hotspot: [[74.6, 27.5], [84.5, 28], [84.5, 53], [74.6, 53]],
    built: 'The Mumbai market entry for a San Francisco Bay Area startup: the go to market and the sales systems behind it, as a part time GTM and Sales Strategist working remotely across a 12 hour time difference.',
    proof: '4+ clients onboarded in the first month. Ad hoc outreach turned into a repeatable process.',
    transcript: "At Palo I was the Mumbai face of a San Francisco Bay Area startup, working remotely across a twelve hour time difference. I built their Mumbai go-to-market and their sales systems, onboarded four plus clients in the first month, and turned ad hoc outreach into a process anyone could repeat. This is the job I want at Wispr: take a product built in San Francisco and make it win in India. As the sun sets here, Palo's day starts.",
  },
  {
    id: 'B05', name: 'The 220K billboard', district: 'growth', priority: 'S', ...media('05'),
    hook: 'My best post. And proposals that stopped losing deals.',
    hotspot: [[61.8, 19.5], [69.5, 19.5], [69.5, 29], [72, 30], [72, 55], [63.5, 55], [63.5, 30]],
    built: 'At Campayn.in (AI Product Manager intern, picked from 300+ applicants) I found client proposals were an unflagged conversion bottleneck, redesigned them, measured the lift and automated the fix. Separately, a Pitch Deck Intelligence Engine sold behind a paywall.',
    proof: 'Best LinkedIn post: 220,000+ impressions.',
    transcript: "My best LinkedIn post crossed 220,000 impressions. I post often, and I'm comfortable on camera. At Campayn, where I was picked from over 300 applicants, I noticed client proposals were quietly losing deals. So I redesigned them, measured the lift, and automated the fix.",
  },
  {
    id: 'B06', name: 'Wagle Estate', district: 'growth', priority: 'S', ...media('06'),
    hook: 'Teaching my neighbourhood to build with AI.',
    hotspot: [[37, 53.5], [48, 53.5], [53, 59], [52.5, 69], [31.5, 66], [31.5, 59]],
    built: 'Sessions on Claude, MCPs, skills and building agents for residents of Wagle Estate, over four days of my own holidays.',
    proof: '6+ sessions, 50+ residents, 16 hours. Some attendees now build websites for local businesses.',
    cracked: 'I nearly gave up. Getting a crowd to show up was the hardest part.',
    transcript: 'Over four days of my holidays, I ran six plus sessions for fifty plus residents of Wagle Estate, teaching them Claude. Sixteen hours. Honestly, I nearly gave up, because getting people to show up was the hardest part. Some of them now build websites for local businesses.',
  },
  {
    id: 'B07', name: 'Claude Build Day', district: 'builder', priority: 'M', ...media('07'),
    hook: 'Went twice. Won twice. Youngest both times.',
    hotspot: [[38, 23], [50, 23], [50, 42], [38, 42]],
    built: 'AI Game Director: a physical multiplayer game that Claude directs live through safe, structured events. Ragdoll.AI: a browser physics fighter where typed prompts mutate the fighter.',
    proof: 'Two time winner of Claude Build Day Mumbai, youngest winner both times. One of 3 winners from about 80 builders, then one of 2 winners.',
    transcript: 'Claude Build Day Mumbai. I went twice and won twice, the youngest winner both times. First, AI Game Director, a physical multiplayer game that Claude directs live, one of three winners out of about eighty builders. Then Ragdoll.AI, where your prompts rewrite the fighter mid-fight.',
  },
  {
    id: 'B08', name: 'Sadie and the voice stack', district: 'builder', priority: 'M', ...media('08'),
    hook: 'Voice agents that answer real calls, and a skill that gives Claude an ear.',
    hotspot: [[73.5, 54], [79.5, 54], [79.5, 73], [73.5, 73]],
    built: 'Sadie: a multi-tenant inbound voice agent over SIP or browser, with real-time transcription, interruptions and five tools. Retargeted from an Indian sales persona to a US HVAC dispatcher with one new file.',
    proof: '3,186 lines of Python. Time to first token cut from 1.075s to 0.728s. 13 silent defects root caused.',
    more: [
      { name: 'speech-signals', url: 'https://github.com/ritwik-mukherjee/speech-signals', note: 'Open source Claude Code skill that gives Claude an ear. It measures how you sounded from the waveform (fillers, restarts, pace, pauses, pitch, energy, trailing off), and every coaching note cites a timestamp. Nothing leaves your machine.' },
      { name: 'Voice booking agent with an independent verifier', note: 'Retell, Make, Google Calendar and Maps. 67 tests and a script that recomputes every answer from the execution log, which caught silent defects like a calendar an hour out of timezone.' },
      { name: 'Dental front desk voice demo', note: 'A browser voice agent for a fictional clinic, built on Pipecat, Deepgram, Groq and Silero: it books, reschedules and answers questions with a live transcript.' },
    ],
    transcript: 'Sadie is a voice agent that answers real phone calls. Over three thousand lines of Python. I cut the time to first token from 1.075 seconds to 0.728, and tracked down thirteen bugs that never threw a single error. Turning it from an Indian sales agent into a US HVAC dispatcher took one new file. Another mask. I also open sourced speech-signals, a skill that gives Claude an ear: it measures how you actually sounded, and every note cites a timestamp.',
  },
  {
    id: 'B09', name: 'GPU BenchLab', district: 'builder', priority: 'S', ...media('09'),
    hook: 'When accuracy says 100% and is still wrong.',
    hotspot: [[85, 40.5], [98.5, 41], [98.5, 60], [80.5, 60], [80.5, 53.5], [85, 53.5]],
    built: 'An inference benchmarking framework for PyTorch, ONNX Runtime and TensorRT on an NVIDIA L4.',
    proof: '495 automated tests, 536 immutable evidence files. TF32, the silent default, produced errors 11.8x to 14.7x over tolerance while top 1 accuracy stayed at 100%.',
    transcript: 'GPU BenchLab benchmarks AI models on an NVIDIA L4, with 495 automated tests. The interesting part: a silent default called TF32 pushed errors twelve to fifteen times past tolerance, while accuracy still read a hundred percent. Accuracy alone would have lied to me.',
  },
  {
    id: 'B10', name: 'L&T Heavy Engineering', district: 'builder', priority: 'S', ...media('10'),
    hook: 'No problem statement. So I went looking.',
    hotspot: [[8, 44], [24, 41], [32, 46], [32, 60], [8, 57]],
    built: 'As a business development intern, found manual document workflows nobody had flagged and shipped two internal tools from problem definition to documented software in use.',
    proof: 'The deck generator cut production effort by an estimated 70 to 80%.',
    transcript: 'At L&T Heavy Engineering, nobody gave me a problem statement. So I went looking, found two manual workflows nobody had flagged, and shipped two internal tools. One of them cut the effort of building decks by an estimated seventy to eighty percent.',
  },
  {
    id: 'B11', name: 'HollrAI', district: 'builder', priority: 'S', ...media('11'),
    hook: 'I throw 33 Indian callers at voice agents to see what breaks.',
    hotspot: [[5.8, 28], [11.2, 27.5], [11.2, 42], [5.8, 42]],
    built: 'Forward deployed engineer intern at a voice AI startup, from October 2026, working with the cofounders. Building order confirmation and cart recovery dashboards and workflows for a D2C client.',
    proof: '33 Indian edge case scenarios, 12 LLM judge checks, and code checks on every turn of every test call.',
    more: [
      { name: 'hollr-eval', note: 'Throws 33 realistic Indian callers at a voice agent: flirting, angry callers, "where did you get my number?", someone else picking up, Hinglish switches, interruptions, long silences, family chatter in the background. It scores every turn, suggests small prompt fixes, then re-tests to prove what got better and that nothing else broke.' },
      { name: 'Agent builder', note: 'Turns a client intake into voice prompts, analysis prompts, runtime config and a setup sheet, so a new voice agent starts from the same blueprint.' },
    ],
    transcript: "Right now I'm a forward deployed engineer intern at HollrAI, a voice AI startup. Forward deployed means you work inside the client's business until you understand it better than the brief does. I built a test rig that throws thirty three Indian callers at a voice agent: angry ones, flirting ones, Hinglish switches, family chatter in the background. Then it fixes the prompt and proves the fix worked. Another mask.",
  },
  {
    id: 'B12', name: 'The workshop', district: 'workshop', priority: 'M', ...media('12'),
    hook: "Not everything here works yet. That's the point.",
    hotspot: [[80, 61], [95.5, 61], [95.5, 76.5], [80, 76.5]],
    built: 'A wrist worn gesture controller (ESP32, MPU6050) for a drone over WiFi/UDP with a 50Hz rate limiter and a 0.5s motor failsafe. A Mumbai Local ticket LED board (RP2040, USB C). An FPGA plant care controller in VHDL, entered in Schneider Electric Yuva Yodha Tech.',
    proof: 'Firmware and receiver complete. The LED board is at design stage.',
    cracked: 'The drone has never flown: hardware bring up is still in progress. The plant controller taught me indoor hydroponics has an energy per kg problem.',
    transcript: 'This is my workshop, and not everything here works yet. That drone has never flown. The wrist controller, the rate limiter, the failsafe that cuts the motors in half a second: all written. The hardware still isn\'t there. Next to it, a Mumbai local ticket LED board, and an FPGA plant controller that taught me indoor farming has an energy problem.',
  },
  {
    id: 'B13', name: 'Wispr Flow India', district: 'finale', priority: 'M',
    hook: 'The one I want next.',
    hotspot: [[90.5, 24], [95.5, 24], [95.5, 34], [90.5, 34]],
    landing: 'img/F02.jpg', panel: 'img/F05.jpg', voice: 'aud/A-F02.mp3',
    built: "You've been wearing my masks. Here's the one I want next.",
    proof: "India is about 14% of Flow's installs but about 2% of its revenue, and growth hit about 100% month on month after the Hinglish launch. So the gap isn't attention, it's people who pay. I'd start where I've already sold: students and creators who talk faster than they type, using the kind of referral loop that got CET Campus Circle 30 to 35 paying students with zero ads. Then Hinglish-first creator campaigns that show Flow working in real, noisy India.",
    transcript: "Hi, I'm Ritwik. You've been wearing my masks: the student, the founder, the builder, the Mumbai face of a company on the other side of the world. Here's the one I want next: growing Wispr Flow in India.",
  },
]

export const buildingById = (id: BuildingId): Building => {
  const b = buildings.find((x) => x.id === id)
  if (!b) throw new Error(`unknown building ${id}`)
  return b
}
