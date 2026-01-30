'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, ArrowLeft, Check } from 'lucide-react'
import { apiPost, ApiError } from '@/lib/api'
import InterestSelector from '@/components/InterestSelector'
import RecommendedChannelsModal from '@/components/RecommendedChannelsModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [recommendedChannels, setRecommendedChannels] = useState<any[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.username) newErrors.username = 'Username is required'
    else if (formData.username.length < 3 || formData.username.length > 32)
      newErrors.username = 'Username must be between 3 and 32 characters'

    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await apiPost<any>('/auth/register', { ...formData, interests: selectedInterests })

      if (response.recommendedChannels?.length > 0) {
        setRecommendedChannels(response.recommendedChannels)
        setShowRecommendations(true)
      } else {
        // Directly go to channels instead of login
        router.push('/channels/@me')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ email: error.message })
      } else {
        setErrors({ email: 'An error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: undefined }))
  }

  return (
    <div className="min-h-screen bg-[#0b0500] flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f3c178] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f35e41] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#f3c178] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-[#f3c178]/20 bg-[#0b0500]/80 backdrop-blur-xl z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#bdb9b6] hover:text-[#f3c178] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </Link>
          <div className="text-sm text-[#bdb9b6]">
            Step <span className="text-[#f3c178] font-bold">1</span> of 2
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-xl">
          {/* Title */}
          <div className="text-center mb-8 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#f3c178]/20 to-[#f35e41]/20 border border-[#f3c178]/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#f3c178]" />
              <span className="text-sm font-semibold text-[#f3c178]">Join our community</span>
            </div>

            <h1 className="text-5xl font-black bg-gradient-to-r from-[#f3c178] via-[#fad48f] to-[#f35e41] bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-[#bdb9b6] text-base">
              Start your journey with us today
            </p>
          </div>

          {/* Form Card */}
          <div className="relative group animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '100ms' }}>
            {/* Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f3c178] via-[#f35e41] to-[#f3c178] rounded-2xl blur opacity-30 group-hover:opacity-50 transition animate-glow"></div>

            {/* Form */}
            <div className="relative bg-[#1a1510] border border-[#f3c178]/20 rounded-2xl p-6 shadow-2xl">
              {/* Form Header */}
              <div className="mb-6 pb-4 border-b border-[#f3c178]/10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#f3c178] to-[#f35e41] bg-clip-text text-transparent">
                  Create Account
                </h2>
                <p className="text-sm text-[#bdb9b6] mt-1">Fill in your details to get started</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#fef9f0] font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-11 placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.username ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                        }`}
                      placeholder="Choose a unique username"
                    />
                    {!errors.username && formData.username && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    )}
                  </div>
                  {errors.username && <p className="text-xs text-[#f35e41]">{errors.username}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#fef9f0] font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-11 placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.email ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                        }`}
                      placeholder="you@example.com"
                    />
                    {!errors.email && formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    )}
                  </div>
                  {errors.email && <p className="text-xs text-[#f35e41]">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#fef9f0] font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-11 pr-10 placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.password ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                        }`}
                      placeholder="Create a strong password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#fef9f0] font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] h-11 pr-10 placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.confirmPassword ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                        }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-[#f35e41]">{errors.confirmPassword}</p>}
                </div>

                {/* Interests */}
                <div className="pt-2">
                  <InterestSelector
                    selectedInterests={selectedInterests}
                    onChange={setSelectedInterests}
                    allowSkip={true}
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-3 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 rounded border-[#f3c178]/30 bg-[#0b0500] text-[#f3c178] focus:ring-[#f3c178] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-[#bdb9b6] cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-[#f3c178] hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#f3c178] hover:underline">Privacy Policy</a>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold shadow-lg shadow-[#f3c178]/30 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 animate-shimmer"></span>
                  {isLoading ? (
                    <span className="flex items-center gap-2 relative z-10">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 relative z-10">
                      <Sparkles className="h-5 w-5" />
                      Create My Account
                    </span>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center mt-6 text-sm text-[#bdb9b6]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#f3c178] hover:text-[#fad48f] font-semibold underline-offset-2 hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRecommendations && (
        <RecommendedChannelsModal
          channels={recommendedChannels}
          onClose={() => {
            setShowRecommendations(false)
            router.push('/channels/@me')
          }}
        />
      )}
    </div>
  )
}
