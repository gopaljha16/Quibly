'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Lock, Eye, EyeOff, Sparkles, LogIn, ArrowLeft, Shield, Check, Loader2
} from 'lucide-react'
import { apiPost, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const userId = searchParams.get('userId')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const validateForm = () => {
    const newErrors: any = {}
    if (!newPassword) newErrors.password = 'Password is required'
    else if (newPassword.length < 6) newErrors.password = 'Password must be at least 6 characters'
    
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (!token || !userId) {
      setErrors({ general: 'Invalid reset link' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await apiPost('/auth/unlock-reset', { 
        token, 
        userId, 
        newPassword 
      })
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: 'An error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020204] text-[#ececed] font-sans selection:bg-cyan-500/40 overflow-hidden">
      {/* Background Engine */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1e3a_0%,transparent_50%)]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 py-6 px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <Image src="/logo.png" alt="Quibly Logo" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-black tracking-widest uppercase italic hidden sm:block">Quibly</span>
        </Link>
        <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
        </Link>
      </nav>

      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[10px] font-black tracking-[0.2em] text-cyan-400 mb-6 uppercase">
              <Shield size={12} /> Security Protocol
            </div>
            <h1 className="text-5xl font-black leading-[0.9] mb-4 tracking-tighter italic uppercase text-white">
              RESET <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-black">PASSWORD.</span>
            </h1>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[30px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            
            <div className="relative bg-[#08080a] border border-white/10 rounded-[30px] p-8 backdrop-blur-xl">
              {isSuccess ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black mb-4 uppercase italic">Password Updated!</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Your password has been reset successfully. Redirecting you to the login page...
                  </p>
                  <Link href="/login">
                    <Button className="w-full h-12 bg-white text-black font-black uppercase tracking-widest text-xs">
                      Login Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-bold text-center">
                      {errors.general}
                    </div>
                  )}

                  {!token || !userId ? (
                    <div className="text-center py-4">
                      <p className="text-red-400 text-sm font-bold mb-6">This reset link is invalid or expired.</p>
                      <Link href="/login">
                        <Button variant="outline" className="w-full border-white/10 text-white font-black uppercase tracking-widest text-[10px]">
                          Request New Link
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Password */}
                      <div className="space-y-2">
                        <Label className="text-cyan-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                          <Lock className="w-3 h-3" />
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`bg-white/5 border-white/10 text-white h-12 pr-10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder:text-gray-600 ${
                              errors.password ? 'border-red-500 ring-2 ring-red-500/20' : ''
                            }`}
                            placeholder="Min 6 characters"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs text-red-400 bold">{errors.password}</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label className="text-cyan-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                          <Shield className="w-3 h-3" />
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`bg-white/5 border-white/10 text-white h-12 pr-10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder:text-gray-600 ${
                              errors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/20' : ''
                            }`}
                            placeholder="Re-type password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-400 bold">{errors.confirmPassword}</p>
                        )}
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-white/10 mt-6 relative overflow-hidden group"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          "Confirm New Password"
                        )}
                      </Button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020204] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
