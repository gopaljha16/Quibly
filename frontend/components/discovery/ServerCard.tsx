'use client'

import { Users, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiscoveredServer } from '@/services/api/serverDiscoveryService';

interface ServerCardProps {
    server: DiscoveredServer;
    userInterests?: string[];
    onJoin: (serverId: string) => void;
    isJoining?: boolean;
}

export default function ServerCard({ server, userInterests = [], onJoin, isJoining }: ServerCardProps) {
    const matchingInterests = server.interests.filter(interest => 
        userInterests.includes(interest.id)
    );

    return (
        <Card className="p-4 bg-[#1e1f22] border-[#2b2d31] hover:border-[#f3c178]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#f3c178]/10">
            <div className="flex gap-4">
                {/* Server Icon */}
                <div className="flex-shrink-0">
                    {server.icon ? (
                        <img
                            src={server.icon}
                            alt={server.name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center">
                            <Hash className="w-8 h-8 text-white" />
                        </div>
                    )}
                </div>

                {/* Server Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[#fef9f0] font-semibold text-lg truncate">
                                {server.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-[#bdb9b6] mt-1">
                                <Users className="w-4 h-4" />
                                <span>{server.membersCount.toLocaleString()} members</span>
                            </div>
                        </div>

                        {/* Join Button */}
                        <Button
                            onClick={() => onJoin(server._id)}
                            disabled={server.isMember || isJoining}
                            size="sm"
                            className={`flex-shrink-0 ${
                                server.isMember
                                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/20 cursor-default'
                                    : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                            }`}
                        >
                            {server.isMember ? (
                                <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Joined
                                </>
                            ) : isJoining ? (
                                'Joining...'
                            ) : (
                                'Join Server'
                            )}
                        </Button>
                    </div>

                    {/* Description */}
                    {server.description && (
                        <p className="text-sm text-[#bdb9b6] line-clamp-2 mb-3">
                            {server.description}
                        </p>
                    )}

                    {/* Interests */}
                    {server.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {server.interests.map(interest => {
                                const isMatching = matchingInterests.some(mi => mi.id === interest.id);
                                return (
                                    <Badge
                                        key={interest.id}
                                        variant="secondary"
                                        className={`text-xs ${
                                            isMatching
                                                ? 'bg-[#f3c178]/20 text-[#f3c178] border border-[#f3c178]/30'
                                                : 'bg-[#2b2d31] text-[#bdb9b6] border-transparent'
                                        }`}
                                    >
                                        {interest.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
