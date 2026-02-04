'use client'

// This component is now a simple wrapper - middleware handles all auth
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
