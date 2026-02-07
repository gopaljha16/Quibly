'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type WelcomeScreen = {
    enabled: boolean
    title: string | null
    description: string | null
    welcomeChannels: Array<{ channelId: string; description: string; emoji?: string }>
}

export default function WelcomeScreenTab({ serverId }: { serverId: string }) {
    const queryClient = useQueryClient()
    const [enabled, setEnabled] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const { data: welcomeData } = useQuery({
        queryKey: ['welcomeScreen', serverId],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; welcomeScreen: WelcomeScreen }>(
                `/server/${serverId}/welcome-screen`
            )
            return response.welcomeScreen
        }
    })

    useEffect(() => {
        if (welcomeData) {
            setEnabled(welcomeData.enabled)
            setTitle(welcomeData.title || '')
            setDescription(welcomeData.description || '')
        }
    }, [welcomeData])

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<WelcomeScreen>) => {
            return await apiRequest(`/server/${serverId}/welcome-screen`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['welcomeScreen', serverId] })
            toast.success('Welcome screen updated')
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update welcome screen')
        }
    })

    const handleSave = () => {
        updateMutation.mutate({
            enabled,
            title,
            description,
            welcomeChannels: []
        })
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Welcome Screen</h3>
                <p className="text-sm text-slate-400">Customize the welcome experience for new members</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-[3px]">
                    <div>
                        <div className="text-sm font-medium text-white">Enable Welcome Screen</div>
                        <div className="text-xs text-slate-400">Show a welcome screen to new members</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#3F4147] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865F2]"></div>
                    </label>
                </div>

                {enabled && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Welcome Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none"
                                placeholder="Welcome to our server!"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Welcome Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none h-24 resize-none"
                                placeholder="Tell new members about your server..."
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="pt-4 border-t border-[#3F4147]">
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#3F4147] text-white text-sm font-medium rounded-[3px] transition-colors"
                >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
