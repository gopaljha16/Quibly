'use client'

import { useEffect, useState } from 'react'
import { fetchLinkPreview, getDomainInfo, getPlatformType, type LinkPreview as LinkPreviewType } from '@/lib/linkPreview'

interface LinkPreviewProps {
  url: string
  className?: string
}

export default function LinkPreview({ url, className = '' }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true)
      setError(false)
      
      try {
        const previewData = await fetchLinkPreview(url)
        setPreview(previewData)
      } catch (err) {
        console.error('Failed to load preview:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [url])

  // Show loading state
  if (loading) {
    return (
      <div className={`max-w-md rounded-lg border border-white/10 bg-[#2f3136] p-3 animate-pulse ${className}`}>
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-white/10 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  // Show error or no preview available
  if (error || !preview) {
    const domainInfo = getDomainInfo(url)
    const platformType = getPlatformType(url)
    
    return (
      <div className={`max-w-md rounded-lg border border-white/10 bg-[#2f3136] p-3 hover:bg-[#36393f] transition-colors ${className}`}>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-white/80 hover:text-white"
        >
          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
            {platformType === 'youtube' && (
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-red-500">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            )}
            {platformType === 'twitter' && (
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-blue-400">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            )}
            {platformType === 'linkedin' && (
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-blue-600">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            )}
            {platformType === 'github' && (
              <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current text-white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
            {!platformType && (
              <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-white/50">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {domainInfo?.hostname || 'Link'}
            </div>
            <div className="text-xs text-white/60 truncate">
              {url}
            </div>
          </div>
        </a>
      </div>
    )
  }

  // Show full preview
  return (
    <div className={`max-w-md rounded-lg border border-white/10 bg-[#2f3136] overflow-hidden hover:bg-[#36393f] transition-colors ${className}`}>
      <a 
        href={preview.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {/* Image */}
        {preview.image && (
          <div className="aspect-video w-full bg-black/20 overflow-hidden">
            <img 
              src={preview.image} 
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}
        
        {/* Content */}
        <div className="p-3">
          {/* Site name */}
          {preview.siteName && (
            <div className="flex items-center gap-2 mb-2">
              {preview.favicon && (
                <img 
                  src={preview.favicon} 
                  alt=""
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              )}
              <span className="text-xs text-white/60 font-medium">
                {preview.siteName}
              </span>
            </div>
          )}
          
          {/* Title */}
          {preview.title && (
            <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
              {preview.title}
            </h3>
          )}
          
          {/* Description */}
          {preview.description && (
            <p className="text-xs text-white/70 line-clamp-3">
              {preview.description}
            </p>
          )}
        </div>
      </a>
    </div>
  )
}