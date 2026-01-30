import type { LoginFormData, SignupFormData, LoginErrors, SignupErrors } from './types'

/**
 * Auth Model - Pure business logic for authentication
 * No React dependencies, easily testable
 */
export class AuthModel {
    // Email validation
    static validateEmail(email: string): string | undefined {
        if (!email) {
            return 'Email is required'
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return 'Email is invalid'
        }
        return undefined
    }

    // Password validation
    static validatePassword(password: string): string | undefined {
        if (!password) {
            return 'Password is required'
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters'
        }
        return undefined
    }

    // Username validation
    static validateUsername(username: string): string | undefined {
        if (!username) {
            return 'Username is required'
        }
        if (username.length < 3 || username.length > 32) {
            return 'Username must be between 3 and 32 characters'
        }
        return undefined
    }

    // Confirm password validation
    static validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
        if (!confirmPassword) {
            return 'Please confirm your password'
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match'
        }
        return undefined
    }

    // Login form validation
    static validateLoginForm(data: LoginFormData): LoginErrors {
        return {
            email: this.validateEmail(data.email),
            password: this.validatePassword(data.password),
        }
    }

    // Signup form validation
    static validateSignupForm(data: SignupFormData): SignupErrors {
        return {
            username: this.validateUsername(data.username),
            email: this.validateEmail(data.email),
            password: this.validatePassword(data.password),
            confirmPassword: this.validateConfirmPassword(data.password, data.confirmPassword),
        }
    }

    // Check if errors object has any errors
    static hasErrors(errors: LoginErrors | SignupErrors): boolean {
        return Object.values(errors).some(error => error !== undefined)
    }

    // Clear undefined values from errors object
    static cleanErrors<T extends Record<string, string | undefined>>(errors: T): T {
        const cleaned = { ...errors }
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === undefined) {
                delete cleaned[key]
            }
        })
        return cleaned
    }
}
