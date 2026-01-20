 'use client'

 import { useEffect, useState } from 'react'
 import Link from 'next/link'
 import { apiGet, apiPost, ApiError } from '@/lib/api'

 type ProfileResponse = {
   user: {
     _id: string
     username: string
     discriminator: string
     email: string
   }
 }

 export default function Home() {
   const [loading, setLoading] = useState(true)
   const [user, setUser] = useState<ProfileResponse['user'] | null>(null)
   const [error, setError] = useState<string | null>(null)

   const loadProfile = async () => {
     setLoading(true)
     setError(null)
     try {
       const res = await apiGet<ProfileResponse>('/auth/profile')
       setUser(res.user)
     } catch (e) {
       setUser(null)
       if (e instanceof ApiError) {
         if (e.status !== 401) setError(e.message)
         return
       }
       setError('Failed to load profile')
     } finally {
       setLoading(false)
     }
   }

   useEffect(() => {
     void loadProfile()
   }, [])

   const handleLogout = async () => {
     setError(null)
     try {
       // Disconnect socket first
       const { disconnectSocket } = await import('@/lib/socket')
       disconnectSocket()
       
       await apiPost<unknown>('/auth/logout')
       setUser(null)
     } catch (e) {
       if (e instanceof ApiError) {
         setError(e.message)
         return
       }
       setError('Logout failed')
     }
   }

   return (
     <div className="min-h-screen bg-gradient-to-br from-[#04180c] via-[#092414] to-[#04180c] flex items-center justify-center p-6">
       <div className="w-full max-w-xl rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-8 text-white">
         <h1 className="text-2xl font-bold">Discord Project</h1>
         <p className="text-slate-300 mt-1">Auth status</p>

         {error && (
           <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
             {error}
           </div>
         )}

         <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
           {loading ? (
             <p className="text-slate-300">Loading...</p>
           ) : user ? (
             <div className="space-y-3">
               <div>
                 <div className="text-slate-400 text-sm">Signed in as</div>
                 <div className="text-lg font-semibold">
                   {user.username}
                   <span className="text-slate-400">#{user.discriminator}</span>
                 </div>
                 <div className="text-slate-300 text-sm">{user.email}</div>
               </div>

               <button
                 onClick={handleLogout}
                 className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
               >
                 Logout
               </button>
             </div>
           ) : (
             <div className="space-y-3">
               <p className="text-slate-300">You are not logged in.</p>
               <div className="flex gap-3">
                 <Link
                   href="/login"
                   className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 via-[#76cd00] to-accent-500 px-4 py-2 text-sm font-medium"
                 >
                   Login
                 </Link>
                 <Link
                   href="/signup"
                   className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors"
                 >
                   Signup
                 </Link>
               </div>
             </div>
           )}
         </div>

         <button
           onClick={loadProfile}
           className="mt-6 text-sm text-slate-300 hover:text-white transition-colors"
         >
           Refresh
         </button>
       </div>
     </div>
   )
 }
