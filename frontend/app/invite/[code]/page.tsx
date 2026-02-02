'use client'

import { useParams, useRouter } from 'next/navigation'
import { useInviteInfo, useProfile } from '@/hooks/queries'
import { useChannelsData } from '@/hooks/useChannelsData'
import { useState, useEffect } from 'react'

export default function InvitePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  
  const { data: inviteData, isLoading, error } = useInviteInfo(code)
  const { joinServer, joiningServer } = useChannelsData()
  const { data: profile } = useProfile()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleJoin = async () => {
    // If not logged in, redirect to login with this invite as return URL
    if (!profile) {
      router.push(`/login?redirect=/invite/${code}`)
      return
    }

    try {
      await joinServer(code)
      // Navigation to the server is handled inside joinServer if successful
    } catch (e: any) {
      console.error('Failed to join:', e)
      setErrorMsg(e.message || 'Failed to join server. The invite may be invalid or you are already a member.')
    }
  }

  // Effect to automatically handle already joined state if needed, 
  // but usually let the user click the button.

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#313338]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865F2]"></div>
          <p className="text-[#B5BAC1] text-sm font-medium animate-pulse">Fetching invite details...</p>
        </div>
      </div>
    )
  }

  if (error || !inviteData?.success) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#313338] p-4">
        <div className="w-full max-w-[440px] rounded-lg bg-[#2b2d31] p-8 text-center shadow-xl border border-[#1e1f22]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#313338]">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F23F43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
             </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
          <p className="text-[#b5bac1] mb-8 text-sm leading-relaxed">
            This invite may be invalid, expired, or you don't have permission to join. 
            Check the link and try again!
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full rounded-[3px] bg-[#5865f2] py-2.5 text-sm font-semibold text-white hover:bg-[#4752c4] transition-all active:scale-95 shadow-lg shadow-black/20"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const { server, inviter } = inviteData.invite

  return (
    <div className="flex h-screen items-center justify-center bg-[#313338] p-4 font-sans">
      <div className="w-full max-w-[440px] rounded-lg bg-[#2b2d31] p-8 shadow-2xl border border-[#1e1f22] animate-scale-in">
        <div className="flex flex-col items-center text-center">
          {/* Server Icon */}
          <div className="mb-6 h-24 w-24 overflow-hidden rounded-[28px] bg-[#313338] shadow-inner flex items-center justify-center group">
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white uppercase select-none">
                {server.name.charAt(0)}
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-[0.05em] mb-1.5 opacity-80">
            {inviter.username} invited you to join
          </p>
          <h1 className="text-2xl font-extrabold text-[#F2F3F5] mb-4 leading-tight">
            {server.name}
          </h1>

          <div className="mb-8 flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1f22] text-[#B5BAC1]">
              <span className="h-2 w-2 rounded-full bg-[#23a559] shadow-[0_0_8px_rgba(35,165,89,0.4)]"></span>
              {server.membersCount} Members
            </div>
          </div>

          {errorMsg && (
            <div className="w-full mb-4 px-3 py-2 rounded bg-[#F23F43]/10 border border-[#F23F43]/20 text-[#F23F43] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={joiningServer}
            className="w-full rounded-[3px] bg-[#23a559] py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-[#1a8144] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {joiningServer ? (
               <div className="flex items-center gap-2">
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Joining...
               </div>
            ) : 'Accept Invite'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-[#3F4147] w-full">
            <p className="text-[10px] text-[#949ba4] font-medium uppercase tracking-wider mb-2">
               New to Discord?
            </p>
            <button 
                onClick={() => router.push('/signup')}
                className="text-xs text-white/90 hover:underline font-semibold"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
