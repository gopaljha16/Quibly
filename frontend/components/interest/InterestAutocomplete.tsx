'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command'

interface Interest {
    id: string
    name: string
}

interface InterestAutocompleteProps {
    interests: Interest[]
    selectedInterests: string[]
    onSelect: (interestId: string) => void
}

export default function InterestAutocomplete({
    interests,
    selectedInterests,
    onSelect
}: InterestAutocompleteProps) {
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const filteredInterests = interests.filter(interest =>
        !selectedInterests.includes(interest.id) &&
        interest.name.toLowerCase().includes(search.toLowerCase())
    )

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={inputRef}>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Search className="h-4 w-4 text-[#bdb9b6] group-focus-within:text-cyan-400 transition-colors" />
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#bdb9b6] group-focus-within:text-cyan-400 transition-colors">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="font-medium">Live</span>
                    </div>
                </div>

                <Input
                    type="text"
                    placeholder="Search from 96 interests..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    className="pl-10 pr-24 bg-[#030305] border-[#f3c178]/30 text-[#fef9f0] placeholder:text-[#6b635c] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-11 transition-all duration-200"
                />
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20"></div>

                        <Command className="relative rounded-xl border border-[#f3c178]/20 bg-[#12131a] backdrop-blur-xl shadow-2xl">
                            <CommandList className="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {filteredInterests.length > 0 ? (
                                    <CommandGroup>
                                        <div className="p-3 text-xs text-[#bdb9b6] font-semibold flex items-center gap-2 border-b border-[#f3c178]/10">
                                            <div className="w-2 h-2 bg-[#f3c178] rounded-full animate-pulse"></div>
                                            <span>{filteredInterests.length} interests found</span>
                                        </div>
                                        {filteredInterests.map((interest, index) => (
                                            <CommandItem
                                                key={interest.id}
                                                value={interest.id}
                                                onSelect={() => {
                                                    onSelect(interest.id)
                                                    setSearch('')
                                                    setOpen(false)
                                                }}
                                                className="cursor-pointer text-[#fef9f0] hover:text-[#fef9f0] hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-600/20 transition-all duration-150 rounded-lg mx-2 my-1 px-3 py-2.5 group/item border border-transparent hover:border-[#f3c178]/30"
                                                style={{ animationDelay: `${index * 20}ms` }}
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-2 h-2 rounded-full bg-[#f3c178] group-hover/item:scale-125 transition-transform"></div>

                                                    <div className="flex-1">
                                                        <span className="capitalize font-medium text-sm">
                                                            {interest.name.replace(/-/g, ' ')}
                                                        </span>
                                                        {interest.name === 'no-interest' && (
                                                            <span className="ml-2 text-xs text-[#bdb9b6]">(Skip)</span>
                                                        )}
                                                    </div>

                                                    <div className="w-6 h-6 rounded-md bg-[#f3c178]/20 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity border border-[#f3c178]/30">
                                                        <span className="text-cyan-400 text-sm font-bold">+</span>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ) : (
                                    <CommandEmpty className="py-8 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-[#f3c178]/10 flex items-center justify-center border border-[#f3c178]/20">
                                                <Search className="w-6 h-6 text-[#bdb9b6]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#fef9f0] font-medium">No match found</p>
                                                <p className="text-xs text-[#bdb9b6] mt-1">Try a different term</p>
                                            </div>
                                        </div>
                                    </CommandEmpty>
                                )}
                            </CommandList>
                        </Command>
                    </div>
                </div>
            )}
        </div>
    )
}
