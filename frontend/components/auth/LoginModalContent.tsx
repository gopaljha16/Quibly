'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { apiPost, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface LoginModalContentProps {
    onSuccess?: () => void
}

export default function LoginModalContent({ onSuccess }: LoginModalContentProps) {
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

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        }

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
            onSuccess?.()
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors({ email: error.message })
                return
            }
            setErrors({ email: 'Invalid credentials. Please try again.' })
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
            <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#f3c178] to-[#f35e41] bg-clip-text text-transparent">
                    Welcome Back
                </DialogTitle>
                <DialogDescription className="text-[#bdb9b6]">
                    Sign in to continue to your account
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 px-1">
                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#fef9f0] font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#f3c178]" />
                        Email Address
                    </Label>
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
                    {errors.email && <p className="text-xs text-[#f35e41]">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#fef9f0] font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#f3c178]" />
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] pr-10 h-11 placeholder:text-[#6b635c] focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.password ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''
                                }`}
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178] transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-[#f35e41]">{errors.password}</p>}
                </div>

                {/* Remember me */}
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
                    className="w-full h-12 bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold shadow-lg shadow-[#f3c178]/30 transition-all duration-300 mt-6 relative overflow-hidden group"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                    {isLoading ? (
                        <span className="flex items-center gap-2 relative z-10">
                            <div className="h-5 w-5 border-2 border-[#0b0500] border-t-transparent rounded-full animate-spin" />
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
        </>
    )
}
