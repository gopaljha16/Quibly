'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, Sparkles, 
  MessageSquare, Users, Hash, Zap, Terminal, Code, 
  Activity, Radio, Layers, Check
} from 'lucide-react'
import { apiPost, apiGet, ApiError } from '@/lib/api'
import { GoogleLogin } from '@react-oauth/google'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/channels/@me'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; forgot?: string }>({})

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user profile to check if logged in
        await apiGet('/auth/profile')
        // If successful, user is logged in, redirect to channels
        router.push(redirect)
      } catch (error) {
        // User is not logged in, stay on login page
      }
    }
    checkAuth()
  }, [router, redirect])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'

    if (!formData.password) newErrors.password = 'Password is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await apiPost<{ user: unknown; token: string }>('/auth/login', formData)
      if (response && response.token) {
        document.cookie = `token=${response.token}; path=/; max-age=604800`;
      }
      router.push(redirect)
      router.refresh()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ email: error.message })
      } else {
        setErrors({ email: 'Invalid credentials. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      setErrors({ forgot: 'Email is required' })
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      await apiPost('/auth/forgot-password', { email: forgotEmail })
      setForgotSuccess(true)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ forgot: error.message })
      } else {
        setErrors({ forgot: 'Failed to send reset link. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] via-[#111114] to-[#0a0a0c] text-[#eceaf2] font-sans selection:bg-purple-500/40 overflow-hidden">
      
      {/* --- BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#221133_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] py-6 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <Image src="/logo.png" alt="Quibly Logo" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-black tracking-widest uppercase italic hidden sm:block">Quibly</span>
          </Link>
          
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back Home</span>
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="relative min-h-screen pt-20 md:pt-32 pb-20 px-4 md:px-6 flex items-center">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center w-full">
          
          {/* --- LEFT: LOGIN FORM --- */}
          <div className="relative z-10 max-w-md mx-auto lg:mx-0 w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-[10px] font-black tracking-[0.2em] text-purple-400 mb-6 uppercase">
              <Sparkles size={12} /> Secure Access
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-black leading-[0.9] mb-4 tracking-tighter">
              WELCOME <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">BACK.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 font-medium">
              Sign in to continue your journey with Quibly.
            </p>

            {/* Form Card */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-[30px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              
              {/* Form Container */}
              <div className="relative bg-[#18181c] border border-white/10 rounded-[30px] p-8 backdrop-blur-xl">
                {!showForgotPassword ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-white/5 border-white/10 text-white h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-600 ${
                        errors.email ? 'border-red-500 ring-2 ring-red-500/20' : ''
                      }`}
                      placeholder="your.email@quibly.com"
                      autoFocus
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 text-white h-12 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-600 ${
                          errors.password ? 'border-red-500 ring-2 ring-red-500/20' : ''
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="remember"
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="remember" className="text-xs text-gray-400 cursor-pointer hover:text-purple-400 transition-colors font-medium">
                        Remember me
                      </label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider hover:underline transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-purple-400 transition-all shadow-xl shadow-white/10 hover:shadow-purple-400/30 mt-8 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                    {isLoading ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        <LogIn className="h-5 w-5" />
                        Launch Quibly
                      </span>
                    )}
                  </Button>

                  <div className="pt-2">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                          setIsLoading(true)
                          try {
                            const response = await apiPost<{ user: unknown; token: string }>('/auth/google-login', { 
                              googleToken: credentialResponse.credential 
                            })
                            if (response && response.token) {
                              document.cookie = `token=${response.token}; path=/; max-age=604800`;
                            }
                            router.push(redirect)
                            router.refresh()
                          } catch (err) {
                            setErrors({ email: 'Google login failed. Please try again.' })
                          } finally {
                            setIsLoading(false)
                          }
                        }
                      }}
                      onError={() => {
                        setErrors({ email: 'Google login failed' })
                      }}
                      theme="filled_black"
                      size="large"
                      text="continue_with"
                      shape="pill"
                    />
                  </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {forgotSuccess ? (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 uppercase italic">Link Sent!</h2>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                          If an account exists for {forgotEmail}, we've sent a password reset link to your inbox.
                        </p>
                        <Button
                          onClick={() => {
                            setShowForgotPassword(false)
                            setForgotSuccess(false)
                            setForgotEmail('')
                          }}
                          className="w-full h-12 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-purple-400 transition-all shadow-xl"
                        >
                          Back to Login
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              className="text-gray-500 hover:text-purple-400 flex items-center gap-2 transition-all group"
                            >
                              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
                            </button>
                          </div>
                          <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tight">Recover Account</h2>
                          <p className="text-gray-500 text-xs font-medium mb-6">
                            Enter your email to receive a secure recovery link.
                          </p>
                          
                          <Label htmlFor="forgotEmail" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <Mail className="w-3 h-3" />
                            Email Address
                          </Label>
                          <Input
                            id="forgotEmail"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className={`bg-white/5 border-white/10 text-white h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-600 ${
                              errors.forgot ? 'border-red-500 ring-2 ring-red-500/20' : ''
                            }`}
                            placeholder="your.email@quibly.com"
                            autoFocus
                          />
                          {errors.forgot && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-400"></span>
                              {errors.forgot}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-purple-400 transition-all shadow-xl shadow-white/10 mt-4 relative overflow-hidden group"
                        >
                          {isLoading ? (
                            <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                          ) : (
                            "Send Recovery Link"
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-4 bg-[#18181c] text-gray-600 font-black uppercase tracking-widest">New User?</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <Link href="/signup">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* --- RIGHT: ANIMATED VISUALIZATION --- */}
          <div className="relative hidden lg:block">
            <AnimatedVisualization />
          </div>

        </div>
      </div>
    </div>
  )
}

// Animated Visualization Component
function AnimatedVisualization() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 6)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    { icon: MessageSquare, label: 'Real-time Chat', color: 'text-purple-400' },
    { icon: Users, label: 'Communities', color: 'text-fuchsia-400' },
    { icon: Hash, label: 'Channels', color: 'text-emerald-400' },
    { icon: Zap, label: 'Lightning Fast', color: 'text-yellow-400' },
    { icon: Radio, label: 'Voice Rooms', color: 'text-pink-400' },
    { icon: Layers, label: 'Organized', color: 'text-blue-400' },
  ]

  // Pre-calculate positions to avoid hydration mismatch
  const centerX = 300
  const centerY = 300
  const radius = 200
  
  const positions = features.map((_, index) => {
    const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2 // Start from top
    return {
      x: Math.round(Math.cos(angle) * radius * 100) / 100,
      y: Math.round(Math.sin(angle) * radius * 100) / 100,
    }
  })

  if (!mounted) {
    return (
      <div className="relative w-full h-[600px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full border-2 border-white/10 flex items-center justify-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
            <Terminal className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px]">
      {/* Central Hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full border-2 border-white/10 flex items-center justify-center backdrop-blur-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center animate-pulse">
          <Terminal className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Orbiting Features */}
      {features.map((feature, index) => {
        const { x, y } = positions[index]
        const isActive = index === activeIndex

        return (
          <div
            key={index}
            className="absolute top-1/2 left-1/2 transition-all duration-500"
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isActive ? 1.2 : 1})`,
            }}
          >
            <div className={`w-20 h-20 rounded-2xl border ${isActive ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'} backdrop-blur-xl flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isActive ? 'shadow-2xl shadow-purple-500/20' : ''}`}>
              <feature.icon className={`w-8 h-8 ${isActive ? feature.color : 'text-gray-500'} transition-colors duration-500`} />
              <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-600'} transition-colors duration-500`}>
                {feature.label.split(' ')[0]}
              </span>
            </div>
          </div>
        )
      })}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 600">
        {features.map((_, index) => {
          const { x, y } = positions[index]
          const isActive = index === activeIndex

          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={centerX + x}
              y2={centerY + y}
              stroke={isActive ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)'}
              strokeWidth={isActive ? '2' : '1'}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>

      {/* Floating Code Snippets */}
      <div className="absolute top-10 right-10 p-4 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl font-mono text-xs text-purple-400/80 animate-pulse">
        <p>$ quibly.connect()</p>
        <p className="text-white">{'>'} Status: Online</p>
      </div>

      <div className="absolute bottom-10 left-10 p-4 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl font-mono text-xs text-fuchsia-400/80 animate-pulse" style={{ animationDelay: '1s' }}>
        <p>$ users.active</p>
        <p className="text-white">{'>'} 42,000+</p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
      <div className="absolute bottom-32 right-32 w-2 h-2 bg-fuchsia-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] via-[#111114] to-[#0a0a0c] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

