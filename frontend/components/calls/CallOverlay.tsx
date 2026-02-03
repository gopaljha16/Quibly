'use client'

import { useCall } from '@/hooks/useCall'
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, X } from 'lucide-react'
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'

export default function CallOverlay() {
  const { callStep, otherUser, hasVideo, token, wsUrl, acceptCall, rejectCall, endCall } = useCall()

  if (callStep === 'idle') return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#1e1f22]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl aspect-video bg-[#2b2d31] rounded-2xl shadow-2xl border border-[#1e1f22] overflow-hidden flex flex-col relative">
        
        {/* Calling / Incoming UI */}
        {(callStep === 'calling' || callStep === 'incoming') && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#313338]">
            <div className="relative">
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
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{otherUser?.username}</h2>
              <p className="text-[#b5bac1] text-xl font-medium">
                {callStep === 'calling' ? 'Calling...' : `Incoming ${hasVideo ? 'Video' : 'Voice'} Call`}
              </p>
            </div>

            <div className="flex items-center gap-12 mt-4">
              {callStep === 'incoming' ? (
                <>
                  <button 
                    onClick={rejectCall}
                    className="w-16 h-16 rounded-full bg-[#f23f43] hover:bg-[#d8373b] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg group"
                    title="Reject"
                  >
                    <Phone className="w-8 h-8 text-white rotate-[135deg]" />
                  </button>
                  <button 
                    onClick={acceptCall}
                    className="w-16 h-16 rounded-full bg-[#23a55a] hover:bg-[#1a7f45] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                    title="Accept"
                  >
                    <Phone className="w-8 h-8 text-white" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={endCall}
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
