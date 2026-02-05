'use client'

import { useState } from 'react'
import { useMembers, useRoles } from '@/hooks/queries'
import { useRoleMutations } from '@/hooks/mutations/useServerMutations'
import { Role } from '@/hooks/queries/useRoles'
import { Member } from '@/hooks/queries/useMembers'
import TimeoutModal from './TimeoutModal'
import BanModal from './BanModal'
import { useQueryClient } from '@tanstack/react-query'

export default function MembersTab({ serverId }: { serverId: string }) {
    const queryClient = useQueryClient()
    const { data: membersData, isLoading: membersLoading } = useMembers(serverId)
    const { data: roles = [], isLoading: rolesLoading } = useRoles(serverId)
    const { updateMemberRoles } = useRoleMutations(serverId)
    const [search, setSearch] = useState('')
    const [timeoutModalOpen, setTimeoutModalOpen] = useState(false)
    const [banModalOpen, setBanModalOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<any>(null)

    const members = membersData?.members || []
    const filteredMembers = members.filter((m: any) => 
        m.user.username.toLowerCase().includes(search.toLowerCase())
    )
    const handleAddRole = async (member: any, roleId: string) => {
        if (member.roleIds.includes(roleId)) return
        const newRoleIds = [...member.roleIds, roleId]
        try {
            await updateMemberRoles.mutateAsync({ userId: member.user._id, roleIds: newRoleIds })
        } catch (error) {
            console.error('Failed to add role', error)
        }
    }

    const handleRemoveRole = async (member: any, roleId: string) => {
        const newRoleIds = member.roleIds.filter((id: string) => id !== roleId)
        try {
            await updateMemberRoles.mutateAsync({ userId: member.user._id, roleIds: newRoleIds })
        } catch (error) {
            console.error('Failed to remove role', error)
        }
    }

    if (membersLoading || rolesLoading) return <div className="text-slate-400">Loading members...</div>

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Server Members</h3>
                <div className="text-sm text-slate-500">{members.length} Members</div>
            </div>

            <div className="relative">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members"
                    className="w-full bg-[#1E1F22] text-slate-50 p-2 rounded-[3px] border-none outline-none text-sm placeholder:text-slate-500"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {filteredMembers.map((member: any) => (
                    <div key={member._id} className="flex items-center justify-between py-2 border-b border-[#3F4147]/50 last:border-none">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3F4147] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                {member.user.avatar ? (
                                    <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    member.user.username[0].toUpperCase()
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white flex items-center gap-1">
                                    {member.user.username}
                                    {member.isOwner && <span className="text-[10px] text-yellow-500">👑</span>}
                                    {member.isBanned && (
                                        <span 
                                            className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded border border-red-600/30 font-semibold"
                                            title={member.banReason ? `Banned: ${member.banReason}` : 'This member is banned'}
                                        >
                                            BANNED
                                        </span>
                                    )}
                                    {member.timeoutUntil && new Date(member.timeoutUntil) > new Date() && (
                                        <span 
                                            className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/30 font-semibold"
                                            title={`Timed out until ${new Date(member.timeoutUntil).toLocaleString()}`}
                                        >
                                            Timed out until {new Date(member.timeoutUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {/* ... existing roles mapping ... */}
                                    {member.roleIds.map((roleId: string) => {
                                        const role = roles.find(r => r.id === roleId)
                                        if (!role) return null
                                        return (
                                            <div 
                                                key={role.id}
                                                className="flex items-center gap-1 bg-[#2B2D31] px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium border border-[#3F4147]"
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color || '#99AAB5' }} />
                                                <span style={{ color: role.color || '#F2F3F5' }}>{role.name}</span>
                                                {!role.isDefault && !(role.name === 'Owner' && member.isOwner) && (
                                                    <button 
                                                        onClick={() => handleRemoveRole(member, role.id)}
                                                        className="ml-1 text-slate-500 hover:text-red-400"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                    <RolePicker 
                                        roles={roles} 
                                        memberRoles={member.roleIds} 
                                        onSelect={(roleId) => handleAddRole(member, roleId)} 
                                    />
                                    {membersData?.ownerId === member.userId ? null : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(member)
                                                    setTimeoutModalOpen(true)
                                                }}
                                                className="w-5 h-5 flex items-center justify-center rounded-full bg-[#3F4147] text-slate-300 hover:bg-orange-500/20 hover:text-orange-500 transition-colors ml-1"
                                                title="Timeout Member"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(member)
                                                    setBanModalOpen(true)
                                                }}
                                                className={`w-5 h-5 flex items-center justify-center rounded-full text-slate-300 transition-colors ml-1 ${
                                                    member.isBanned 
                                                        ? 'bg-green-600/20 hover:bg-green-600/30 hover:text-green-400' 
                                                        : 'bg-[#3F4147] hover:bg-red-600/20 hover:text-red-400'
                                                }`}
                                                title={member.isBanned ? 'Unban Member' : 'Ban Member'}
                                            >
                                                {member.isBanned ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                ) : (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                    </svg>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedMember && (
                <>
                    <TimeoutModal
                        open={timeoutModalOpen}
                        onClose={() => {
                            setTimeoutModalOpen(false)
                            setSelectedMember(null)
                        }}
                        serverId={serverId}
                        userId={selectedMember.userId?._id || selectedMember.userId}
                        username={selectedMember.user.username}
                        timeoutUntil={selectedMember.timeoutUntil}
                        timeoutReason={selectedMember.timeoutReason}
                        onSuccess={() => {
                            // Refresh members data
                            queryClient.invalidateQueries({ queryKey: ['members', serverId] })
                        }}
                    />
                    <BanModal
                        open={banModalOpen}
                        onClose={() => {
                            setBanModalOpen(false)
                            setSelectedMember(null)
                        }}
                        serverId={serverId}
                        userId={selectedMember.userId?._id || selectedMember.userId}
                        username={selectedMember.user.username}
                        isBanned={selectedMember.isBanned || false}
                        banReason={selectedMember.banReason}
                        onSuccess={() => {
                            // Refresh members data
                            queryClient.invalidateQueries({ queryKey: ['members', serverId] })
                        }}
                    />
                </>
            )}
        </div>
    )
}

function RolePicker({ roles, memberRoles, onSelect }: { roles: Role[], memberRoles: string[], onSelect: (id: string) => void }) {
    const [open, setOpen] = useState(false)
    const availableRoles = roles.filter(r => !r.isDefault && !memberRoles.includes(r.id))

    if (availableRoles.length === 0) return null

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[#3F4147] text-slate-300 hover:bg-[#4E5058] transition-colors"
            >
                +
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-6 left-0 z-20 w-48 bg-[#111214] border border-[#1E1F22] rounded-[4px] shadow-xl p-1 flex flex-col gap-0.5">
                        {availableRoles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => {
                                    onSelect(role.id)
                                    setOpen(false)
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-[2px] text-xs font-medium text-slate-300 hover:bg-[#3F4147] hover:text-white flex items-center gap-2"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#99AAB5' }} />
                                {role.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
