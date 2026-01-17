'use client'

import { useMemo } from 'react'
import { extractUrls } from './linkPreview'

export function useLinkPreviews(messageContent: string) {
  const urls = useMemo(() => {
    if (!messageContent) return []
    return extractUrls(messageContent)
  }, [messageContent])

  const hasLinks = urls.length > 0

  return {
    urls,
    hasLinks,
    firstUrl: urls[0] || null
  }
}