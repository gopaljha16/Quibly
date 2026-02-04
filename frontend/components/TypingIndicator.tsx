'use client'

interface TypingUser {
  userId: string
  username: string
  avatar?: string
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const formatTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers[2].username} are typing`
    } else {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers.length - 2} others are typing`
    }
  }

  return (
    <div className="px-4 py-2 text-sm text-[#949ba4] flex items-center gap-2 animate-fade-in">
      <span>{formatTypingText()}</span>
      <div className="flex gap-1 ml-1 px-1 py-0.5 rounded-md bg-[#2b2d31]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#dbdee1] animate-bounce-dot animation-delay-0"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-[#dbdee1] animate-bounce-dot animation-delay-200"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-[#dbdee1] animate-bounce-dot animation-delay-400"></div>
      </div>
    </div>
  )
}
