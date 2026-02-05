import React from 'react'

// URL regex pattern to detect links - improved to handle more edge cases
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/gi
// Mention regex pattern to detect @username
const MENTION_REGEX = /@([a-zA-Z0-9_]{2,32})/g

export interface LinkifyProps {
  text: string
  className?: string
  linkClassName?: string
}

export function linkifyText(text: string): Array<{ type: 'text' | 'link' | 'mention'; content: string }> {
  const parts: Array<{ type: 'text' | 'link' | 'mention'; content: string }> = []
  let lastIndex = 0
  let match

  // Reset regex lastIndex to ensure proper matching
  URL_REGEX.lastIndex = 0
  MENTION_REGEX.lastIndex = 0

  const allMatches: Array<{ type: 'link' | 'mention'; index: number; content: string }> = []

  // Collect all link matches
  while ((match = URL_REGEX.exec(text)) !== null) {
    allMatches.push({
      type: 'link',
      index: match.index,
      content: match[0]
    })
  }

  // Collect all mention matches
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    allMatches.push({
      type: 'mention',
      index: match.index,
      content: match[0]
    })
  }

  // Sort matches by index
  allMatches.sort((a, b) => a.index - b.index)

  // Filter overlapping matches (rare but possible)
  const nonOverlappingMatches: typeof allMatches = []
  let lastMatchEnd = 0
  for (const m of allMatches) {
    if (m.index >= lastMatchEnd) {
      nonOverlappingMatches.push(m)
      lastMatchEnd = m.index + m.content.length
    }
  }

  for (const m of nonOverlappingMatches) {
    // Add text before the match
    if (m.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, m.index)
      })
    }

    // Add the match
    parts.push({
      type: m.type,
      content: m.content
    })

    lastIndex = m.index + m.content.length
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