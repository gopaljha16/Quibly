// Frontend-only link preview utilities

export interface LinkPreview {
  url: string
  title: string
  description: string
  image: string
  favicon: string
  siteName: string
  type: string
}

// Extract URLs from message content
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex) || []
  
  // Clean URLs (remove trailing punctuation)
  return urls.map(url => {
    return url.replace(/[.,;:!?)\]}]+$/, '')
  }).filter(url => isValidUrl(url))
}

// Check if URL is valid
export const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

// Fetch link preview using backend endpoint
export const fetchLinkPreview = async (url: string): Promise<LinkPreview | null> => {
  try {
    if (!isValidUrl(url)) {
      return null
    }

    // Use our backend endpoint for fetching link previews
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api'
    const fetchUrl = `${API_BASE_URL}/link-preview?url=${encodeURIComponent(url)}`
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LinkPreview] Failed to fetch preview:', response.status, errorText)
      throw new Error(`Failed to fetch preview: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.preview) {
      return null
    }

    const preview = data.preview

    // Only return if we have useful data
    if (!preview.title && !preview.description && !preview.image) {
      return null
    }

    return {
      url,
      title: preview.title || '',
      description: preview.description || '',
      image: preview.image || '',
      favicon: preview.favicon || '',
      siteName: preview.siteName || '',
      type: preview.type || 'website'
    }

  } catch (error) {
    console.error('[LinkPreview] Error fetching preview:', error)
    return null
  }
}

// Get domain info for fallback display
export const getDomainInfo = (url: string) => {
  try {
    const urlObj = new URL(url)
    return {
      hostname: urlObj.hostname,
      protocol: urlObj.protocol,
      pathname: urlObj.pathname
    }
  } catch {
    return null
  }
}

// Check if URL is from a known platform for special handling
export const getPlatformType = (url: string): string | null => {
  try {
    const domain = new URL(url).hostname.toLowerCase()
    
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return 'youtube'
    }
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return 'twitter'
    }
    if (domain.includes('linkedin.com')) {
      return 'linkedin'
    }
    if (domain.includes('github.com')) {
      return 'github'
    }
    if (domain.includes('instagram.com')) {
      return 'instagram'
    }
    if (domain.includes('tiktok.com')) {
      return 'tiktok'
    }
    
    return null
  } catch {
    return null
  }
}