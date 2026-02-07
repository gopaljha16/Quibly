'use client'

import { useState, useEffect, useRef } from 'react'

interface Gif {
  id: string
  url: string
  preview: string
  title: string
}

interface GifPickerProps {
  onGifSelect: (url: string) => void
  onClose: () => void
}

export default function GifPicker({ onGifSelect, onClose }: GifPickerProps) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Tenor API Key - Using a public-ish demo key or instruction to add one
  // In a real app, this should be an environment variable
  const TENOR_API_KEY = 'LIVDSRZULEUB' // This is a common Tenor demo key

  const fetchGifs = async (query = '') => {
    setLoading(true)
    try {
      const endpoint = query 
        ? `https://g.tenor.com/v1/search?q=${query}&key=${TENOR_API_KEY}&limit=20`
        : `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=20`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      const formattedGifs = data.results.map((result: any) => ({
        id: result.id,
        url: result.media[0].gif.url,
        preview: result.media[0].tinygif.url,
        title: result.title
      }))
      
      setGifs(formattedGifs)
    } catch (error) {
      console.error('Failed to fetch GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGifs()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) fetchGifs(search)
      else fetchGifs()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  return (
    <div 
      className="bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1e1f22] w-full max-w-[350px] h-[450px] max-h-[80vh] flex flex-col overflow-hidden"
    >
      <div className="p-3 border-b border-[#1e1f22]">
        <input
          type="text"
          placeholder="Search Tenor"
          className="w-full bg-[#1e1f22] text-[#dbdee1] text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#5865f2]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent">
        {loading && gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                className="relative aspect-video rounded overflow-hidden hover:ring-2 hover:ring-[#5865f2] transition-all"
                onClick={() => onGifSelect(gif.url)}
              >
                <img 
                  src={gif.preview} 
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <div className="text-[#949ba4] text-center mt-10">No GIFs found</div>
        )}
      </div>
      
      <div className="p-2 border-t border-[#1e1f22] flex justify-end">
        <img 
          src="https://tenor.com/assets/img/links/powered-by-tenor-dark.png" 
          alt="Powered by Tenor"
          className="h-4"
        />
      </div>
    </div>
  )
}
