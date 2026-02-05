'use client'

import React from 'react'
import { linkifyText } from '@/lib/linkify'

interface LinkifiedTextProps {
  text: string
  className?: string
  linkClassName?: string
}

export default function LinkifiedText({ 
  text, 
  className = '', 
  linkClassName = 'text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition-colors'
}: LinkifiedTextProps) {
  const parts = linkifyText(text)
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.content}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {part.content}
            </a>
          )
        }
        
        if (part.type === 'mention') {
          return (
            <span
              key={index}
              className="px-[2px] rounded-[3px] bg-[#5865F2]/30 text-[#dee0fc] font-medium cursor-pointer hover:bg-[#5865F2] hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Future: open user profile profile
              }}
            >
              {part.content}
            </span>
          )
        }
        
        return <span key={index}>{part.content}</span>
      })}
    </span>
  )
}