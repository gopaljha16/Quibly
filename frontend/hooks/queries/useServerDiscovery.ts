import { useQuery } from '@tanstack/react-query';
import { serverDiscoveryService, DiscoverServersParams } from '@/services/api/serverDiscoveryService';

export const useDiscoverServers = (params?: DiscoverServersParams) => {
    return useQuery({
        queryKey: ['servers', 'discover', params],
        queryFn: () => serverDiscoveryService.discoverServers(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useServerInterests = (serverId: string) => {
    return useQuery({
        queryKey: ['servers', serverId, 'interests'],
        queryFn: () => serverDiscoveryService.getServerInterests(serverId),
        enabled: !!serverId,
    });
};

export const useAllInterests = () => {
    return useQuery({
        queryKey: ['interests', 'all'],
        queryFn: () => serverDiscoveryService.getAllInterests(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
