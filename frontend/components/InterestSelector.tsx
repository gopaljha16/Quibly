'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import InterestAutocomplete from './interest/InterestAutocomplete'
import SelectedInterests from './interest/SelectedInterests'
import { useAllInterests } from '@/hooks/queries/useServerDiscovery'

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
    const { data: interestsData, isLoading } = useAllInterests()
    const interests = interestsData?.interests || []
    const [expanded, setExpanded] = useState(false)

    console.log('InterestSelector: Loaded', interests.length, 'interests from static list')

    // Auto-expand when user starts selecting interests
    useEffect(() => {
        if (selectedInterests.length > 0) {
            setExpanded(true)
        }
    }, [selectedInterests.length])

    const handleSelect = (interestId: string) => {
        if (!selectedInterests.includes(interestId)) {
            onChange([...selectedInterests, interestId])
        }
    }

    const handleRemove = (interestId: string) => {
        onChange(selectedInterests.filter(id => id !== interestId))
    }

    const selectedInterestObjects = interests.filter((i: Interest) => selectedInterests.includes(i.id))


    return (
        <div
            className={`space-y-4 p-6 border border-[#f3c178]/30 rounded-xl bg-[#030305]/60 transition-all duration-500 min-h-[140px] flex flex-col justify-center ${expanded ? 'ring-2 ring-cyan-500/20 shadow-lg shadow-[#f3c178]/10' : ''
                }`}
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-[#bdb9b6]">Tailoring interests for you...</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Select Your Interests
                        </Label>
                    </div>


            <div onClick={() => setExpanded(true)}>
                <InterestAutocomplete
                    interests={interests}
                    selectedInterests={selectedInterests}
                    onSelect={handleSelect}
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
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {selectedInterestObjects.length} {selectedInterestObjects.length === 1 ? 'interest' : 'interests'} selected - You'll get personalized recommendations!
                        </p>
                    </div>
                )}

                {selectedInterests.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="mt-3 w-full text-xs text-[#bdb9b6] hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
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
                </>
            )}
        </div>
    )
}
