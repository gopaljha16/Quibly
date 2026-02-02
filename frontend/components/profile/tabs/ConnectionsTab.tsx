'use client'

import { Github, Twitter, Linkedin, Globe, Link as LinkIcon, Edit } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiPatch } from '@/lib/api'

interface ConnectionsTabProps {
  user: any
  isOwnProfile?: boolean
  onUpdate?: (data: any) => void
}

export default function ConnectionsTab({ user, isOwnProfile, onUpdate }: ConnectionsTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [socialLinks, setSocialLinks] = useState(user.socialLinks || {})

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiPatch('/profile/social-links', socialLinks)
      onUpdate?.({ socialLinks })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update social links:', error)
    } finally {
      setSaving(false)
    }
  }

  const socialPlatforms = [
    { key: 'github', label: 'GitHub', icon: Github, color: '#333', urlPrefix: 'https://github.com/' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, color: '#1DA1F2', urlPrefix: 'https://twitter.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', urlPrefix: 'https://linkedin.com/in/' },
    { key: 'portfolio', label: 'Portfolio', icon: Globe, color: '#5865f2', urlPrefix: 'https://' },
    { key: 'website', label: 'Website', icon: LinkIcon, color: '#23a559', urlPrefix: 'https://' }
  ]

  const hasAnyLinks = socialPlatforms.some(platform => socialLinks[platform.key])

  if (isEditing && isOwnProfile) {
    return (
      <div className="space-y-4">
        <div className="bg-[#1e1f22] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Edit Social Links</h3>
          <div className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.key}>
                <label className="text-xs text-[#949ba4] uppercase mb-2 block">{platform.label}</label>
                <div className="flex items-center gap-2">
                  <platform.icon className="w-5 h-5 text-[#949ba4]" />
                  <Input
                    value={socialLinks[platform.key] || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [platform.key]: e.target.value })}
                    placeholder={`Your ${platform.label} URL`}
                    className="flex-1 bg-[#111214] border-[#3f4147] text-white"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setSocialLinks(user.socialLinks || {})
              }}
              variant="outline"
              className="border-[#3f4147] text-[#dbdee1] hover:bg-[#2b2d31]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {isOwnProfile && (
        <div className="flex justify-end">
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="outline"
            className="border-[#3f4147] text-[#dbdee1] hover:bg-[#2b2d31]"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Links
          </Button>
        </div>
      )}

      {!hasAnyLinks ? (
        <div className="bg-[#1e1f22] rounded-lg p-12 text-center">
          <LinkIcon className="w-12 h-12 text-[#949ba4] mx-auto mb-4" />
          <p className="text-[#949ba4]">
            {isOwnProfile 
              ? 'No social links added yet. Click "Edit Links" to add your connections.'
              : 'This user hasn\'t added any social links yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {socialPlatforms.map((platform) => {
            const link = socialLinks[platform.key]
            if (!link) return null

            const fullUrl = link.startsWith('http') ? link : platform.urlPrefix + link

            return (
              <a
                key={platform.key}
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1e1f22] rounded-lg p-4 hover:bg-[#2b2d31] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{platform.label}</p>
                    <p className="text-xs text-[#949ba4] truncate max-w-[300px]">{link}</p>
                  </div>
                </div>
                <LinkIcon className="w-4 h-4 text-[#949ba4] group-hover:text-white transition-colors" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
