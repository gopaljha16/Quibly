import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModel } from '@/models/auth/authModel'
import { AuthApiService } from '@/services/api/authService'
import { ApiError } from '@/lib/api'
import type { LoginFormData, LoginErrors } from '@/models/auth/types'

/**
 * Login Controller Hook
 * Manages login form state and logic
 */
export function useLoginController() {
    const router = useRouter()
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<LoginErrors>({})
    const [isLoading, setIsLoading] = useState(false)

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

        setIsLoading(true)
        setErrors({})

        try {
            await AuthApiService.login(formData)
            router.push('/channels/@me')
            router.refresh()
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors({ email: error.message })
            } else {
                setErrors({ email: 'Invalid credentials. Please try again.' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {
        // State
        formData,
        errors,
        isLoading,
        // Actions
        handleChange,
        handleSubmit,
    }
}
