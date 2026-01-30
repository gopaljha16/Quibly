'use client'

import { useEffect, useState } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

type Server = {
   _id: string
   name?: string
   description?: string
   icon?: string | null
   banner?: string | null
   isPublic?: boolean
   verificationLevel?: 'none' | 'low' | 'medium' | 'high'
   ownerId?: string
   membersCount?: number
}

export default function ServerSettingsModal({
   open,
   onClose,
   server,
   onUpdate,
}: {
   open: boolean
   onClose: () => void
   server: Server | null
   onUpdate: (updatedServer: Server) => void
}) {
   const [activeTab, setActiveTab] = useState('overview')
   const [formData, setFormData] = useState({
      name: '',
      description: '',
      icon: '',
      banner: '',
      isPublic: false,
      verificationLevel: 'none' as 'none' | 'low' | 'medium' | 'high'
   })
   const [saving, setSaving] = useState(false)
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
      if (server) {
         setFormData({
            name: server.name || '',
            description: server.description || '',
            icon: server.icon || '',
            banner: server.banner || '',
            isPublic: server.isPublic || false,
            verificationLevel: server.verificationLevel || 'none'
         })
      }
   }, [server])

   useEffect(() => {
      if (!open) return
      const onKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
   }, [open, onClose])

   const handleSave = async () => {
      if (!server) return

      setSaving(true)
      setError(null)

      try {
         const response = await apiRequest<{ success: boolean; server: Server }>(`/server/${server._id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
         })

         onUpdate(response.server)
         onClose()
      } catch (e) {
         if (e instanceof ApiError) {
            setError(e.message)
         } else {
            setError('Failed to update server')
         }
      } finally {
         setSaving(false)
      }
   }

   if (!open || !server) return null

   const tabs = [
      { id: 'overview', name: 'Overview', icon: '⚙️' },
      { id: 'moderation', name: 'Moderation', icon: '🛡️' },
      { id: 'members', name: 'Members', icon: '👥' },
      { id: 'roles', name: 'Roles', icon: '🏷️' },
      { id: 'channels', name: 'Channels', icon: '#️⃣' },
      { id: 'integrations', name: 'Integrations', icon: '🔗' },
   ]

   return (
      <div className="fixed inset-0 z-50">
         <div className="absolute inset-0 bg-black/70" onClick={() => { if (!saving) onClose() }} />

         <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-[800px] h-[600px] bg-[#12131a] rounded-[4px] shadow-2xl overflow-hidden flex animate-scale-in">

               {/* Sidebar */}
               <div className="w-[218px] bg-[#12131a] flex flex-col pt-[60px] pb-4">
                  <div className="px-[10px] mb-2 flex justify-between items-center">
                     <div className="text-xs font-bold text-slate-500 px-2 uppercase truncate">{server.name}</div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                     {tabs.map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`w-full text-left px-2.5 py-1.5 rounded-[4px] mb-[2px] text-sm font-medium flex items-center justify-between group transition-colors ${activeTab === tab.id
                              ? 'bg-[#f3c178]/10 text-cyan-400 border-l-2 border-[#f3c178]'
                              : 'text-slate-400 hover:bg-[#1a1b24] hover:text-slate-50'
                              }`}
                        >
                           {tab.name}
                        </button>
                     ))}

                     <div className="h-[1px] bg-[#3F4147] my-2 mx-2" />

                     <button
                        className="w-full text-left px-2.5 py-1.5 rounded-[4px] mb-[2px] text-sm font-medium flex items-center justify-between text-[#DA373C] hover:bg-[#DA373C]/10 transition-colors"
                     >
                        Delete Server
                     </button>
                  </div>
               </div>

               {/* Main Content */}
               <div className="flex-1 bg-[#12131a] flex flex-col relative">
                  <div className="flex-1 overflow-y-auto p-[40px] custom-scrollbar">
                     <div className="max-w-[460px]">
                        <h2 className="text-xl font-bold text-[#F2F3F5] mb-5">Server Overview</h2>

                        <div className="flex gap-8 mb-8">
                           <div className="flex-1">
                              {/* Server Name */}
                              <div className="mb-6">
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Server Name
                                 </label>
                                 <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#12131a] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium"
                                 />
                              </div>

                              {/* Description */}
                              <div className="mb-6">
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Description
                                 </label>
                                 <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium h-[100px] resize-none"
                                    placeholder="Tell us about your server!"
                                 />
                              </div>
                           </div>

                           {/* Icon Upload Placeholder */}
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-[100px] h-[100px] rounded-full bg-[#1E1F22] border-2 border-dashed border-[#4E5058] flex items-center justify-center text-slate-400 text-xs text-center p-2 cursor-pointer hover:border-[#F2F3F5] transition-colors">
                                 {formData.icon ? (
                                    <img src={formData.icon} alt="Server Icon" className="w-full h-full rounded-full object-cover" />
                                 ) : (
                                    <span>Upload Icon</span>
                                 )}
                              </div>
                              <div className="text-[10px] text-slate-500">Minimum Size: 128x128</div>
                           </div>
                        </div>

                        {/* Verification Level */}
                        <div className="mb-8">
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                              Verification Level
                           </label>
                           <div className="bg-[#12131a] rounded-[3px] p-2">
                              <select
                                 value={formData.verificationLevel}
                                 onChange={(e) => setFormData({ ...formData, verificationLevel: e.target.value as any })}
                                 className="w-full bg-transparent text-slate-50 outline-none text-sm"
                              >
                                 <option value="none">None - Unrestricted</option>
                                 <option value="low">Low - Must have verified email</option>
                                 <option value="medium">Medium - Must be registered for 5 mins</option>
                                 <option value="high">High - Must be member for 10 mins</option>
                              </select>
                           </div>
                        </div>

                        {/* Public Toggle */}
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <div className="text-sm font-medium text-[#F2F3F5]">Public Server</div>
                              <div className="text-xs text-slate-400">Allow anyone to discover and join your server</div>
                           </div>
                           <button
                              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                              className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isPublic ? 'bg-[#23A559]' : 'bg-[#80848E]'
                                 }`}
                           >
                              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.isPublic ? 'translate-x-4' : 'translate-x-0'
                                 }`} />
                           </button>
                        </div>

                        {error && (
                           <div className="mb-4 text-xs font-medium text-[#F23F43]">
                              {error}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Close Button */}
                  <div className="absolute top-[36px] right-[40px] flex flex-col items-center gap-1">
                     <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full border-2 border-[#B5BAC1] text-slate-400 flex items-center justify-center hover:bg-[#B5BAC1] hover:text-[#313338] transition-colors"
                     >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current font-bold">
                           <path fillRule="evenodd" clipRule="evenodd" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                        </svg>
                     </button>
                     <div className="text-xs font-bold text-slate-400">ESC</div>
                  </div>

                  {/* Save Changes Bar */}
                  <div className="bg-[#0a0b0f] p-4 flex justify-end gap-3 shadow-lg">
                     <button
                        onClick={() => setFormData({
                           name: server.name || '',
                           description: server.description || '',
                           icon: server.icon || '',
                           banner: server.banner || '',
                           isPublic: server.isPublic || false,
                           verificationLevel: server.verificationLevel || 'none'
                        })}
                        className="px-4 py-2 text-sm font-medium text-white hover:underline transition-colors"
                        disabled={saving}
                     >
                        Reset
                     </button>
                     <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-[3px] text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-[#0b0500] font-bold transition-colors disabled:opacity-50"
                        disabled={saving}
                     >
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}