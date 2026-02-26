import { User } from '@/lib/store/authStore'

// Auth Type Definitions
export interface LoginFormData {
    email: string
    password: string
}

export interface SignupFormData {
    username: string
    email: string
    password: string
    confirmPassword: string
}

export interface LoginErrors {
    email?: string
    password?: string
}

export interface SignupErrors {
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    interests?: string
}

export interface LoginResponse {
    user: User
    token: string
    message?: string
    success?: boolean
}

export interface SignupResponse {
    success: boolean
    message?: string
    user?: User
    token?: string
    recommendedChannels?: any[]
}
