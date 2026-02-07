'use client'

import { useState, useEffect } from 'react'
import { apiRequest, ApiError } from '@/lib/api'

type Server = {
  _id: string
  name?: string
  isVerified?: boolean
  isPartnered?: boolean
  badges?: string[]
}

type ApplicationStatus = {
  verification?: 'pending' | 'approved' | 'rejected' | null
  partnership?: 'pending' | 'approved' | 'rejected' | null
}

export default function ServerBadgesTab({ server }: { server: Server }) {
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationType, setApplicationType] = useState<'verification' | 'partnership'>('verification')
  const [applicationReason, setApplicationReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track application status in localStorage
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    verification: null,
    partnership: null
  })

  useEffect(() => {
    // Load application status from localStorage
    const savedStatus = localStorage.getItem(`badge-applications-${server._id}`)
    if (savedStatus) {
      try {
        setApplicationStatus(JSON.parse(savedStatus))
      } catch (e) {
        console.error('Failed to parse application status:', e)
      }
    }
  }, [server._id])

  const badges = [
    {
      id: 'verified',
      name: 'Verified',
      icon: '✓',
      description: 'This server has been verified by the platform',
      color: '#5865F2',
      active: server.isVerified
    },
    {
      id: 'partnered',
      name: 'Partnered',
      icon: '★',
      description: 'Official partner server with exclusive benefits',
      color: '#F0B232',
      active: server.isPartnered
    },
    {
      id: 'early_supporter',
      name: 'Early Supporter',
      icon: '🎖️',
      description: 'One of the first servers on the platform',
      color: '#9B59B6',
      active: server.badges?.includes('early_supporter')
    },
    {
      id: 'community',
      name: 'Community',
      icon: '🏘️',
      description: 'Active and engaged community',
      color: '#2ECC71',
      active: server.badges?.includes('community')
    },
    {
      id: 'developer',
      name: 'Developer',
      icon: '🔧',
      description: 'Developer community or bot server',
      color: '#3498DB',
      active: server.badges?.includes('developer')
    }
  ]

  const handleOpenApplication = (type: 'verification' | 'partnership') => {
    setApplicationType(type)
    setShowApplicationModal(true)
    setApplicationReason('')
    setError(null)
    setSuccess(false)
  }

  const handleSubmitApplication = async () => {
    if (!applicationReason.trim()) {
      setError('Please provide a reason for your application')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Simulate API call - in production, send to backend
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update application status
      const newStatus = {
        ...applicationStatus,
        [applicationType]: 'pending' as const
      }
      setApplicationStatus(newStatus)
      
      // Save to localStorage
      localStorage.setItem(`badge-applications-${server._id}`, JSON.stringify(newStatus))
      
      setSuccess(true)
      setTimeout(() => {
        setShowApplicationModal(false)
      }, 2000)
    } catch (e) {
      setError('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getButtonState = (type: 'verification' | 'partnership') => {
    const status = applicationStatus[type]
    const isActive = type === 'verification' ? server.isVerified : server.isPartnered
    
    if (isActive) {
      return { text: 'Already Active', disabled: true, color: 'bg-[#23A559]' }
    }
    
    if (status === 'pending') {
      return { text: 'Application Pending', disabled: true, color: 'bg-[#F0B232]' }
    }
    
    if (status === 'rejected') {
      return { text: 'Application Rejected', disabled: true, color: 'bg-[#F23F43]' }
    }
    
    return { 
      text: `Apply for ${type === 'verification' ? 'Verification' : 'Partnership'}`, 
      disabled: false, 
      color: type === 'verification' ? 'bg-[#5865F2] hover:bg-[#4752C4]' : 'bg-[#F0B232] hover:bg-[#D9A02B]'
    }
  }

  const verificationButton = getButtonState('verification')
  const partnershipButton = getButtonState('partnership')

  return (
    <>
      <div className="max-w-[600px]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Server Badges</h2>
          <p className="text-sm text-slate-400">
            Badges showcase your server's achievements and status. Contact support to apply for badges.
          </p>
        </div>

        <div className="space-y-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-[#2B2D31] p-4 rounded-lg border-2 transition-all ${
                badge.active
                  ? 'border-[#5865F2] shadow-lg shadow-[#5865F2]/20'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: badge.active ? badge.color + '20' : '#1E1F22' }}
                >
                  {badge.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{badge.name}</h3>
                    {badge.active && (
                      <span className="text-[10px] bg-[#23A559] text-white px-2 py-0.5 rounded-full font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{badge.description}</p>
                </div>

                {badge.active && (
                  <div className="text-[#23A559]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#5865F2]/10 border border-[#5865F2] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-[#5865F2] text-xl">ℹ️</div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">Want to earn badges?</h4>
              <p className="text-sm text-slate-400 mb-3">
                Build an active community, follow our guidelines, and reach out to our team to apply for verification or partnership.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => !verificationButton.disabled && handleOpenApplication('verification')}
                  disabled={verificationButton.disabled}
                  className={`px-4 py-2 ${verificationButton.color} text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {applicationStatus.verification === 'pending' && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {verificationButton.text}
                </button>
                <button 
                  onClick={() => !partnershipButton.disabled && handleOpenApplication('partnership')}
                  disabled={partnershipButton.disabled}
                  className={`px-4 py-2 ${partnershipButton.color} text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {applicationStatus.partnership === 'pending' && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {partnershipButton.text}
                </button>
              </div>
              
              {(applicationStatus.verification === 'pending' || applicationStatus.partnership === 'pending') && (
                <div className="mt-3 p-2 bg-[#F0B232]/10 border border-[#F0B232]/30 rounded text-xs text-[#F0B232]">
                  ⏳ Your application is being reviewed. We'll notify you once it's processed (3-5 business days).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !submitting && setShowApplicationModal(false)} />
          
          <div className="relative w-full max-w-[500px] bg-[#313338] rounded-lg shadow-xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Apply for {applicationType === 'verification' ? 'Verification' : 'Partnership'}
                </h3>
                <button
                  onClick={() => !submitting && setShowApplicationModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                  </svg>
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#23A559] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Application Submitted!</h4>
                  <p className="text-sm text-slate-400">
                    We'll review your application and get back to you soon.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-400 mb-4">
                      Tell us why <strong className="text-white">{server.name}</strong> should be {applicationType === 'verification' ? 'verified' : 'partnered'}:
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                        Server Information
                      </label>
                      <div className="bg-[#2B2D31] p-3 rounded-[3px] text-sm text-slate-300">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">Server Name:</span>
                          <span className="text-white font-medium">{server.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Server ID:</span>
                          <span className="text-white font-mono text-xs">{server._id}</span>
                        </div>
                      </div>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                      Why should we approve this application?
                    </label>
                    <textarea
                      value={applicationReason}
                      onChange={(e) => setApplicationReason(e.target.value)}
                      placeholder="Describe your server's community, activity level, and why you deserve this badge..."
                      className="w-full bg-[#1E1F22] text-white p-3 rounded-[3px] text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-[#5865F2]"
                      disabled={submitting}
                      maxLength={500}
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {applicationReason.length}/500 characters
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-[#F23F43]/10 border border-[#F23F43] rounded text-sm text-[#F23F43]">
                      {error}
                    </div>
                  )}

                  <div className="bg-[#2B2D31] p-3 rounded-[3px] mb-4">
                    <p className="text-xs text-slate-400">
                      <strong className="text-white">Note:</strong> Applications are reviewed manually by our team. 
                      This may take 3-5 business days. We'll notify you via email once reviewed.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowApplicationModal(false)}
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white hover:underline transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitApplication}
                      disabled={submitting || !applicationReason.trim()}
                      className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
