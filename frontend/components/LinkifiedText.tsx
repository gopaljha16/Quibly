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
        
        return <span key={index}>{part.content}</span>
      })}
    </span>
  )
}