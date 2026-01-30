'use client'

import { useState } from 'react'
import { X, Hash, Users, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface Channel {
    id: string
    name: string
    serverId: string
    serverName: string
    serverIcon: string | null
    membersCount: number
    matchCount: number
}

interface Props {
    channels: Channel[]
    onClose: () => void
}

export default function RecommendedChannelsModal({ channels, onClose }: Props) {
    const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set())
    const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
    const [joiningAll, setJoiningAll] = useState(false)

    const handleJoin = async (serverId: string) => {
        try {
            setJoiningIds(prev => new Set(prev).add(serverId))
            await apiPost(`/server/${serverId}/join`, {})
            setJoinedIds(prev => new Set(prev).add(serverId))
        } catch (error) {
            console.error('Failed to join server:', error)
        } finally {
            setJoiningIds(prev => {
                const next = new Set(prev)
                next.delete(serverId)
                return next
            })
        }
    }

    const handleJoinAll = async () => {
        setJoiningAll(true)
        const uniqueServerIds = [...new Set(channels.map(ch => ch.serverId))]
        await Promise.all(uniqueServerIds.map(id => handleJoin(id)))
        setJoiningAll(false)
        // Redirect to channels after joining
        setTimeout(() => {
            window.location.href = '/channels/@me'
        }, 1500)
    }

    const allJoined = channels.every(ch => joinedIds.has(ch.serverId))

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative bg-gradient-to-b from-slate-800/98 to-slate-900/98 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700/60 animate-in zoom-in-95 slide-in-from-bottom-6 duration-400">
                {/* Decorative gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent pointer-events-none"></div>

                {/* Header */}
                <div className="relative p-8 border-b border-slate-700/60 backdrop-blur-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-gradient-to-br from-primary-500/20 via-[#76cd00]/20 to-accent-500/20 rounded-xl border border-primary-500/30 shadow-lg shadow-primary-500/10">
                                    <Sparkles className="w-6 h-6 text-primary-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">
                                        Curated for You
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                        Communities that match your interests
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                We found{' '}
                                <span className="text-primary-400 font-bold">{channels.length}</span>{' '}
                                amazing {channels.length === 1 ? 'community' : 'communities'} perfect for you ✨
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Channels List */}
                <ScrollArea className="relative h-[450px]">
                    <div className="p-6 space-y-3">
                        {channels.length > 0 ? (
                            channels.map((channel, index) => {
                                const isJoining = joiningIds.has(channel.serverId)
                                const isJoined = joinedIds.has(channel.serverId)

                                return (
                                    <div
                                        key={channel.id}
                                        style={{ animationDelay: `${index * 60}ms` }}
                                        className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/30 hover:from-slate-800/70 hover:to-slate-900/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/80 transition-all duration-300 animate-in fade-in slide-in-from-left-5 backdrop-blur-sm"
                                    >
                                        {/* Match indicator */}
                                        {channel.matchCount > 0 && (
                                            <div className="absolute -top-2.5 -right-2.5 z-10">
                                                <Badge className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white border-0 shadow-lg shadow-primary-500/30 gap-1.5 animate-in zoom-in duration-300">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    <span className="font-bold">{channel.matchCount}</span>
                                                    <span className="text-xs opacity-90">{channel.matchCount > 1 ? 'matches' : 'match'}</span>
                                                </Badge>
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-700/60 rounded-lg group-hover:bg-slate-600/80 transition-all shadow-sm">
                                                        <Hash className="w-5 h-5 text-primary-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-lg text-white group-hover:text-primary-300 transition-colors truncate">
                                                            {channel.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="font-medium text-slate-200 truncate flex-1">
                                                        {channel.serverName}
                                                    </span>
                                                    <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 hover:bg-slate-700/70 border-slate-600/50 gap-1.5 whitespace-nowrap">
                                                        <Users className="w-3.5 h-3.5" />
                                                        <span className="font-semibold">{channel.membersCount.toLocaleString()}</span>
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleJoin(channel.serverId)}
                                                disabled={isJoining || isJoined}
                                                size="lg"
                                                className={`px-6 whitespace-nowrap font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${isJoined
                                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
                                                    : 'bg-gradient-to-r from-primary-500 via-[#76cd00] to-accent-500 hover:from-primary-600 hover:via-[#6ab900] hover:to-accent-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 text-white'
                                                    }`}
                                            >
                                                {isJoining ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Joining...
                                                    </>
                                                ) : isJoined ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Joined!
                                                    </>
                                                ) : (
                                                    'Join Server'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                                <p className="text-base font-medium">No recommendations available</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="relative p-6 border-t border-slate-700/60 bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex gap-3">
                        {!allJoined && channels.length > 0 && (
                            <Button
                                onClick={handleJoinAll}
                                disabled={joiningAll}
                                size="lg"
                                className="flex-1 h-12 bg-gradient-to-r from-primary-500 via-[#76cd00] to-accent-500 hover:from-primary-600 hover:via-[#6ab900] hover:to-accent-600 shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 text-white font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {joiningAll ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Joining All...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Join All Communities
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            size="lg"
                            variant="secondary"
                            className="flex-1 h-12 bg-slate-700/80 hover:bg-slate-600/90 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {allJoined ? 'Continue to App' : 'Skip for Now'}
                        </Button>
                    </div>
                    {!allJoined && channels.length > 0 && (
                        <p className="text-xs text-center text-slate-500 mt-4">
                            You can always discover more communities later
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
