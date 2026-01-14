import SignupForm from '@/components/auth/SignupForm'
import AuthLayout from '@/components/auth/AuthLayout'

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join us and start your journey"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthLayout>
  )
}
