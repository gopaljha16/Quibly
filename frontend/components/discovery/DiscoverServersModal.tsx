'use client'

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { useDiscoverServers } from '@/hooks/queries/useServerDiscovery';
import { useProfile } from '@/hooks/queries/useProfile';
import ServerCard from './ServerCard';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

interface DiscoverServersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DiscoverServersModal({ open, onOpenChange }: DiscoverServersModalProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [useMyInterests, setUseMyInterests] = useState(true);
    const [joiningServerId, setJoiningServerId] = useState<string | null>(null);

    // Get user profile for interests
    const { data: profileData } = useProfile();
    const userInterestIds = useMemo(() => {
        return profileData?.user?.userInterests?.map((ui: any) => ui.interest.id) || [];
    }, [profileData]);

    // Discover servers
    const { data, isLoading, refetch } = useDiscoverServers({
        interests: useMyInterests ? userInterestIds : undefined,
        search: search || undefined,
        limit: 20
    });

    const servers = data?.servers || [];

    const handleJoinServer = async (serverId: string) => {
        try {
            setJoiningServerId(serverId);
            await apiPost(`/server/${serverId}/join`, {});
            
            toast.success('Successfully joined server!');
            
            // Refetch to update isMember status
            refetch();
            
            // Navigate to the server
            router.push(`/channels/${serverId}`);
            onOpenChange(false);
        } catch (error: any) {
            console.error('Join server error:', error);
            toast.error(error.message || 'Failed to join server');
        } finally {
            setJoiningServerId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] bg-[#1e1f22] border-[#2b2d31] text-[#fef9f0] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-[#2b2d31]">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-[#f3c178]" />
                        Discover Servers
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bdb9b6]" />
                        <Input
                            placeholder="Search servers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-10 bg-[#2b2d31] border-[#3f4147] text-[#fef9f0] placeholder:text-[#bdb9b6]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb9b6] hover:text-[#fef9f0]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    {userInterestIds.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-lg">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#f3c178]" />
                                <span className="text-sm text-[#fef9f0]">
                                    Match my interests ({userInterestIds.length})
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUseMyInterests(!useMyInterests)}
                                className={`${
                                    useMyInterests
                                        ? 'bg-[#f3c178]/20 text-[#f3c178] border-[#f3c178]/30'
                                        : 'bg-transparent text-[#bdb9b6] border-[#3f4147]'
                                }`}
                            >
                                {useMyInterests ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Server List */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#f3c178] animate-spin" />
                        </div>
                    ) : servers.length === 0 ? (
                        <div className="text-center py-12">
                            <Sparkles className="w-12 h-12 text-[#bdb9b6] mx-auto mb-4" />
                            <p className="text-[#bdb9b6] text-lg mb-2">No servers found</p>
                            <p className="text-[#bdb9b6] text-sm">
                                {search
                                    ? 'Try adjusting your search'
                                    : useMyInterests && userInterestIds.length > 0
                                    ? 'Try disabling interest matching'
                                    : 'No public servers available'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {servers.map((server: any) => (
                                <ServerCard
                                    key={server._id}
                                    server={server}
                                    userInterests={userInterestIds}
                                    onJoin={handleJoinServer}
                                    isJoining={joiningServerId === server._id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
