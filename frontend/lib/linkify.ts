import React from 'react'

// URL regex pattern to detect links - improved to handle more edge cases
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/gi

export interface LinkifyProps {
  text: string
  className?: string
  linkClassName?: string
}

export function linkifyText(text: string): Array<{ type: 'text' | 'link'; content: string }> {
  const parts: Array<{ type: 'text' | 'link'; content: string }> = []
  let lastIndex = 0
  let match

  // Reset regex lastIndex to ensure proper matching
  URL_REGEX.lastIndex = 0

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    // Add the link
    parts.push({
      type: 'link',
      content: match[0]
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  // If no links found, return the original text
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: text
    })
  }

  return parts
}

export function renderLinkifiedText(
  text: string, 
  linkClassName: string = 'text-blue-400 hover:text-blue-300 hover:underline cursor-pointer'
): React.ReactNode[] {
  const parts = linkifyText(text)
  
  return parts.map((part, index) => {
    if (part.type === 'link') {
      return React.createElement('a', {
        key: index,
        href: part.content,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: linkClassName,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
        }
      }, part.content)
    }
    
    return part.content
  })
}