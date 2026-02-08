'use client'

import { useCall } from '@/hooks/useCall'
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, X, Volume2 } from 'lucide-react'
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useEffect, useRef, useState } from 'react'
import { generateRingtone } from '@/lib/generateRingtones'

export default function CallOverlay() {
  const { callStep, otherUser, hasVideo, token, wsUrl, acceptCall, rejectCall, endCall } = useCall()
  const outgoingRingtoneRef = useRef<HTMLAudioElement | null>(null)
  const incomingRingtoneRef = useRef<HTMLAudioElement | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio elements
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create AudioContext to unlock audio on iOS/Safari
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        
        // Create audio elements
        const outgoingAudio = new Audio()
        const incomingAudio = new Audio()

        // Set up outgoing ringtone
        outgoingAudio.loop = true
        outgoingAudio.volume = 0.5
        outgoingAudio.preload = 'auto'

        // Set up incoming ringtone
        incomingAudio.loop = true
        incomingAudio.volume = 0.7
        incomingAudio.preload = 'auto'

        // Try to load audio files with better error handling
        const tryLoadAudio = async (audio: HTMLAudioElement, type: 'incoming' | 'outgoing') => {
          const extensions = ['wav', 'mp3']
          
          for (const ext of extensions) {
            try {
              const audioPath = `/sounds/${type}-call.${ext}`
              audio.src = audioPath
              
              // Wait for audio to be ready with shorter timeout
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Audio load timeout'))
                }, 1000) // Reduced to 1 second
                
                const onCanPlay = () => {
                  clearTimeout(timeout)
                  resolve()
                }
                
                const onError = (e: any) => {
                  clearTimeout(timeout)
                  reject(e)
                }
                
                audio.addEventListener('canplaythrough', onCanPlay, { once: true })
                audio.addEventListener('error', onError, { once: true })
                audio.load()
              })
              
              return true
            } catch (error) {
              continue
            }
          }
          
          // If no file found, generate fallback tone
          try {
            const generatedUrl = generateRingtone(type)
            if (generatedUrl) {
              audio.src = generatedUrl
              return true
            }
          } catch (error) {
            // Silent fail
          }
          
          return false
        }

        // Load both audio files (don't await - let it happen in background)
        Promise.all([
          tryLoadAudio(outgoingAudio, 'outgoing'),
          tryLoadAudio(incomingAudio, 'incoming')
        ]).then(() => {
          setAudioInitialized(true)
        }).catch(() => {
          // Even if audio fails, mark as initialized so UI isn't blocked
          setAudioInitialized(true)
        })

        outgoingRingtoneRef.current = outgoingAudio
        incomingRingtoneRef.current = incomingAudio
      } catch (error) {
        // Silent fail - still set initialized to true so UI isn't blocked
        setAudioInitialized(true)
      }
    }

    initAudio()

    return () => {
      // Cleanup audio elements
      if (outgoingRingtoneRef.current) {
        outgoingRingtoneRef.current.pause()
        outgoingRingtoneRef.current.src = ''
        outgoingRingtoneRef.current = null
      }
      if (incomingRingtoneRef.current) {
        incomingRingtoneRef.current.pause()
        incomingRingtoneRef.current.src = ''
        incomingRingtoneRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  // Handle ringtone playback based on call state
  useEffect(() => {
    if (!audioInitialized) return

    const playSound = async (audio: HTMLAudioElement | null) => {
      if (!audio) return
      
      try {
        // Resume AudioContext if suspended (for iOS/Safari)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        
        audio.currentTime = 0
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          await playPromise
          setAudioBlocked(false)
        }
      } catch (error: any) {
        // If autoplay is blocked, set flag
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          setAudioBlocked(true)
        }
      }
    }

    const stopSound = (audio: HTMLAudioElement | null) => {
      if (!audio) return
      
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (error) {
        // Silent fail
      }
    }

    if (callStep === 'calling') {
      playSound(outgoingRingtoneRef.current)
      stopSound(incomingRingtoneRef.current)
    } else if (callStep === 'incoming') {
      playSound(incomingRingtoneRef.current)
      stopSound(outgoingRingtoneRef.current)
    } else {
      stopSound(outgoingRingtoneRef.current)
      stopSound(incomingRingtoneRef.current)
    }

    return () => {
      stopSound(outgoingRingtoneRef.current)
      stopSound(incomingRingtoneRef.current)
    }
  }, [callStep, audioInitialized])

  // Enable audio on user interaction (for browsers that block autoplay)
  const enableAudio = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    setAudioBlocked(false)
  }

  if (callStep === 'idle') return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#1e1f22]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl aspect-video bg-[#2b2d31] rounded-2xl shadow-2xl border border-[#1e1f22] overflow-hidden flex flex-col relative">
        
        {/* Calling / Incoming UI */}
        {(callStep === 'calling' || callStep === 'incoming') && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#313338]">
            {/* Audio blocked warning */}
            {audioBlocked && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#f23f43] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-medium">Click anywhere to enable sound</span>
              </div>
            )}
            
            <div className="relative" onClick={audioBlocked ? enableAudio : undefined} style={{ cursor: audioBlocked ? 'pointer' : 'default' }}>
              <div className={`w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center overflow-hidden border-4 border-[#1e1f22] ${callStep === 'calling' ? 'animate-pulse' : ''} shadow-2xl`}>
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-5xl font-bold text-white uppercase">{otherUser?.username?.[0] || 'U'}</span>
                )}
              </div>
              {callStep === 'incoming' && (
                <div className="absolute -bottom-2 -right-2 bg-[#23a55a] p-3 rounded-full animate-bounce shadow-xl">
                  <Phone className="w-6 h-6 text-white" />
                </div>
              )}
              {/* Audio indicator */}
              {audioInitialized && !audioBlocked && (
                <div className="absolute -top-2 -left-2 bg-[#5865f2] p-2 rounded-full shadow-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current text-white animate-pulse">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{otherUser?.username}</h2>
              <p className="text-[#b5bac1] text-xl font-medium">
                {callStep === 'calling' ? 'Calling...' : `Incoming ${hasVideo ? 'Video' : 'Voice'} Call`}
              </p>
              {audioInitialized && !audioBlocked && (
                <p className="text-[#949ba4] text-sm mt-2 flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#23a55a] rounded-full animate-pulse"></span>
                  Ringing
                </p>
              )}
            </div>

            <div className="flex items-center gap-12 mt-4">
              {callStep === 'incoming' ? (
                <>
                  <button 
                    onClick={async (e) => {
                      await enableAudio()
                      rejectCall()
                    }}
                    className="w-16 h-16 rounded-full bg-[#f23f43] hover:bg-[#d8373b] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg group"
                    title="Reject"
                  >
                    <Phone className="w-8 h-8 text-white rotate-[135deg]" />
                  </button>
                  <button 
                    onClick={async (e) => {
                      await enableAudio()
                      acceptCall()
                    }}
                    className="w-16 h-16 rounded-full bg-[#23a55a] hover:bg-[#1a7f45] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                    title="Accept"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={async (e) => {
                    await enableAudio()
                    endCall()
                  }}
                  className="w-16 h-16 rounded-full bg-[#f23f43] hover:bg-[#d8373b] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                  title="Hang Up"
                >
                  <Phone className="w-8 h-8 text-white rotate-[135deg]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* In-Call UI (LiveKit) */}
        {callStep === 'in-call' && token && wsUrl && (
          <div className="flex-1 overflow-hidden bg-[#111214] relative">
            <LiveKitRoom
              video={hasVideo}
              audio={true}
              token={token}
              serverUrl={wsUrl}
              connect={true}
              style={{ height: '100%' }}
              onDisconnected={endCall}
              data-lk-theme="default"
            >
              <VideoConference />
              <RoomAudioRenderer />
              
              {/* Overlay controls when in video or custom HUD */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#1e1f22]/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-[#313338]">
                <button 
                  onClick={endCall}
                  className="w-12 h-12 rounded-full bg-[#f23f43] hover:bg-[#d8373b] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl"
                  title="Hang Up"
                >
                  <Phone className="w-6 h-6 text-white rotate-[135deg]" />
                </button>
              </div>
            </LiveKitRoom>
          </div>
        )}
        
        {/* Close Button (only for idle but we handle it in component logic) */}
        <button 
          onClick={endCall} 
          className="absolute top-4 right-4 text-[#b5bac1] hover:text-white transition-colors z-[110]"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
