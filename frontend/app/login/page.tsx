import LoginForm from '@/components/auth/LoginForm'
import AuthLayout from '@/components/auth/AuthLayout'

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthLayout>
  )
}
