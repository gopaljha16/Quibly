'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const QUIBLY_QUOTES = [
  "Connecting communities, one conversation at a time...",
  "Where every voice matters...",
  "Building bridges through communication...",
  "Your space to belong...",
  "Powered by AI, driven by community...",
  "Real connections, real conversations...",
  "The future of communication is here...",
  "Join the conversation revolution...",
  "Where ideas come to life...",
  "Connect, collaborate, create...",
  "Your digital home awaits...",
  "Bringing people together, everywhere...",
  "Communication without boundaries...",
  "The neural edge of social connection...",
  "Studio-quality conversations, every time...",
  "Smart moderation, seamless experience...",
  "AI-powered, human-centered...",
  "Low latency, high quality connections...",
  "Your community, your rules...",
  "Discover, connect, thrive..."
]

export default function LoadingScreen() {
  const [quote, setQuote] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Pick a random quote
    const randomQuote = QUIBLY_QUOTES[Math.floor(Math.random() * QUIBLY_QUOTES.length)]
    setQuote(randomQuote)

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-[#313338] flex flex-col items-center justify-center z-[9999]">
      {/* Logo */}
      <div className="relative mb-8 animate-bounce">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl">
          <Image 
            src="/logo.png" 
            alt="Quibly Logo" 
            width={96} 
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-4xl font-black text-white mb-4 tracking-wider uppercase italic">
        Quibly
      </h1>

      {/* Quote */}
      <p className="text-[#b5bac1] text-sm mb-8 max-w-md text-center px-4 font-medium animate-fade-in">
        {quote}
      </p>

      {/* Loading Bar */}
      <div className="w-64 h-2 bg-[#1e1f22] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#5865f2] to-cyan-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className="text-[#949ba4] text-xs mt-4 font-semibold uppercase tracking-widest">
        Loading...
      </p>
    </div>
  )
}
