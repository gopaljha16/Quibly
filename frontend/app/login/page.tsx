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
    <div className="min-h-screen bg-[#0b0500] flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#f3c178] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#f35e41] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#f3c178] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-[#f3c178]/20 bg-[#0b0500]/80 backdrop-blur-xl z-10">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[#bdb9b6] hover:text-[#f3c178] transition-colors group">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#f3c178]/20 to-[#f35e41]/20 border border-[#f3c178]/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#f3c178]" />
              <span className="text-sm font-semibold text-[#f3c178]">Welcome back!</span>
            </div>

            <h1 className="text-5xl font-black bg-gradient-to-r from-[#f3c178] via-[#fad48f] to-[#f35e41] bg-clip-text text-transparent">
              Sign In
            </h1>
            <p className="text-[#bdb9b6] text-base">
              Continue to your account
            </p>
          </div>

          {/* Form Card */}
          <div className="relative group animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '100ms' }}>
            {/* Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f3c178] via-[#f35e41] to-[#f3c178] rounded-2xl blur opacity-30 group-hover:opacity-50 transition animate-glow"></div>

            {/* Form */}
            <div className="relative bg-[#1a1510] border border-[#f3c178]/20 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#f3c178] flex items-center gap-2 font-semibold">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-12 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.email ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                      }`}
                    placeholder="your.email@example.com"
                    autoFocus
                  />
                  {errors.email && <p className="text-xs text-[#f35e41]">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#f3c178] flex items-center gap-2 font-semibold">
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
                      className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-12 pr-10 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.password ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-[#f35e41]">{errors.password}</p>}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#f3c178]/30 bg-[#0b0500] text-[#f3c178] focus:ring-[#f3c178] cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-sm text-[#bdb9b6] cursor-pointer hover:text-[#f3c178] transition-colors">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-[#f3c178] hover:text-[#fad48f] font-semibold hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-13 bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold shadow-lg shadow-[#f3c178]/30 transition-all duration-300 mt-6 relative overflow-hidden group"
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
                  <div className="w-full border-t border-[#f3c178]/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#1a1510] text-[#bdb9b6] font-medium">Don't have an account?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-[#bdb9b6] text-sm mb-4">
                  Join thousands of users today
                </p>
                <Link href="/signup">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-2 border-[#f3c178] bg-transparent hover:bg-[#f3c178]/10 text-[#f3c178] hover:text-[#fad48f] font-semibold transition-all duration-300"
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
