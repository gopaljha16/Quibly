import ChannelsShell from '@/components/channels/ChannelsShell'
import { ChannelsProvider } from '@/components/channels/ChannelsProvider'

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChannelsProvider>
      <ChannelsShell>{children}</ChannelsShell>
    </ChannelsProvider>
  )
}
