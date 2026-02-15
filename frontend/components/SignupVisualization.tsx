'use client'

import { useState, useEffect } from 'react'
import { User, Heart, Users, Rocket, Terminal } from 'lucide-react'

export default function SignupVisualization() {
  const [activeStep, setActiveStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360)
    }, 50)
    return () => clearInterval(rotationInterval)
  }, [])

  const steps = [
    { icon: User, label: 'Profile', desc: 'Set up identity' },
    { icon: Heart, label: 'Interests', desc: 'Choose topics' },
    { icon: Users, label: 'Communities', desc: 'Find groups' },
    { icon: Rocket, label: 'Chat', desc: 'Start talking' },
  ]

  const positions = steps.map((_, index) => {
    const angle = (index / steps.length) * 2 * Math.PI - Math.PI / 2
    const radius = 180
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })

  if (!mounted) {
    return (
      <div className="relative w-full h-[600px] flex items-center justify-center">
        <div className="w-32 h-32 bg-white/5 rounded-full border-2 border-white/10 flex items-center justify-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Terminal className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      <div className="absolute">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full bg-cyan-500/10 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 shadow-2xl flex items-center justify-center animate-pulse">
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative text-center z-10">
              <div className="text-4xl font-black text-white mb-1">{activeStep + 1}</div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/90">STEP</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-10 right-10 p-4 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl font-mono text-xs text-purple-400/80 animate-pulse">
        <p>$ quibly.signup()</p>
        <p className="text-white">{'>'} Welcome!</p>
      </div>
    </div>
  )
}
