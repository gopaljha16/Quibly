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
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#111114] to-[#0a0a0c] flex flex-col items-center justify-center z-[9999]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[30%] w-[300px] h-[300px] bg-fuchsia-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo */}
      <div className="relative mb-8 animate-bounce z-10">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
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
      <h1 className="text-4xl font-black text-white mb-4 tracking-wider uppercase italic z-10">
        Quibly
      </h1>

      {/* Quote */}
      <p className="text-gray-400 text-sm mb-8 max-w-md text-center px-4 font-medium animate-fade-in z-10">
        {quote}
      </p>

      {/* Loading Bar */}
      <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden z-10">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className="text-gray-500 text-[10px] mt-4 font-black uppercase tracking-[0.2em] z-10">
        Loading...
      </p>
    </div>
  )
}
