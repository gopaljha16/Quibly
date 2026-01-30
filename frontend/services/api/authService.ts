import { apiPost } from '@/lib/api'
import type { LoginFormData, SignupFormData, LoginResponse, SignupResponse } from '@/models/auth/types'

/**
 * Auth API Service - Handles all authentication-related API calls
 * Separates API logic from components
 */
export class AuthApiService {
    /**
     * Login user
     */
    static async login(data: LoginFormData): Promise<LoginResponse> {
        return apiPost<LoginResponse>('/auth/login', data)
    }

    /**
     * Register new user
     */
    static async signup(data: SignupFormData & { interests: string[] }): Promise<SignupResponse> {
        return apiPost<SignupResponse>('/auth/register', data)
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        return apiPost('/auth/logout', {})
    }
}
