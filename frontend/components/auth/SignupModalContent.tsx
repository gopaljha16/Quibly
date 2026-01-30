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
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface SignupModalContentProps {
    onSuccess?: () => void
}

export default function SignupModalContent({ onSuccess }: SignupModalContentProps) {
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
    }>({})

    const validateForm = () => {
        const newErrors: any = {}

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

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
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
            const response = await apiPost<{
                success: boolean
                recommendedChannels?: any[]
            }>('/auth/register', { ...formData, interests: selectedInterests })

            if (response.recommendedChannels && response.recommendedChannels.length > 0) {
                setRecommendedChannels(response.recommendedChannels)
                setShowRecommendations(true)
            } else {
                router.push('/channels/@me')
                router.refresh()
                onSuccess?.()
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
            <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#f3c178] to-[#f35e41] bg-clip-text text-transparent">
                    Create Account
                </DialogTitle>
                <DialogDescription className="text-[#bdb9b6]">
                    Fill in your details to get started
                </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-[#fef9f0]">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] h-11 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.username ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''}`}
                            placeholder="Choose a username"
                        />
                        {errors.username && <p className="text-xs text-[#f35e41]">{errors.username}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#fef9f0]">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] h-11 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.email ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''}`}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-xs text-[#f35e41]">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[#fef9f0]">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] pr-10 h-11 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.password ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''}`}
                                placeholder="Create a password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178]"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-[#f35e41]">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-[#fef9f0]">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`bg-[#0b0500] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] pr-10 h-11 focus:border-[#f3c178] focus:ring-2 focus:ring-[#f3c178]/20 ${errors.confirmPassword ? 'border-[#f35e41] ring-2 ring-[#f35e41]/20' : ''}`}
                                placeholder="Confirm your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#f3c178]"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-[#f35e41]">{errors.confirmPassword}</p>}
                    </div>

                    {/* Interests */}
                    <InterestSelector
                        selectedInterests={selectedInterests}
                        onChange={setSelectedInterests}
                        allowSkip={true}
                    />

                    {/* Terms */}
                    <div className="flex items-start space-x-2">
                        <input id="terms" type="checkbox" required className="mt-1 h-4 w-4 rounded border-[#f3c178]/30 bg-[#0b0500] text-[#f3c178] focus:ring-[#f3c178]" />
                        <label htmlFor="terms" className="text-sm text-[#bdb9b6]">
                            I agree to the Terms of Service and Privacy Policy
                        </label>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-[#f3c178] to-[#f35e41] hover:from-[#e0a850] hover:to-[#e0442a] text-[#0b0500] font-bold shadow-lg shadow-[#f3c178]/30"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating account...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Create Account
                            </span>
                        )}
                    </Button>
                </form>
            </ScrollArea>

            {showRecommendations && (
                <RecommendedChannelsModal
                    channels={recommendedChannels}
                    onClose={() => {
                        setShowRecommendations(false)
                        router.push('/channels/@me')
                        onSuccess?.()
                    }}
                />
            )}
        </>
    )
}
