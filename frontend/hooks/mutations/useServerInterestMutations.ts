import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serverDiscoveryService } from '@/services/api/serverDiscoveryService';
import { toast } from 'sonner';

export const useAddServerInterests = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ serverId, interestIds }: { serverId: string; interestIds: string[] }) =>
            serverDiscoveryService.addServerInterests(serverId, interestIds),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['servers', variables.serverId, 'interests'] });
            queryClient.invalidateQueries({ queryKey: ['servers', 'discover'] });
            toast.success('Server interests updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update server interests');
        },
    });
};

export const useRemoveServerInterest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ serverId, interestId }: { serverId: string; interestId: string }) =>
            serverDiscoveryService.removeServerInterest(serverId, interestId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['servers', variables.serverId, 'interests'] });
            queryClient.invalidateQueries({ queryKey: ['servers', 'discover'] });
            toast.success('Interest removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove interest');
        },
    });
};
