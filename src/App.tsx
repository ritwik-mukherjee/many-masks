import { useEffect, useState } from 'react'
import PhoneCard from './components/PhoneCard'
import { shouldShowPhoneCard } from './lib/device'

const finePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
const decide = () => shouldShowPhoneCard(typeof innerWidth === 'number' ? innerWidth : 1440, finePointer())

export default function App() {
  const [phone, setPhone] = useState(decide)

  useEffect(() => {
    const onResize = () => setPhone(decide())
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [])

  return phone ? <PhoneCard /> : <main className="experience" />
}
