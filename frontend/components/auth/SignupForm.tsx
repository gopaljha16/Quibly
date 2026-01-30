'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { apiPost, ApiError } from '@/lib/api'
import InterestSelector from '@/components/InterestSelector'
import RecommendedChannelsModal from '@/components/RecommendedChannelsModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function SignupForm() {
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
  const [errors, setErrors] = useState<{
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    interests?: string
  }>({})

  const validateForm = () => {
    const newErrors: {
      username?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3 || formData.username.length > 32) {
      newErrors.username = 'Username must be between 3 and 32 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await apiPost<{
        success: boolean
        message?: string
        user?: unknown
        token?: string
        recommendedChannels?: any[]
      }>(
        '/auth/register',
        { ...formData, interests: selectedInterests }
      )

      // Show recommendations if available
      if (response.recommendedChannels && response.recommendedChannels.length > 0) {
        setRecommendedChannels(response.recommendedChannels)
        setShowRecommendations(true)
      } else {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ email: error.message })
        return
      }
      setErrors({ email: 'An error occurred. Please try again.' })
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
    <>
      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
          {/* Username Field */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <Label htmlFor="username" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              Username
            </Label>
            <div className="relative group">
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                className={`bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all h-11 ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="Choose a unique username"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                {errors.username}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: '50ms' }}>
            <Label htmlFor="email" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-400" />
              Email Address
            </Label>
            <div className="relative group">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all h-11 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-300" style={{ animationDelay: '100ms' }}>
            <Label htmlFor="password" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-400" />
              Password
            </Label>
            <div className="relative group">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all pr-10 h-11 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300" style={{ animationDelay: '150ms' }}>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-400" />
              Confirm Password
            </Label>
            <div className="relative group">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all pr-10 h-11 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Interest Selector - Scrollable Section */}
          <div className="animate-in fade-in slide-in-from-top-5 duration-300" style={{ animationDelay: '200ms' }}>
            <InterestSelector
              selectedInterests={selectedInterests}
              onChange={setSelectedInterests}
              error={errors.interests}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 animate-in fade-in slide-in-from-top-6 duration-300" style={{ animationDelay: '250ms' }}>
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-slate-300 leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors font-medium underline-offset-2 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors font-medium underline-offset-2 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-primary-500 via-[#76cd00] to-accent-500 hover:from-primary-600 hover:via-[#6ab900] hover:to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-top-7 duration-300"
            style={{ animationDelay: '300ms' }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating your account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Create Account
              </span>
            )}
          </Button>
        </form>
      </ScrollArea>

      {/* Recommended Channels Modal */}
      {showRecommendations && (
        <RecommendedChannelsModal
          channels={recommendedChannels}
          onClose={() => {
            setShowRecommendations(false)
            router.push('/login')
            router.refresh()
          }}
        />
      )}
    </>
  )
}
