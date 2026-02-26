import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModel } from '@/models/auth/authModel'
import { AuthApiService } from '@/services/api/authService'
import { ApiError } from '@/lib/api'
import type { SignupFormData, SignupErrors } from '@/models/auth/types'

/**
 * Signup Controller Hook
 * Manages signup form state and logic
 */
export function useSignupController() {
    const router = useRouter()
    const [formData, setFormData] = useState<SignupFormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [errors, setErrors] = useState<SignupErrors>({})
    const [isLoading, setIsLoading] = useState(false)
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

        setIsLoading(true)
        setErrors({})

        try {
            // Skip interests for now - backend doesn't have matching IDs
            const response = await AuthApiService.signup({
                ...formData,
                interests: [], // TODO: Fix interest ID mismatch between frontend and backend
            })
            if (response?.token) {
                document.cookie = `token=${response.token}; path=/; max-age=604800`
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
            } else {
                setErrors({ email: 'An error occurred. Please try again.' })
            }
        } finally {
            setIsLoading(false)
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
        isLoading,
        recommendedChannels,
        showRecommendations,
        // Actions
        handleChange,
        handleInterestsChange,
        handleSubmit,
        closeRecommendations,
    }
}
