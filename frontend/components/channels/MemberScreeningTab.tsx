'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiRequest } from '@/lib/api'
import { toast } from 'sonner'

type MemberScreening = {
    enabled: boolean
    questions: Array<{ id: string; question: string; required: boolean }>
    requiresApproval: boolean
}

export default function MemberScreeningTab({ serverId }: { serverId: string }) {
    const queryClient = useQueryClient()
    const [enabled, setEnabled] = useState(false)
    const [requiresApproval, setRequiresApproval] = useState(false)
    const [questions, setQuestions] = useState<Array<{ id: string; question: string; required: boolean }>>([])

    const { data: screeningData } = useQuery({
        queryKey: ['memberScreening', serverId],
        queryFn: async () => {
            const response = await apiGet<{ success: boolean; screening: MemberScreening }>(
                `/server/${serverId}/member-screening`
            )
            return response.screening
        }
    })

    useEffect(() => {
        if (screeningData) {
            setEnabled(screeningData.enabled)
            setRequiresApproval(screeningData.requiresApproval)
            setQuestions(screeningData.questions || [])
        }
    }, [screeningData])

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<MemberScreening>) => {
            return await apiRequest(`/server/${serverId}/member-screening`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberScreening', serverId] })
            toast.success('Member screening updated')
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update member screening')
        }
    })

    const handleSave = () => {
        updateMutation.mutate({
            enabled,
            requiresApproval,
            questions
        })
    }

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now().toString(), question: '', required: true }])
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, question: string) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, question } : q))
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Member Screening</h3>
                <p className="text-sm text-slate-400">Screen new members before they join</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-[3px]">
                    <div>
                        <div className="text-sm font-medium text-white">Enable Member Screening</div>
                        <div className="text-xs text-slate-400">Require new members to answer questions</div>
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
                        <div className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-[3px]">
                            <div>
                                <div className="text-sm font-medium text-white">Require Manual Approval</div>
                                <div className="text-xs text-slate-400">Review responses before allowing access</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={requiresApproval}
                                    onChange={(e) => setRequiresApproval(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#3F4147] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865F2]"></div>
                            </label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-slate-300">
                                    Screening Questions
                                </label>
                                <button
                                    onClick={addQuestion}
                                    className="text-xs text-[#5865F2] hover:text-[#4752C4] font-medium"
                                >
                                    + Add Question
                                </button>
                            </div>

                            <div className="space-y-2">
                                {questions.map((q, index) => (
                                    <div key={q.id} className="flex gap-2">
                                        <input
                                            value={q.question}
                                            onChange={(e) => updateQuestion(q.id, e.target.value)}
                                            className="flex-1 bg-[#1E1F22] text-slate-50 p-2.5 rounded-[3px] border-none outline-none text-sm"
                                            placeholder={`Question ${index + 1}`}
                                        />
                                        <button
                                            onClick={() => removeQuestion(q.id)}
                                            className="px-3 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
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
