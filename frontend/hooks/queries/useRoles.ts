'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'

export type Role = {
    id: string
    serverId: string
    name: string
    color: string | null
    permissions: number
    position: number
    hoist: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

export function useRoles(serverId: string | null) {
    return useQuery({
        queryKey: ['roles', serverId],
        queryFn: async () => {
            if (!serverId) return []
            const response = await apiRequest<{ success: boolean; roles: Role[] }>(`/server/${serverId}/roles`)
            return response.roles
        },
        enabled: !!serverId,
    })
}
