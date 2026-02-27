'use client'

import { useState } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InterestAutocomplete from '../interest/InterestAutocomplete';
import { useServerInterests, useAllInterests } from '@/hooks/queries/useServerDiscovery';
import { useAddServerInterests, useRemoveServerInterest } from '@/hooks/mutations/useServerInterestMutations';

interface ServerInterestSelectorProps {
    serverId: string;
}

export default function ServerInterestSelector({ serverId }: ServerInterestSelectorProps) {
    const [isAdding, setIsAdding] = useState(false);
    
    const { data: interestsData, isLoading: interestsLoading } = useServerInterests(serverId);
    const { data: allInterestsData, isLoading: allInterestsLoading } = useAllInterests();
    const addInterestsMutation = useAddServerInterests();
    const removeInterestMutation = useRemoveServerInterest();

    const serverInterests = interestsData?.interests || [];
    const allInterests = allInterestsData?.interests || [];
    const selectedInterestIds = serverInterests.map((i: any) => i.id);

    const handleAddInterest = async (interestId: string) => {
        if (selectedInterestIds.includes(interestId)) {
            return;
        }

        if (selectedInterestIds.length >= 10) {
            return;
        }

        await addInterestsMutation.mutateAsync({
            serverId,
            interestIds: [interestId]
        });
        setIsAdding(false);
    };

    const handleRemoveInterest = async (interestId: string) => {
        await removeInterestMutation.mutateAsync({
            serverId,
            interestId
        });
    };

    if (interestsLoading || allInterestsLoading) {
        return (
            <div className="p-4 text-center text-[#bdb9b6]">
                Loading interests...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-[#fef9f0] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#f3c178]" />
                        Server Interests
                    </h3>
                    <p className="text-sm text-[#bdb9b6] mt-1">
                        Add interests to help users discover your server (max 10)
                    </p>
                </div>
                <span className="text-sm text-[#bdb9b6]">
                    {selectedInterestIds.length}/10
                </span>
            </div>

            {/* Selected Interests */}
            {serverInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {serverInterests.map((interest: any) => (
                        <Badge
                            key={interest.id}
                            className="bg-[#f3c178]/20 text-[#f3c178] border border-[#f3c178]/30 pl-3 pr-2 py-1.5 text-sm"
                        >
                            {interest.name}
                            <button
                                onClick={() => handleRemoveInterest(interest.id)}
                                className="ml-2 hover:bg-[#f3c178]/30 rounded-full p-0.5 transition-colors"
                                disabled={removeInterestMutation.isPending}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add Interest */}
            {isAdding ? (
                <div className="space-y-2">
                    <InterestAutocomplete
                        interests={allInterests}
                        selectedInterests={selectedInterestIds}
                        onSelect={handleAddInterest}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(false)}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={() => setIsAdding(true)}
                    disabled={selectedInterestIds.length >= 10}
                    variant="outline"
                    className="w-full border-dashed border-[#f3c178]/30 text-[#f3c178] hover:bg-[#f3c178]/10"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Interest
                </Button>
            )}

            {selectedInterestIds.length === 0 && (
                <div className="p-4 bg-[#2b2d31] rounded-lg border border-[#3f4147]">
                    <p className="text-sm text-[#bdb9b6] text-center">
                        No interests added yet. Add interests to make your server discoverable!
                    </p>
                </div>
            )}
        </div>
    );
}
