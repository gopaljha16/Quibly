import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface DiscoveredServer {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    banner?: string;
    membersCount: number;
    isPublic: boolean;
    ownerId: string;
    owner: {
        id: string;
        username: string;
        discriminator: string;
        avatar?: string;
    };
    interests: Array<{
        id: string;
        name: string;
    }>;
    isMember: boolean;
    matchCount: number;
    createdAt: string;
}

export interface DiscoverServersParams {
    interests?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}

export const serverDiscoveryService = {
    // Discover public servers
    discoverServers: async (params?: DiscoverServersParams) => {
        const queryParams = new URLSearchParams();
        
        if (params?.interests && params.interests.length > 0) {
            queryParams.append('interests', params.interests.join(','));
        }
        if (params?.search) {
            queryParams.append('search', params.search);
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.offset) {
            queryParams.append('offset', params.offset.toString());
        }

        const response = await apiGet<any>(`/server/discover?${queryParams.toString()}`);
        return response;
    },

    // Get server interests
    getServerInterests: async (serverId: string) => {
        const response = await apiGet<any>(`/server/${serverId}/interests`);
        return response;
    },

    // Add interests to server
    addServerInterests: async (serverId: string, interestIds: string[]) => {
        const response = await apiPost<any>(`/server/${serverId}/interests`, {
            interestIds
        });
        return response;
    },

    // Remove interest from server
    removeServerInterest: async (serverId: string, interestId: string) => {
        const response = await apiDelete<any>(`/server/${serverId}/interests/${interestId}`);
        return response;
    }
};
