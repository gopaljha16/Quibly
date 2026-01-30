'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Users, Shield, Zap, Sparkles, ArrowRight, Circle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const features = [
    {
      icon: MessageSquare,
      title: 'Lightning Chat',
      description: 'Real-time messaging that feels instant'
    },
    {
      icon: Users,
      title: 'Vibrant Communities',
      description: 'Thousands of servers waiting for you'
    },
    {
      icon: Shield,
      title: 'Fort Knox Security',
      description: 'Your privacy, our priority'
    },
    {
      icon: Zap,
      title: 'Blazing Speed',
      description: 'Optimized for performance'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0b0500] relative overflow-x-hidden">
      {/* Cursor spotlight glow - follows mouse */}
      <div
        className="fixed pointer-events-none z-30 transition-opacity duration-300"
        style={{
          left: mousePos.x - 300,
          top: mousePos.y - 300,
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(243, 193, 120, 0.15) 0%, rgba(243, 94, 65, 0.1) 30%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#f3c178] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#f3c178]/10 bg-[#0b0500]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#f3c178] to-[#f35e41] rounded-xl blur group-hover:blur-lg transition-all"></div>
                <div className="relative w-10 h-10 bg-gradient-to-r from-[#f3c178] to-[#f35e41] rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#0b0500]" />
                </div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-[#f3c178] to-[#f35e41] bg-clip-text text-transparent">
                Nexus
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLoginOpen(true)}
                className="text-[#bdb9b6] hover:text-[#f3c178] hover:bg-[#f3c178]/10"
              >
                Login
              </Button>
              <Button
                onClick={() => setSignupOpen(true)}
                className="bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold shadow-lg shadow-[#f3c178]/30 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                <span className="relative z-10">Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Fits in viewport */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto text-center space-y-6">


            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '100ms' }}>
              <span className="block text-[#fef9f0]">Where</span>
              <span className="block bg-gradient-to-r from-[#f3c178] via-[#fad48f] to-[#f35e41] bg-clip-text text-transparent">
                Communities
              </span>
              <span className="block text-[#fef9f0]">Thrive</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#bdb9b6] max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
              Connect with millions. Chat in real-time. Build your tribe.
              <span className="block mt-2 text-[#f3c178] font-semibold">It's free. It's fast. It's fun.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
              <Button
                onClick={() => setSignupOpen(true)}
                className="bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-black text-lg h-14 px-10 shadow-2xl shadow-[#f3c178]/40 relative overflow-hidden group transform hover:scale-105 transition-all"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                <Sparkles className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Join Free Now</span>
                <ArrowRight className="w-5 h-5 ml-2 relative z-10" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setLoginOpen(true)}
                className="border-2 border-[#f3c178] text-[#f3c178] hover:bg-[#f3c178]/10 text-lg h-14 px-10 font-bold backdrop-blur-xl"
              >
                I Have an Account
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 pt-6 text-sm animate-in fade-in duration-700" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                <span className="text-[#bdb9b6]">10+ online</span>
              </div>
              <div className="w-px h-4 bg-[#f3c178]/30"></div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#f3c178] fill-[#f3c178]" />
                <span className="text-[#bdb9b6]">4.9/5 rated</span>
              </div>
              <div className="w-px h-4 bg-[#f3c178]/30"></div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#f3c178]" />
                <span className="text-[#bdb9b6]">100% secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1510]/30 to-transparent"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-[#f3c178] to-[#f35e41] bg-clip-text text-transparent">
                Supercharged Features
              </span>
            </h2>
            <p className="text-[#bdb9b6] text-lg">Everything you need, nothing you don't</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="relative group animate-in fade-in slide-in-from-bottom-8 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f3c178] to-[#f35e41] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>

                  <div className="relative p-8 rounded-2xl bg-[#0b0500]/80 border border-[#f3c178]/20 hover:border-[#f3c178]/60 transition-all duration-300 group-hover:transform group-hover:scale-105 backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f3c178]/20 to-[#f35e41]/20 flex items-center justify-center mb-5 border border-[#f3c178]/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-[#f3c178]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#f3c178] mb-3">{feature.title}</h3>
                    <p className="text-[#bdb9b6] leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto text-center relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f3c178]/20 border border-[#f3c178]/30 mb-4">
            <Sparkles className="w-4 h-4 text-[#f3c178]" />
          </div>

          <h2 className="text-5xl md:text-6xl font-black">
            <span className="block text-[#fef9f0] mb-2">Ready to dive in?</span>
            <span className="bg-gradient-to-r from-[#f3c178] via-[#fad48f] to-[#f35e41] bg-clip-text text-transparent">
              Your community awaits
            </span>
          </h2>

          <p className="text-xl text-[#bdb9b6] max-w-2xl mx-auto">
            Join thousands of thriving communities. Start chatting in seconds.
          </p>

          <Button
            onClick={() => setSignupOpen(true)}
            className="bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-black text-xl h-16 px-12 shadow-2xl shadow-[#f3c178]/50 relative overflow-hidden group transform hover:scale-110 transition-all"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
            <Sparkles className="w-6 h-6 mr-3 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="relative z-10">Start Your Journey</span>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f3c178]/10 py-8 bg-[#0b0500]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#bdb9b6] text-sm">
            ©  STRIKE Crafted by Sakshi <span className="text-[#f35e41]">♥</span> for communities worldwide.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="bg-[#1a1510] border-[#f3c178]/20">
          <LoginForm />
        </DialogContent>
      </Dialog>

      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="bg-[#1a1510] border-[#f3c178]/20 max-h-[90vh] overflow-y-auto">
          <SignupForm />
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  )
}
