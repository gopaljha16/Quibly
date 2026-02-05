'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiPost, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const userId = searchParams.get('userId')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verify = async () => {
      if (!token || !userId) {
        setStatus('error')
        setMessage('Missing verification token or user ID.')
        return
      }

      try {
        await apiPost('/auth/verify-email', { token, userId })
        setStatus('success')
        setMessage('Your email has been successfully verified! You can now access all features.')
      } catch (error) {
        setStatus('error')
        if (error instanceof ApiError) {
          setMessage(error.message)
        } else {
          setMessage('An error occurred during verification. Please try again or contact support.')
        }
      }
    }

    verify()
  }, [token, userId])

  return (
    <div className="min-h-screen bg-[#020204] text-[#ececed] font-sans flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background engine */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1e3a_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[30px] blur-xl opacity-50 transition-opacity" />
          
          <div className="relative bg-[#08080a] border border-white/10 rounded-[30px] p-10 backdrop-blur-xl text-center">
            <div className="flex justify-center mb-8">
              {status === 'loading' && (
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">
              {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Verification Failed'}
            </h1>
            
            <p className="text-gray-400 mb-10 font-medium">
              {message}
            </p>

            {status === 'success' && (
              <Button
                onClick={() => router.push('/login')}
                className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-white/10 relative overflow-hidden group"
              >
                Continue to Quibly
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-white/10 relative overflow-hidden group"
                >
                  Back to Login
                </Button>
                <p className="text-xs text-gray-500">
                  If you continue to have issues, please try requesting a new link.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020204] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
