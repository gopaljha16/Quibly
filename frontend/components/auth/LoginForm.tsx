'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useLoginController } from '@/controllers/auth/useLoginController'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const { formData, errors, isLoading, handleChange, handleSubmit } = useLoginController()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <LogIn className="w-6 h-6 text-primary-400" />
          Welcome Back
        </h2>
        <p className="text-sm text-slate-400">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <Label htmlFor="email" className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`bg-[#030305] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-11 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 animate-in slide-in-from-top-1">
              <span className="w-1 h-1 rounded-full bg-red-400"></span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: '50ms' }}>
          <Label htmlFor="password" className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`bg-[#030305] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 pr-10 h-11 transition-all ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-cyan-400 transition-colors p-1"
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-300" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center space-x-2">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label htmlFor="remember-me" className="text-sm text-slate-300 cursor-pointer">
              Remember me
            </label>
          </div>
          <a
            href="#"
            className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors underline-offset-2 hover:underline"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary-500 via-[#76cd00] to-accent-500 hover:from-primary-600 hover:via-[#6ab900] hover:to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-top-4 duration-300"
          style={{ animationDelay: '150ms' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}
