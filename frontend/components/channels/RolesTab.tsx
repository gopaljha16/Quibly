'use client'

import { useState } from 'react'
import { useRoles } from '@/hooks/queries'
import { useRoleMutations } from '@/hooks/mutations/useServerMutations'
import { Role } from '@/hooks/queries/useRoles'

export default function RolesTab({ serverId }: { serverId: string }) {
    const { data: roles = [], isLoading } = useRoles(serverId)
    const { createRole, updateRole, deleteRole } = useRoleMutations(serverId)
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('#99AAB5')
    const [editHoist, setEditHoist] = useState(false)

    const selectedRole = roles.find(r => r.id === selectedRoleId)

    const handleSelectRole = (role: Role) => {
        setSelectedRoleId(role.id)
        setEditName(role.name)
        setEditColor(role.color || '#99AAB5')
        setEditHoist(role.hoist)
    }

    const handleCreateRole = async () => {
        try {
            const newRole = await createRole.mutateAsync({
                name: 'new role',
                color: '#99AAB5',
                permissions: 0,
                hoist: true
            })
            handleSelectRole(newRole)
        } catch (error) {
            console.error('Failed to create role', error)
        }
    }

    const handleSaveRole = async () => {
        if (!selectedRoleId) return
        try {
            await updateRole.mutateAsync({
                roleId: selectedRoleId,
                updates: {
                    name: editName,
                    color: editColor,
                    hoist: editHoist
                }
            })
        } catch (error) {
            console.error('Failed to update role', error)
        }
    }

    const handleDeleteRole = async () => {
        if (!selectedRoleId || selectedRole?.isDefault) return
        if (!confirm('Are you sure you want to delete this role?')) return
        try {
            await deleteRole.mutateAsync(selectedRoleId)
            setSelectedRoleId(null)
        } catch (error) {
            console.error('Failed to delete role', error)
        }
    }

    if (isLoading) return <div className="text-slate-400">Loading roles...</div>

    return (
        <div className="flex h-full gap-6">
            {/* Roles List */}
            <div className="w-1/3 border-r border-[#3F4147] pr-4 flex flex-col gap-2">
                <button
                    onClick={handleCreateRole}
                    className="w-full py-1.5 px-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors mb-2"
                >
                    Create Role
                </button>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={`w-full text-left px-2 py-1.5 rounded-[3px] text-sm group flex items-center justify-between transition-colors ${selectedRoleId === role.id ? 'bg-[#3F4147] text-white' : 'text-slate-400 hover:bg-[#35373C] hover:text-slate-200'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#99AAB5' }} />
                                <span className="truncate">{role.name}</span>
                            </div>
                            {role.isDefault && <span className="text-[10px] text-slate-500">Default</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Role Editor */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedRole ? (
                    <div className="flex flex-col gap-6">
                        <h3 className="text-lg font-bold text-white">Edit Role — {selectedRole.name}</h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Role Name</label>
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium"
                                disabled={selectedRole.isDefault}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Role Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={editColor}
                                    onChange={(e) => setEditColor(e.target.value)}
                                    className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer"
                                />
                                <input
                                    value={editColor}
                                    onChange={(e) => setEditColor(e.target.value)}
                                    className="bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none font-medium w-32"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#2B2D31] rounded-[4px] border border-[#3F4147]">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-white">Display role members separately from online members</span>
                                <span className="text-xs text-slate-400">Members with this role will be displayed in their own group in the member list.</span>
                            </div>
                            <button
                                onClick={() => setEditHoist(!editHoist)}
                                className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${editHoist ? 'bg-[#23A559]' : 'bg-[#80848E]'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${editHoist ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="h-[1px] bg-[#3F4147] my-2" />

                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveRole}
                                className="flex-1 py-2 bg-[#23A559] hover:bg-[#1a7a42] text-white rounded-[3px] text-sm font-medium transition-colors"
                            >
                                Save Changes
                            </button>
                            {!selectedRole.isDefault && (
                                <button
                                    onClick={handleDeleteRole}
                                    className="px-4 py-2 border border-[#DA373C] text-[#DA373C] hover:bg-[#DA373C] hover:text-white rounded-[3px] text-sm font-medium transition-colors"
                                >
                                    Delete Role
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <div className="text-4xl">🏷️</div>
                        <p>Select a role to edit its permissions and settings.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
