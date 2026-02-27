'use client'

import { useState } from 'react'
import { Hash, Volume2, Plus, Trash2, Settings2, Shield, Lock, Eye } from 'lucide-react'
import { useChannelsData } from '@/hooks/useChannelsData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ChannelsTab({ serverId }: { serverId: string }) {
    const { 
        channels, 
        channelsLoading, 
        createChannel, 
        updateChannel, 
        deleteChannel,
        creatingChannel 
    } = useChannelsData()

    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editType, setEditType] = useState<'TEXT' | 'VOICE'>('TEXT')
    const [editIsPrivate, setEditIsPrivate] = useState(false)
    const [editIsReadOnly, setEditIsReadOnly] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const selectedChannel = channels.find(c => c._id === selectedChannelId)

    const handleSelectChannel = (channel: any) => {
        setSelectedChannelId(channel._id)
        setEditName(channel.name)
        setEditType(channel.type || 'TEXT')
        setEditIsPrivate(channel.isPrivate || false)
        setEditIsReadOnly(channel.isReadOnly || false)
    }

    const handleCreateChannel = async () => {
        try {
            await createChannel('new-channel', 'TEXT')
            toast.success('Channel created! Select it to edit details.')
        } catch (error) {
            console.error('Failed to create channel', error)
            toast.error('Failed to create channel')
        }
    }

    const handleSaveChannel = async () => {
        if (!selectedChannelId) return
        setIsSaving(true)
        try {
            await updateChannel(selectedChannelId, {
                name: editName,
                type: editType,
                isPrivate: editIsPrivate,
                isReadOnly: editIsReadOnly
            })
            toast.success('Channel updated')
        } catch (error) {
            console.error('Failed to update channel', error)
            toast.error('Failed to update channel')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteChannel = async () => {
        if (!selectedChannelId) return
        if (!confirm(`Are you sure you want to delete #${selectedChannel?.name}? This cannot be undone.`)) return
        
        try {
            await deleteChannel(selectedChannelId)
            setSelectedChannelId(null)
            toast.success('Channel deleted')
        } catch (error) {
            console.error('Failed to delete channel', error)
            toast.error('Failed to delete channel')
        }
    }

    if (channelsLoading) return <div className="text-slate-400 p-4">Loading channels...</div>

    return (
        <div className="flex h-full gap-6 overflow-hidden">
            {/* Channels List */}
            <div className="w-1/3 border-r border-[#3F4147] pr-4 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Channels</h3>
                    <button
                        onClick={handleCreateChannel}
                        disabled={creatingChannel}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Create Channel"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
                    {channels.map(channel => (
                        <button
                            key={channel._id}
                            onClick={() => handleSelectChannel(channel)}
                            className={`w-full text-left px-2 py-1.5 rounded-[3px] text-sm group flex items-center justify-between transition-colors ${selectedChannelId === channel._id ? 'bg-[#3F4147] text-white' : 'text-slate-400 hover:bg-[#35373C] hover:text-slate-200'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {channel.type === 'VOICE' ? (
                                    <Volume2 className="w-4 h-4 shrink-0 text-slate-500" />
                                ) : (
                                    <Hash className="w-4 h-4 shrink-0 text-slate-500" />
                                )}
                                <span className="truncate">{channel.name}</span>
                            </div>
                            <div className="flex gap-1">
                                {channel.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
                                {channel.isReadOnly && <Eye className="w-3 h-3 text-slate-500" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Channel Editor */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {selectedChannel ? (
                    <div className="flex flex-col gap-6 max-w-[460px]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-slate-400" />
                                Edit Channel
                            </h3>
                            <Badge variant="secondary" className="bg-[#1E1F22] text-slate-400 border-[#3F4147]">
                                {selectedChannel.type || 'TEXT'}
                            </Badge>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Channel Name</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 italic">
                                        #
                                    </div>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        className="bg-[#1E1F22] border-none text-slate-50 pl-7 h-10 focus-visible:ring-1 focus-visible:ring-primary"
                                        placeholder="new-channel"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Channel Type</label>
                                <div className="bg-[#1E1F22] rounded-[3px] p-0.5">
                                    <select 
                                        value={editType} 
                                        onChange={(e) => setEditType(e.target.value as any)}
                                        className="w-full bg-transparent text-slate-50 outline-none text-sm p-2.5 cursor-pointer appearance-none"
                                    >
                                        <option value="TEXT" className="bg-[#111214]">Text Channel</option>
                                        <option value="VOICE" className="bg-[#111214]">Voice Channel</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-[#2B2D31] rounded-[4px] border border-[#3F4147]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-white">Private Channel</span>
                                        </div>
                                        <span className="text-xs text-slate-400">Only selected roles and members will be able to view this channel.</span>
                                    </div>
                                    <Switch 
                                        checked={editIsPrivate}
                                        onCheckedChange={setEditIsPrivate}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#2B2D31] rounded-[4px] border border-[#3F4147]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium text-white">Read Only</span>
                                        </div>
                                        <span className="text-xs text-slate-400">Only members with specific permissions can send messages here.</span>
                                    </div>
                                    <Switch 
                                        checked={editIsReadOnly}
                                        onCheckedChange={setEditIsReadOnly}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col gap-3">
                                <Button
                                    onClick={handleSaveChannel}
                                    disabled={isSaving}
                                    className="bg-[#23A559] hover:bg-[#1a7a42] text-white font-bold h-10"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteChannel}
                                    className="border-[#DA373C] text-[#DA373C] hover:bg-[#DA373C] hover:text-white h-10"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Channel
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <div className="p-4 bg-[#2f3136] rounded-full">
                            <Hash className="w-12 h-12 text-slate-500" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-300">Manage Channels</p>
                            <p className="text-sm">Select a channel from the left to edit it,</p>
                            <p className="text-sm">or create a new one to get started.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
