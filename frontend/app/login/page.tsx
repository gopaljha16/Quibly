'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, Sparkles } from 'lucide-react'
import { apiPost, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

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
      await apiPost<{ user: unknown; token: string }>('/auth/login', formData)
      router.push('/channels/@me')
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5865f2] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#5865f2] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-xl z-10">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[#b4b4b4] hover:text-[#5865f2] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#4a9eff]" />
              <span className="text-sm font-semibold text-[#4a9eff]">Welcome back!</span>
            </div>

            <h1 className="text-5xl font-black bg-gradient-to-r from-[#23a559] to-[#4a9eff] bg-clip-text text-transparent">
              Sign In
            </h1>
            <p className="text-[#b4b4b4] text-base">
              Continue to your account
            </p>
          </div>

          {/* Form Card */}
          <div className="relative group animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '100ms' }}>
            {/* Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#23a559] to-[#4a9eff] rounded-2xl blur opacity-20 group-hover:opacity-30 transition"></div>

            {/* Form */}
            <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#5865f2] flex items-center gap-2 font-semibold">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`bg-[#141414] border-[#2a2a2a] text-white h-12 focus:border-[#5865f2] focus:ring-2 focus:ring-[#5865f2]/20 ${errors.email ? 'border-[#f23f43] ring-2 ring-[#f23f43]/20' : ''
                      }`}
                    placeholder="your.email@example.com"
                    autoFocus
                  />
                  {errors.email && <p className="text-xs text-[#f23f43]">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#5865f2] flex items-center gap-2 font-semibold">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`bg-[#141414] border-[#2a2a2a] text-white h-12 pr-10 focus:border-[#5865f2] focus:ring-2 focus:ring-[#5865f2]/20 ${errors.password ? 'border-[#f23f43] ring-2 ring-[#f23f43]/20' : ''
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b4b4b4] hover:text-[#5865f2]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-[#f23f43]">{errors.password}</p>}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#2a2a2a] bg-[#141414] text-[#4a9eff] focus:ring-[#4a9eff] cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-sm text-[#b4b4b4] cursor-pointer hover:text-[#5865f2] transition-colors">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-[#5865f2] hover:text-[#7289da] font-semibold hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-13 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold shadow-lg shadow-[#5865f2]/30 transition-all duration-300 mt-6"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 animate-shimmer"></span>
                  {isLoading ? (
                    <span className="flex items-center gap-2 relative z-10">
                      <div className="h-5 w-5 border-2 border-[#0b0500] border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 relative z-10">
                      <LogIn className="h-5 w-5" />
                      Sign In to Account
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a2a]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#1a1a1a] text-[#b4b4b4] font-medium">Don't have an account?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-[#b4b4b4] text-sm mb-4">
                  Join thousands of users today
                </p>
                <Link href="/signup">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-2 border-[#5865f2] bg-transparent hover:bg-[#5865f2]/10 text-[#5865f2] hover:text-[#7289da] font-semibold transition-all duration-300"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
