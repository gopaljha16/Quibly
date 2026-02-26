import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModel } from '@/models/auth/authModel'
import { AuthApiService } from '@/services/api/authService'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import type { SignupFormData, SignupErrors } from '@/models/auth/types'

/**
 * Signup Controller Hook
 * Manages signup form state and logic
 */
export function useSignupController() {
    const router = useRouter()
    const { login: setAuthUser, setLoading, setError: setAuthError } = useAuthStore()
    
    const [formData, setFormData] = useState<SignupFormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [errors, setErrors] = useState<SignupErrors>({})
    const [recommendedChannels, setRecommendedChannels] = useState<any[]>([])
    const [showRecommendations, setShowRecommendations] = useState(false)

    const handleChange = (field: keyof SignupFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleInterestsChange = (interests: string[]) => {
        setSelectedInterests(interests)
        if (errors.interests) {
            setErrors(prev => ({ ...prev, interests: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const validationErrors = AuthModel.validateSignupForm(formData)
        setErrors(validationErrors)
        return !AuthModel.hasErrors(validationErrors)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        setErrors({})
        setAuthError(null)

        try {
            // Skip interests for now - backend doesn't have matching IDs
            const response = await AuthApiService.signup({
                ...formData,
                interests: [], // TODO: Fix interest ID mismatch between frontend and backend
            })
            
            // Backend sets httpOnly cookie automatically
            // Update Zustand store with user data
            if (response?.user) {
                setAuthUser(response.user)
            }

            // Show recommendations if available
            if (response.recommendedChannels && response.recommendedChannels.length > 0) {
                setRecommendedChannels(response.recommendedChannels)
                setShowRecommendations(true)
            } else {
                router.push('/channels/@me')
                router.refresh()
            }
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors({ email: error.message })
                setAuthError(error.message)
            } else {
                const errorMsg = 'An error occurred. Please try again.'
                setErrors({ email: errorMsg })
                setAuthError(errorMsg)
            }
        } finally {
            setLoading(false)
        }
    }

    const closeRecommendations = () => {
        setShowRecommendations(false)
        router.push('/channels/@me')
        router.refresh()
    }

    return {
        // State
        formData,
        selectedInterests,
        errors,
        isLoading: useAuthStore(state => state.isLoading),
        recommendedChannels,
        showRecommendations,
        // Actions
        handleChange,
        handleInterestsChange,
        handleSubmit,
        closeRecommendations,
    }
}
