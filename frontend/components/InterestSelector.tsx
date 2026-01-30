'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import InterestAutocomplete from './interest/InterestAutocomplete'
import SelectedInterests from './interest/SelectedInterests'

interface Interest {
    id: string
    name: string
}

interface InterestSelectorProps {
    selectedInterests: string[]
    onChange: (interests: string[]) => void
    error?: string
    allowSkip?: boolean
}

export default function InterestSelector({
    selectedInterests,
    onChange,
    error,
    allowSkip = true
}: InterestSelectorProps) {
    const [interests, setInterests] = useState<Interest[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        fetchInterests()
    }, [])

    // Auto-expand when user starts selecting interests
    useEffect(() => {
        if (selectedInterests.length > 0) {
            setExpanded(true)
        }
    }, [selectedInterests.length])

    const fetchInterests = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interests`)
            const data = await res.json()
            console.log('Interests response:', data)
            if (data.success) {
                setInterests(data.interests)
            } else {
                console.error('Failed response:', data)
            }
        } catch (error) {
            console.error('Failed to fetch interests:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (interestId: string) => {
        if (!selectedInterests.includes(interestId)) {
            onChange([...selectedInterests, interestId])
        }
    }

    const handleRemove = (interestId: string) => {
        onChange(selectedInterests.filter(id => id !== interestId))
    }

    const selectedInterestObjects = interests.filter(i => selectedInterests.includes(i.id))

    if (loading) {
        return (
            <div className="space-y-3 p-6 border border-[#f3c178]/20 rounded-xl bg-[#0b0500]/60 animate-pulse">
                <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-[#f3c178] animate-spin" />
                        <p className="text-[#bdb9b6] text-sm font-medium">Loading interests...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`space-y-4 p-6 border border-[#f3c178]/30 rounded-xl bg-[#0b0500]/60 transition-all duration-500 ${expanded ? 'ring-2 ring-[#f3c178]/20 shadow-lg shadow-[#f3c178]/10' : ''
                }`}
        >
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[#f3c178] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Select Your Interests
                    <span className="text-xs text-[#bdb9b6] font-normal">(optional)</span>
                </Label>
            </div>

            {/* No Interest Option */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onChange([])}
                    className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${selectedInterests.length === 0
                            ? 'bg-[#f3c178]/20 border-[#f3c178] text-[#f3c178] shadow-md shadow-[#f3c178]/20'
                            : 'bg-[#0b0500] border-[#f3c178]/30 text-[#bdb9b6] hover:border-[#f3c178]/60 hover:text-[#f3c178]'
                        }`}
                >
                    No Interest
                </button>
            </div>

            {/* Autocomplete search */}
            <div onClick={() => setExpanded(true)}>
                <InterestAutocomplete
                    interests={interests}
                    selectedInterests={selectedInterests}
                    onSelect={handleSelect}
                    loading={loading}
                />
            </div>

            {/* Expandable section */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                {/* Selected interests */}
                <SelectedInterests
                    interests={selectedInterestObjects}
                    onRemove={handleRemove}
                />

                {selectedInterestObjects.length > 0 && (
                    <div className="mt-4 p-3 bg-[#f3c178]/10 border border-[#f3c178]/20 rounded-lg">
                        <p className="text-xs text-[#fef9f0] flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-[#f3c178]" />
                            {selectedInterestObjects.length} {selectedInterestObjects.length === 1 ? 'interest' : 'interests'} selected - You'll get personalized recommendations!
                        </p>
                    </div>
                )}

                {selectedInterests.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="mt-3 w-full text-xs text-[#bdb9b6] hover:text-[#f3c178] flex items-center justify-center gap-1 transition-colors"
                    >
                        <ChevronUp className="w-3 h-3" />
                        Collapse
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-[#f35e41]/10 border border-[#f35e41]/50 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f35e41] animate-pulse"></div>
                    <p className="text-sm text-[#f35e41]">{error}</p>
                </div>
            )}

            {!expanded && selectedInterests.length === 0 && (
                <p className="text-xs text-[#bdb9b6] text-center">
                    Click above to explore interests or continue with no interests
                </p>
            )}
        </div>
    )
}
