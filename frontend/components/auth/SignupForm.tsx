'use client'

import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { useSignupController } from '@/controllers/auth/useSignupController'
import InterestSelector from '@/components/InterestSelector'
import RecommendedChannelsModal from '@/components/RecommendedChannelsModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function SignupForm() {
  const {
    formData,
    selectedInterests,
    errors,
    isLoading,
    recommendedChannels,
    showRecommendations,
    handleChange,
    handleInterestsChange,
    handleSubmit,
    closeRecommendations,
  } = useSignupController()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-400" />
          Create Your Account
        </h2>
        <p className="text-sm text-slate-400">
          Join thousands of communities worldwide
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <Label htmlFor="username" className="text-sm font-semibold text-[#f3c178] flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </Label>
            <div className="relative group">
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 h-11 transition-all ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
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

          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: '50ms' }}>
            <Label htmlFor="email" className="text-sm font-semibold text-[#f3c178] flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <div className="relative group">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 h-11 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
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

          <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-300" style={{ animationDelay: '100ms' }}>
            <Label htmlFor="password" className="text-sm font-semibold text-[#f3c178] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <div className="relative group">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 pr-10 h-11 transition-all ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178] transition-colors p-1"
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
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#f3c178] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Confirm Password
            </Label>
            <div className="relative group">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 pr-10 h-11 transition-all ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178] transition-colors p-1"
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
              onChange={handleInterestsChange}
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
          onClose={closeRecommendations}
        />
      )}
    </>
  )
}
