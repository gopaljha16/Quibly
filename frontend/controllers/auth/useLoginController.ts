import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModel } from '@/models/auth/authModel'
import { AuthApiService } from '@/services/api/authService'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import type { LoginFormData, LoginErrors } from '@/models/auth/types'

/**
 * Login Controller Hook
 * Manages login form state and logic
 */
export function useLoginController() {
    const router = useRouter()
    const { login: setAuthUser, setLoading, setError: setAuthError } = useAuthStore()
    
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<LoginErrors>({})

    const handleChange = (field: keyof LoginFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const validationErrors = AuthModel.validateLoginForm(formData)
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
            const response = await AuthApiService.login(formData)
            
            // Backend sets httpOnly cookie automatically
            // Update Zustand store with user data
            if (response?.user) {
                setAuthUser(response?.user)
            }
            
            // Navigate to app
            router.push('/channels/@me')
            router.refresh()
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors({ email: error.message })
                setAuthError(error.message)
            } else {
                const errorMsg = 'Invalid credentials. Please try again.'
                setErrors({ email: errorMsg })
                setAuthError(errorMsg)
            }
        } finally {
            setLoading(false)
        }
    }

    return {
        // State
        formData,
        errors,
        isLoading: useAuthStore(state => state.isLoading),
        // Actions
        handleChange,
        handleSubmit,
    }
}
