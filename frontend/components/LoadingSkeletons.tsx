export function ServerListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-12 h-12 rounded-[24px] bg-[#313338] animate-pulse"
        />
      ))}
    </div>
  )
}

export function ChannelListSkeleton() {
  return (
    <div className="space-y-[2px] px-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-8 rounded-[4px] bg-[#35373C] animate-pulse"
        />
      ))}
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#404249] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#404249] rounded w-32 animate-pulse" />
            <div className="h-4 bg-[#404249] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#404249] rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-2 px-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-[#404249] animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-[#404249] rounded w-24 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
