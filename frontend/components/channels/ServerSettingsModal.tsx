'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { apiRequest, apiPost, ApiError } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import RolesTab from './RolesTab'
import MembersTab from './MembersTab'
import AuditLogsTab from './AuditLogsTab'
import AutoModTab from './AutoModTab'
import WelcomeScreenTab from './WelcomeScreenTab'
import MemberScreeningTab from './MemberScreeningTab'
import ServerAnalyticsTab from './ServerAnalyticsTab'
import ServerRulesTab from './ServerRulesTab'
import ServerVanityTab from './ServerVanityTab'
import ServerBadgesTab from './ServerBadgesTab'
import { useChannelsData } from '@/hooks/useChannelsData'
import ServerInterestSelector from '../discovery/ServerInterestSelector'
import { useProfile } from '@/hooks/queries'
import { useMembers, useRoles } from '@/hooks/queries'
import { calculateUserPermissions, getAccessibleSettingsTabs, canAccessServerSettings } from '@/lib/permissions'

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
   vanityUrl?: string | null
   isVerified?: boolean
   isPartnered?: boolean
   badges?: string[]
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
   const { deleteServer } = useChannelsData()
   const { data: currentUser } = useProfile()
   const { data: membersData } = useMembers(server?._id || null)
   const { data: roles = [] } = useRoles(server?._id || null)
   const iconInputRef = useRef<HTMLInputElement>(null)
   const queryClient = useQueryClient()
   
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
   const [bannedWords, setBannedWords] = useState<string[]>([])
   const [newWord, setNewWord] = useState('')
   const [uploadingIcon, setUploadingIcon] = useState(false)

   // Calculate user permissions
   const { userPermissions, isOwner, accessibleTabs } = useMemo(() => {
      if (!server || !currentUser || !membersData) {
        return { userPermissions: 0, isOwner: false, accessibleTabs: {} }
      }

      const isOwner = server.ownerId === currentUser._id
      const currentMember = membersData.members?.find((m: any) => m.userId._id === currentUser._id || m.user._id === currentUser._id)
      
      if (!currentMember) {
        return { userPermissions: 0, isOwner, accessibleTabs: {} }
      }

      const userPermissions = calculateUserPermissions(
        roles,
        currentMember.roleIds || [],
        isOwner
      )

      const accessibleTabs = getAccessibleSettingsTabs(userPermissions, isOwner)

      return { userPermissions, isOwner, accessibleTabs }
   }, [server, currentUser, membersData, roles])

   // Check if user can access server settings at all
   const canAccess = useMemo(() => {
      if (!server || !currentUser) return false
      return canAccessServerSettings(userPermissions, isOwner)
   }, [server, currentUser, userPermissions, isOwner])

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
         setBannedWords((server as any).bannedWords || [])
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
            body: JSON.stringify({ ...formData, bannedWords })
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

   const handleAddWord = () => {
       if (!newWord.trim()) return
       if (bannedWords.includes(newWord.trim())) return
       setBannedWords([...bannedWords, newWord.trim()])
       setNewWord('')
   }

   const handleRemoveWord = (word: string) => {
       setBannedWords(bannedWords.filter(w => w !== word))
   }

   const handleDeleteServer = async () => {
      if (!server) return
      if (!confirm(`Are you sure you want to delete ${server.name}? This action cannot be undone.`)) return
      
      try {
         await deleteServer(server._id)
         onClose()
      } catch (e) {
         setError('Failed to delete server')
      }
   }

   const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
         toast.error('Please upload an image file')
         setError('Please upload an image file')
         return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
         toast.error('Image must be less than 5MB')
         setError('Image must be less than 5MB')
         return
      }

      setUploadingIcon(true)
      setError(null)

      try {
         const uploadFormData = new FormData()
         uploadFormData.append('file', file)

         // Use apiPost which handles authentication automatically
         const data = await apiPost<{ success: boolean; icon: string; message: string }>(
            `/server/${server?._id}/icon`,
            uploadFormData
         )
         
         // Update local form state
         setFormData(prev => ({ ...prev, icon: data.icon }))
         
         // Immediately update React Query cache for instant UI update
         queryClient.setQueryData<any[]>(['servers'], (old = []) =>
            old.map((s) => (s._id === server?._id ? { ...s, icon: data.icon } : s))
         )
         
         // Update the server in parent component
         if (server) {
            const updatedServer = { ...server, icon: data.icon }
            onUpdate(updatedServer)
         }
         
         toast.success('Server icon updated successfully!')
      } catch (e: any) {
         console.error('Icon upload error:', e)
         toast.error(e.message || 'Failed to upload icon')
         setError(e.message || 'Failed to upload icon')
      } finally {
         setUploadingIcon(false)
      }
   }

   // Check if user can access server settings at all
   if (!open || !server) return null
   
   // If user doesn't have access, show error
   if (!canAccess) {
      return (
         <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
               <div className="bg-[#313338] rounded-lg shadow-xl p-6 max-w-md">
                  <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                  <p className="text-slate-400 mb-4">
                     You don't have permission to access server settings. Only the server owner and members with "Manage Server" permission can access this.
                  </p>
                  <button
                     onClick={onClose}
                     className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors"
                  >
                     Close
                  </button>
               </div>
            </div>
         </div>
      )
   }

   // Filter tabs based on user permissions
   const allTabs = [
      { id: 'overview', name: 'Overview', icon: '⚙️', key: 'overview' },
      { id: 'rules', name: 'Rules', icon: '📜', key: 'overview' },
      { id: 'vanity', name: 'Vanity URL', icon: '🔗', key: 'overview' },
      { id: 'badges', name: 'Badges', icon: '🏅', key: 'overview' },
      { id: 'moderation', name: 'Moderation', icon: '🛡️', key: 'moderation' },
      { id: 'automod', name: 'Auto-Mod', icon: '🤖', key: 'autoMod' },
      { id: 'auditlogs', name: 'Audit Logs', icon: '📋', key: 'auditLogs' },
      { id: 'analytics', name: 'Analytics', icon: '📊', key: 'overview' },
      { id: 'welcome', name: 'Welcome Screen', icon: '👋', key: 'welcomeScreen' },
      { id: 'screening', name: 'Member Screening', icon: '✅', key: 'memberScreening' },
      { id: 'interests', name: 'Interests', icon: '✨', key: 'interests' },
      { id: 'members', name: 'Members', icon: '👥', key: 'members' },
      { id: 'roles', name: 'Roles', icon: '🏷️', key: 'roles' },
      { id: 'channels', name: 'Channels', icon: '#️⃣', key: 'channels' },
      { id: 'integrations', name: 'Integrations', icon: '🔗', key: 'integrations' },
   ]
   
   const tabs = allTabs.filter(tab => accessibleTabs[tab.key as keyof typeof accessibleTabs])

   return (
      <div className="fixed inset-0 z-50">
         <div className="absolute inset-0 bg-black/70" onClick={() => { if (!saving) onClose() }} />

         <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-full md:max-w-[800px] h-[90vh] md:h-[600px] bg-[#12131a] rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">

               {/* Sidebar */}
               <div className="hidden md:flex w-[218px] bg-[#12131a] flex-col pt-[60px] pb-4">
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
                        onClick={handleDeleteServer}
                        className="w-full text-left px-2.5 py-1.5 rounded-[4px] mb-[2px] text-sm font-medium flex items-center justify-between text-[#DA373C] hover:bg-[#DA373C]/10 transition-colors"
                     >
                        Delete Server
                     </button>
                  </div>
               </div>

               {/* Main Content */}
               <div className="flex-1 bg-[#12131a] flex flex-col relative">
                  {/* Mobile Tab Selector */}
                  <div className="md:hidden p-4 border-b border-[#3f4147]">
                     <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="w-full bg-[#1e1f22] text-white p-2 rounded border-none outline-none"
                     >
                        {tabs.map((tab) => (
                           <option key={tab.id} value={tab.id}>
                              {tab.name}
                           </option>
                        ))}
                     </select>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 md:p-[40px] custom-scrollbar">
                     {activeTab === 'overview' && (
                        <div className="max-w-full md:max-w-[460px]">
                           <h2 className="text-lg md:text-xl font-bold text-[#F2F3F5] mb-4 md:mb-5">Server Overview</h2>
                           
                           <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6 md:mb-8">
                              <div className="flex-1">
                                 {/* Server Name */}
                                 <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                       Server Name
                                    </label>
                                    <input
                                       value={formData.name}
                                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                       className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium"
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

                              {/* Icon Upload */}
                              <div className="flex flex-col items-center gap-2">
                                 <input
                                    ref={iconInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleIconUpload}
                                    className="hidden"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => iconInputRef.current?.click()}
                                    disabled={uploadingIcon}
                                    className="w-[100px] h-[100px] rounded-full bg-[#1E1F22] border-2 border-dashed border-[#4E5058] flex items-center justify-center text-slate-400 text-xs text-center p-2 cursor-pointer hover:border-[#F2F3F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                 >
                                    {uploadingIcon ? (
                                       <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    ) : formData.icon ? (
                                       <img src={formData.icon} alt="Server Icon" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                       <span>Upload Icon</span>
                                    )}
                                 </button>
                                 <div className="text-[10px] text-slate-500">Minimum Size: 128x128</div>
                              </div>
                           </div>

                           {/* Verification Level */}
                           <div className="mb-8">
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                 Verification Level
                              </label>
                              <div className="bg-[#1E1F22] rounded-[3px] p-2">
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
                     )}

                     {activeTab === 'moderation' && (
                        <div className="max-w-[460px]">
                            <h2 className="text-xl font-bold text-[#F2F3F5] mb-5">Moderation Settings</h2>
                            
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Banned Words
                                </label>
                                <p className="text-xs text-slate-400 mb-4">Messages containing these words will be blocked across the entire server.</p>
                                
                                <div className="flex gap-2 mb-4">
                                    <input
                                        value={newWord}
                                        onChange={(e) => setNewWord(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                                        placeholder="Add a word to ban..."
                                        className="flex-1 bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium h-10"
                                    />
                                    <button 
                                        onClick={handleAddWord}
                                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 rounded-[3px] text-sm font-medium transition-colors h-10"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                    {bannedWords.length > 0 ? (
                                        bannedWords.map((word, i) => (
                                            <div key={i} className="flex items-center justify-between bg-[#2B2D31] px-3 py-2 rounded-[3px] group">
                                                <span className="text-sm text-[#DBDEE1]">{word}</span>
                                                <button 
                                                    onClick={() => handleRemoveWord(word)}
                                                    className="text-[#B5BAC1] hover:text-[#F23F43] transition-colors"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" /></svg>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 bg-[#1E1F22] rounded-[3px] border border-dashed border-[#4E5058]">
                                            <p className="text-xs text-slate-500">No banned words yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                     )}

                     {activeTab === 'roles' && (
                        <div className="h-full">
                           <h2 className="text-xl font-bold text-[#F2F3F5] mb-5">Server Roles</h2>
                           <RolesTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'members' && (
                        <div className="h-full">
                           <h2 className="text-xl font-bold text-[#F2F3F5] mb-5">Server Members</h2>
                           <MembersTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'auditlogs' && (
                        <div className="h-full">
                           <AuditLogsTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'automod' && (
                        <div className="h-full">
                           <AutoModTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'welcome' && (
                        <div className="h-full">
                           <WelcomeScreenTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'screening' && (
                        <div className="h-full">
                           <MemberScreeningTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'interests' && (
                        <div className="max-w-[460px]">
                           <ServerInterestSelector serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'rules' && (
                        <div className="h-full">
                           <ServerRulesTab serverId={server._id} />
                        </div>
                     )}

                     {activeTab === 'vanity' && (
                        <div className="h-full">
                           <ServerVanityTab serverId={server._id} currentVanityUrl={server.vanityUrl} />
                        </div>
                     )}

                     {activeTab === 'badges' && (
                        <div className="h-full">
                           <ServerBadgesTab server={server} />
                        </div>
                     )}

                     {activeTab === 'analytics' && (
                        <div className="h-full">
                           <ServerAnalyticsTab serverId={server._id} />
                        </div>
                     )}

                     {(activeTab === 'channels' || activeTab === 'integrations') && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                           <div className="text-4xl">🚧</div>
                           <p>The {tabs.find(t => t.id === activeTab)?.name} tab is coming soon!</p>
                        </div>
                     )}
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
                  {(activeTab === 'overview' || activeTab === 'moderation') && (
                     <div className="bg-[#0a0b0f] p-4 flex justify-end gap-3 shadow-lg">
                        <button
                           onClick={() => {
                               setFormData({
                                  name: server.name || '',
                                  description: server.description || '',
                                  icon: server.icon || '',
                                  banner: server.banner || '',
                                  isPublic: server.isPublic || false,
                                  verificationLevel: server.verificationLevel || 'none'
                               });
                               setBannedWords((server as any).bannedWords || []);
                           }}
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
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}