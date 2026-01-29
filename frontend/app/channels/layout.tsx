import EnhancedChannelsShell from '@/components/channels/EnhancedChannelsShell'
import { PresenceProvider } from '@/components/PresenceProvider'

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PresenceProvider>
      <EnhancedChannelsShell>{children}</EnhancedChannelsShell>
    </PresenceProvider>
  )
}
