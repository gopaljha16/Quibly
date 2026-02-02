'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type InviteInfo = {
    success: boolean
    invite: {
        code: string
        server: {
            id: string
            name: string
            icon: string | null
            membersCount: number
            description: string | null
        }
        inviter: {
            username: string
            avatar: string | null
        }
    }
}

export function useInviteInfo(code: string | undefined) {
    return useQuery({
        queryKey: ['invite', code],
        queryFn: async () => {
            if (!code) throw new Error('Invite code required')
            return await apiGet<InviteInfo>(`/invites/${code}`)
        },
        enabled: !!code,
        retry: false
    })
}
