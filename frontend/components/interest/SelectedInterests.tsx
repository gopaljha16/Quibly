'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Interest {
    id: string
    name: string
}

interface SelectedInterestsProps {
    interests: Interest[]
    onRemove: (interestId: string) => void
}

export default function SelectedInterests({ interests, onRemove }: SelectedInterestsProps) {
    if (interests.length === 0) return null

    return (
        <div className="space-y-2">
            <p className="text-xs text-[#bdb9b6] font-medium">Selected ({interests.length})</p>
            <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                    <Badge
                        key={interest.id}
                        variant="secondary"
                        className="px-3 py-1.5 bg-gradient-to-r from-[#f3c178]/20 to-[#f35e41]/20 border border-[#f3c178]/30 text-[#fef9f0] hover:bg-[#f3c178]/30 transition-all duration-200 group"
                    >
                        <span className="capitalize text-sm font-medium">
                            {interest.name.replace(/-/g, ' ')}
                        </span>
                        <button
                            onClick={() => onRemove(interest.id)}
                            className="ml-2 rounded-full p-0.5 hover:bg-[#f35e41]/50 transition-colors"
                            aria-label="Remove interest"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
