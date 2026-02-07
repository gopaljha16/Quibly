'use client'

import { useState, useEffect } from 'react'
import { 
  User, Heart, Users, Rocket, Shield, Zap, Globe, Star,
  Sparkles, TrendingUp, Check, MessageSquare, Hash, Radio
} from 'lucide-react'

export default function SignupVisualization() {
  const [activeStep, setActiveStep] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(rotationInterval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('viz-container')?.getBoundingClientRect()
      if (rect) {
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 15,
          y: (e.clientY - rect.top - rect.height / 2) / 15,
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const steps = [
    { 
      icon: User, 
      label: 'CREATE PROFILE', 
      desc: 'Set up your identity', 
      gradient: 'from-purple-500 via-purple-600 to-fuchsia-500',
      shadowColor: 'rgba(168, 85, 247, 0.6)',
      position: { angle: 0 }
    },
    { 
      icon: Heart, 
      label: 'PICK INTERESTS', 
      desc: 'Choose what you love', 
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      shadowColor: 'rgba(236, 72, 153, 0.6)',
      position: { angle: 90 }
    },
    { 
      icon: Users, 
      label: 'JOIN COMMUNITIES', 
      desc: 'Find your tribe', 
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
      shadowColor: 'rgba(6, 182, 212, 0.6)',
      position: { angle: 180 }
    },
    { 
      icon: Rocket, 
      label: 'START CHATTING', 
      desc: 'Connect instantly', 
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      shadowColor: 'rgba(16, 185, 129, 0.6)',
      position: { angle: 270 }
    },
  ]

  return (
    <div id="viz-container" className="relative w-full h-[650px] hidden lg:flex items-center justify-center overflow-visible">
      {/* Dynamic Background with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
            top: '20%',
            left: '30%',
            transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div 
          className="absolute w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
            bottom: '10%',
            right: '20%',
            transform: `translate(${-mousePosition.x * 2}px, ${-mousePosition.y * 2}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Central Orbital System */}
        <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center">
          
          {/* Outer Rotating Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-purple-500/20"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div 
              className="absolute w-[380px] h-[380px] rounded-full border border-dashed border-cyan-500/20"
              style={{ transform: `rotate(${-rotation}deg)` }}
            />
            <div 
              className="absolute w-[340px] h-[340px] rounded-full border border-dotted border-pink-500/15"
              style={{ transform: `rotate(${rotation * 1.5}deg)` }}
            />
          </div>

          {/* Central Hub - Enhanced */}
          <div className="absolute z-30">
            <div className="relative w-36 h-36">
              {/* Animated Pulse Rings */}
              <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full bg-cyan-500/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              
              {/* Main Circle with 3D Effect */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 shadow-2xl flex items-center justify-center"
                style={{
                  boxShadow: `0 0 60px ${steps[activeStep].shadowColor}, 0 0 100px ${steps[activeStep].shadowColor}`,
                  transform: `scale(${1 + Math.sin(rotation * 0.05) * 0.05})`,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative text-center z-10">
                  <div className="text-4xl font-black text-white mb-1">{activeStep + 1}</div>
                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/90">STEP</div>
                </div>
              </div>

              {/* Orbiting Micro Particles */}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * 360 + rotation * 2
                const radius = 70
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white/60"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Orbiting Step Cards - 3D Enhanced */}
          {steps.map((step, index) => {
            const angle = (step.position.angle + rotation * 0.3) * (Math.PI / 180)
            const radius = 210
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            const isActive = index === activeStep
            const isPast = index < activeStep
            const depth = Math.cos(angle) * 50

            return (
              <div
                key={index}
                className="absolute transition-all duration-700 ease-out"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(calc(-50% + ${x}px), calc(-50% + ${y}px))
                    scale(${isActive ? 1.2 : isPast ? 1.05 : 0.9})
                    rotateY(${depth * 0.3}deg)
                    ${isActive ? 'translateZ(30px)' : ''}
                  `,
                  zIndex: isActive ? 20 : isPast ? 15 : 10,
                }}
              >
                <div className="relative group">
                  {/* Mega Glow for Active */}
                  {isActive && (
                    <>
                      <div 
                        className={`absolute -inset-8 bg-gradient-to-br ${step.gradient} opacity-50 blur-3xl rounded-full animate-pulse`}
                        style={{ animationDuration: '2s' }}
                      />
                      <div 
                        className={`absolute -inset-6 bg-gradient-to-br ${step.gradient} opacity-30 blur-2xl rounded-3xl`}
                      />
                    </>
                  )}
                  
                  {/* Card with 3D Transform */}
                  <div 
                    className={`relative w-36 h-40 rounded-3xl border backdrop-blur-2xl transition-all duration-700 overflow-hidden ${
                      isActive 
                        ? 'border-white/50 bg-white/20 shadow-2xl' 
                        : isPast
                        ? 'border-white/30 bg-white/15 shadow-xl'
                        : 'border-white/15 bg-white/5 opacity-70'
                    }`}
                    style={{
                      boxShadow: isActive ? `0 20px 60px ${step.shadowColor}` : undefined,
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} ${isActive ? 'opacity-30' : 'opacity-15'}`} />
                    
                    {/* Shine Effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50" />
                    )}
                    
                    {/* Content */}
                    <div className="relative p-5 flex flex-col items-center justify-center h-full">
                      <div 
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-3 shadow-2xl ${
                          isActive ? 'animate-bounce' : ''
                        }`}
                        style={{
                          boxShadow: isActive ? `0 10px 30px ${step.shadowColor}` : undefined,
                        }}
                      >
                        <step.icon className="w-7 h-7 text-white drop-shadow-lg" />
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white text-center leading-tight mb-1.5">
                        {step.label}
                      </div>
                      <div className="text-[7px] text-gray-300 text-center font-medium">
                        {step.desc}
                      </div>
                    </div>

                    {/* Checkmark Badge */}
                    {isPast && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl border-2 border-black animate-in zoom-in duration-300">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    )}

                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent rounded-full shadow-lg" />
                    )}
                  </div>

                  {/* Connection Line */}
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none -z-10">
                    <line
                      x1="250"
                      y1="250"
                      x2={250 + x}
                      y2={250 + y}
                      stroke={isActive ? step.shadowColor : 'rgba(255, 255, 255, 0.08)'}
                      strokeWidth={isActive ? '3' : '1'}
                      strokeDasharray={isActive ? '0' : '8,4'}
                      className="transition-all duration-700"
                      style={{
                        filter: isActive ? `drop-shadow(0 0 8px ${step.shadowColor})` : 'none',
                      }}
                    />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        {/* Inline Stats - Positioned around the orbit */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6">
          {[
            { icon: Shield, label: 'SECURE', value: '256-bit', gradient: 'from-purple-500 to-purple-600', iconColor: 'text-purple-400' },
            { icon: Zap, label: 'FAST', value: '<50ms', gradient: 'from-yellow-500 to-orange-500', iconColor: 'text-yellow-400' },
            { icon: Globe, label: 'GLOBAL', value: '150+', gradient: 'from-cyan-500 to-blue-500', iconColor: 'text-cyan-400' },
            { icon: Star, label: 'RATING', value: '4.9★', gradient: 'from-pink-500 to-rose-500', iconColor: 'text-pink-400' },
          ].map((stat, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
            >
              <div className={`absolute -inset-1 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-30 blur-xl rounded-2xl transition-all duration-300`} />
              
              <div className="relative px-4 py-3 bg-black/50 border border-white/10 rounded-xl backdrop-blur-xl hover:border-white/25 transition-all hover:scale-105">
                <stat.icon className={`w-5 h-5 ${stat.iconColor} mb-1 mx-auto`} />
                <div className="text-lg font-black text-white text-center">{stat.value}</div>
                <div className="text-[7px] font-black uppercase tracking-[0.15em] text-gray-500 text-center">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ambient Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: ['#a855f7', '#06b6d4', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  )
}
