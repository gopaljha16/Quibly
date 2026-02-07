'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, ArrowLeft, Check,
  Shield, Rocket
} from 'lucide-react'
import { apiPost, apiGet, ApiError } from '@/lib/api'
import { GoogleLogin } from '@react-oauth/google'
import InterestSelector from '@/components/InterestSelector'
import RecommendedChannelsModal from '@/components/RecommendedChannelsModal'
import SignupVisualization from '@/components/SignupVisualization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/channels/@me'
  
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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user profile to check if logged in
        await apiGet('/auth/profile')
        // If successful, user is logged in, redirect to channels
        router.push(redirect)
      } catch (error) {
        // User is not logged in, stay on signup page
      }
    }
    checkAuth()
  }, [router, redirect])

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
        router.push(redirect)
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
    <div className="min-h-screen bg-[#020204] text-[#ececed] font-sans selection:bg-cyan-500/40 overflow-hidden">
      
      {/* ... (rest of the UI remains exactly the same as original) */}
      {/* --- BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1e3a_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] py-6 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black">Q</div>
            <span className="text-xl font-black tracking-widest uppercase italic hidden sm:block">Quibly</span>
          </Link>
          
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back Home</span>
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="relative min-h-screen pt-20 md:pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          
          {/* --- LEFT: SIGNUP FORM --- */}
          <div className="relative z-10 max-w-md mx-auto lg:mx-0 w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-[10px] font-black tracking-[0.2em] text-purple-400 mb-6 uppercase">
              <Sparkles size={12} /> Join the Network
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-black leading-[0.9] mb-4 tracking-tighter">
              CREATE YOUR <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">ACCOUNT.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 font-medium">
              Join thousands of users in the Quibly community.
            </p>

            {/* Form Card */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-[30px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              
              {/* Form Container */}
              <div className="relative bg-[#08080a] border border-white/10 rounded-[30px] p-8 backdrop-blur-xl max-h-[calc(100vh-250px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <User className="w-3 h-3" />
                      Username
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-600 ${
                          errors.username ? 'border-red-500 ring-2 ring-red-500/20' : ''
                        }`}
                        placeholder="Choose a unique username"
                      />
                      {!errors.username && formData.username && formData.username.length >= 3 && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    {errors.username && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {errors.username}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </Label>
                    <div className="relative">
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
                      />
                      {!errors.email && formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      )}
                    </div>
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
                        placeholder="Create a strong password"
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-purple-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Shield className="w-3 h-3" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 text-white h-12 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-600 ${
                          errors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/20' : ''
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {errors.confirmPassword}
                      </p>
                    )}
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
                      className="mt-1 h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer font-medium">
                      I agree to the{' '}
                      <a href="#" className="text-purple-400 hover:text-purple-300 underline">Terms</a>
                      {' '}and{' '}
                      <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-purple-400 transition-all shadow-xl shadow-white/10 hover:shadow-purple-400/30 mt-6 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                    {isLoading ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        <Rocket className="h-5 w-5" />
                        Join Quibly Now
                      </span>
                    )}
                  </Button>

                  <div className="pt-2">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                          setIsLoading(true)
                          try {
                            await apiPost('/auth/google-login', { 
                              googleToken: credentialResponse.credential 
                            })
                            router.push(redirect)
                            router.refresh()
                          } catch (err) {
                            setErrors({ email: 'Google signup failed. Please try again.' })
                          } finally {
                            setIsLoading(false)
                          }
                        }
                      }}
                      onError={() => {
                        setErrors({ email: 'Google signup failed' })
                      }}
                      theme="filled_black"
                      size="large"
                      text="signup_with"
                      shape="pill"
                    />
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-4 bg-[#08080a] text-gray-600 font-black uppercase tracking-widest">Have Account?</span>
                  </div>
                </div>

                {/* Login Link */}
                <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Sign In Instead
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* --- RIGHT: ANIMATED VISUALIZATION --- */}
          <div className="relative hidden lg:block">
            <SignupVisualization />
          </div>

        </div>
      </div>

      {showRecommendations && (
        <RecommendedChannelsModal
          channels={recommendedChannels}
          onClose={() => {
            setShowRecommendations(false)
            router.push(redirect)
          }}
        />
      )}
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020204] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}


