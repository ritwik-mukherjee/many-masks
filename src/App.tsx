import { useState } from 'react'
import PhoneCard from './components/PhoneCard'
import Experience from './Experience'
import { shouldShowPhoneCard } from './lib/device'

const finePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
const decide = () => shouldShowPhoneCard(typeof innerWidth === 'number' ? innerWidth : 1440, finePointer())

// Decided once at load: snapping a laptop window to half-screen or docking DevTools must not wipe the journey.
export default function App() {
  const [phone] = useState(decide)
  return phone ? <PhoneCard /> : <Experience />
}
