import EnhancedChannelsShell from '@/components/channels/EnhancedChannelsShell'
import { ChannelsProvider } from '@/components/channels/ChannelsProvider'
import { PresenceProvider } from '@/components/PresenceProvider'

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PresenceProvider>
      <ChannelsProvider>
        <EnhancedChannelsShell>{children}</EnhancedChannelsShell>
      </ChannelsProvider>
    </PresenceProvider>
  )
}
