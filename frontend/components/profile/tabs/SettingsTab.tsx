'use client'

import { useState } from 'react'
import { Palette, Type, Image as ImageIcon, MapPin, Lock, Save, Upload, Trash2, Camera, Mail, User, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '../../ui/switch'
import { apiPatch, apiPost, apiDelete } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface SettingsTabProps {
  user: any
  onUpdate?: (data: any) => void
}

export default function SettingsTab({ user, onUpdate }: SettingsTabProps) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [usernameField, setUsernameField] = useState(user.username || '')

  const [basicInfo, setBasicInfo] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    pronouns: user.pronouns || '',
    bio: user.bio || ''
  })

  const [personalization, setPersonalization] = useState({
    location: user.location || '',
    cardStyle: user.cardStyle || 'rounded',
    fontStyle: user.fontStyle || 'default',
    showBanner: user.showBanner !== false,
    themeColor: user.themeColor || '#5865F2'
  })

  const [privacySettings, setPrivacySettings] = useState(user.privacySettings || {
    emailVisible: 'friends',
    mutualServersVisible: 'everyone',
    friendRequestsFrom: 'everyone',
    dmsFrom: 'friends',
    showActivityStatus: true,
    showCurrentServer: true
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await apiPost<any>('/users/avatar', formData)
      
      // Invalidate profile query to update everywhere
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      
      toast.success('Avatar updated successfully!')
      if (response.avatar) {
        onUpdate?.({ avatar: response.avatar })
      }
    } catch (error: any) {
      console.error('Failed to upload avatar:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('banner', file)
      const response = await apiPost<any>('/users/banner', formData)
      
      // Invalidate profile query
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      
      toast.success('Banner updated successfully!')
      if (response.banner) {
        onUpdate?.({ banner: response.banner })
      }
    } catch (error: any) {
      console.error('Failed to upload banner:', error)
      toast.error(error.message || 'Failed to upload banner')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      setUploading(true)
      await apiDelete('/users/avatar')
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Avatar removed')
      onUpdate?.({ avatar: null })
    } catch (error: any) {
      console.error('Failed to delete avatar:', error)
      toast.error('Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteBanner = async () => {
    try {
      setUploading(true)
      await apiDelete('/users/banner')
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Banner removed')
      onUpdate?.({ banner: null })
    } catch (error: any) {
      console.error('Failed to delete banner:', error)
      toast.error('Failed to remove banner')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveBasicInfo = async () => {
    try {
      setSaving(true)
      await apiPatch('/users/profile', basicInfo)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Basic information updated!')
      onUpdate?.(basicInfo)
    } catch (error: any) {
      console.error('Failed to update basic info:', error)
      toast.error(error.message || 'Failed to update basic info')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUsername = async () => {
    try {
      setSaving(true)
      await apiPatch('/auth/account/username', { username: usernameField })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Username updated successfully!')
    } catch (error: any) {
      console.error('Failed to update username:', error)
      toast.error(error.message || 'Failed to update username')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePersonalization = async () => {
    try {
      setSaving(true)
      await apiPatch('/profile/personalization', personalization)
      onUpdate?.(personalization)
    } catch (error) {
      console.error('Failed to update personalization:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      setSaving(true)
      await apiPatch('/profile/privacy', privacySettings)
      onUpdate?.({ privacySettings })
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar & Banner Section */}
      <div className="bg-[#1e1f22] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Camera className="w-5 h-5 text-[#5865f2]" />
          <h3 className="text-lg font-semibold text-white">Profile Images</h3>
        </div>

        <div className="space-y-6">
          {/* Banner Upload */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">Profile Banner</label>
            <div className="relative h-32 bg-gradient-to-r from-[#5865f2] to-[#7289da] rounded-lg overflow-hidden group">
              {user.banner && (
                <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white pointer-events-none"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Banner
                  </Button>
                </label>
                {user.banner && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDeleteBanner}
                    disabled={uploading}
                    className="bg-[#da373c] hover:bg-[#a12d30] text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#949ba4] mt-2">Recommended: 960x540 or larger</p>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">Avatar</label>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#5865f2] group">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <Camera className="w-8 h-8 text-white" />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white pointer-events-none"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Avatar
                  </Button>
                </label>
                {user.avatar && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={uploading}
                    className="border-[#da373c] text-[#da373c] hover:bg-[#da373c] hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Avatar
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#949ba4] mt-2">Recommended: 512x512, max 8MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="bg-[#1e1f22] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-[#5865f2]" />
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        </div>

        <div className="space-y-6">
          {/* Username */}
          <div className="space-y-2 pb-6 border-b border-[#3f4147]">
            <label className="text-xs text-[#949ba4] uppercase mb-2 flex items-center gap-2 font-bold">
              <AtSign className="w-4 h-4 text-[#5865f2]" />
              Username
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={usernameField}
                  onChange={(e) => setUsernameField(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="username"
                  className="bg-[#111214] border-[#3f4147] text-white pr-12 focus:border-[#5865f2] transition-colors"
                />
              </div>
              <Button
                onClick={handleSaveUsername}
                disabled={saving || !usernameField || usernameField === user.username}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white shrink-0"
              >
                {saving ? 'Updating...' : 'Update'}
              </Button>
            </div>
            <p className="text-[11px] text-[#949ba4] mt-1 italic">Your unique handle. Cannot contain spaces or uppercase letters.</p>
          </div>
          {/* Display Name */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">Display Name</label>
            <Input
              value={basicInfo.displayName}
              onChange={(e) => setBasicInfo({ ...basicInfo, displayName: e.target.value })}
              placeholder={user.username}
              maxLength={32}
              className="bg-[#111214] border-[#3f4147] text-white"
            />
            <p className="text-xs text-[#949ba4] mt-1">{basicInfo.displayName.length}/32 characters</p>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              value={basicInfo.email}
              onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
              placeholder="your@email.com"
              className="bg-[#111214] border-[#3f4147] text-white"
            />
          </div>

          {/* Pronouns */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">Pronouns</label>
            <Input
              value={basicInfo.pronouns}
              onChange={(e) => setBasicInfo({ ...basicInfo, pronouns: e.target.value })}
              placeholder="e.g., he/him, she/her, they/them"
              maxLength={40}
              className="bg-[#111214] border-[#3f4147] text-white"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">About Me</label>
            <textarea
              value={basicInfo.bio}
              onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              maxLength={190}
              rows={4}
              className="w-full px-3 py-2 bg-[#111214] border border-[#3f4147] rounded-md text-white placeholder:text-[#6d6f78] focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2] resize-none"
            />
            <p className="text-xs text-[#949ba4] mt-1">{basicInfo.bio.length}/190 characters</p>
          </div>
        </div>

        <Button
          onClick={handleSaveBasicInfo}
          disabled={saving || uploading}
          className="mt-6 bg-[#5865f2] hover:bg-[#4752c4] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Basic Info'}
        </Button>
      </div>

      {/* Personalization Section */}
      <div className="bg-[#1e1f22] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-[#5865f2]" />
          <h3 className="text-lg font-semibold text-white">Personalization</h3>
        </div>

        <div className="space-y-6">
          {/* Location */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <Input
              value={personalization.location}
              onChange={(e) => setPersonalization({ ...personalization, location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
              className="bg-[#111214] border-[#3f4147] text-white mt-1"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-2 block">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={personalization.themeColor}
                onChange={(e) => setPersonalization({ ...personalization, themeColor: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <Input
                value={personalization.themeColor}
                onChange={(e) => setPersonalization({ ...personalization, themeColor: e.target.value })}
                placeholder="#5865F2"
                className="bg-[#111214] border-[#3f4147] text-white flex-1"
              />
            </div>
          </div>

          {/* Card Style */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-3 block">Card Style</label>
            <div className="grid grid-cols-3 gap-3">
              {['rounded', 'sharp', 'glass'].map((style) => (
                <button
                  key={style}
                  onClick={() => setPersonalization({ ...personalization, cardStyle: style })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    personalization.cardStyle === style
                      ? 'border-[#5865f2] bg-[#5865f2]/10'
                      : 'border-[#3f4147] hover:border-[#949ba4]'
                  }`}
                >
                  <div className={`h-12 bg-gradient-to-br from-[#5865f2] to-[#3ba55d] mb-2 ${
                    style === 'rounded' ? 'rounded-lg' : style === 'sharp' ? 'rounded-none' : 'rounded-lg backdrop-blur'
                  }`} />
                  <p className="text-xs text-white capitalize">{style}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div>
            <label className="text-xs text-[#949ba4] uppercase mb-3 block flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['default', 'modern', 'classic'].map((style) => (
                <button
                  key={style}
                  onClick={() => setPersonalization({ ...personalization, fontStyle: style })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    personalization.fontStyle === style
                      ? 'border-[#5865f2] bg-[#5865f2]/10'
                      : 'border-[#3f4147] hover:border-[#949ba4]'
                  }`}
                >
                  <p className={`text-sm text-white capitalize ${
                    style === 'modern' ? 'font-sans' : style === 'classic' ? 'font-serif' : ''
                  }`}>
                    {style} Aa
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Show Banner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#949ba4]" />
              <label className="text-sm text-white">Show Banner</label>
            </div>
            <Switch
              checked={personalization.showBanner}
              onCheckedChange={(checked: boolean) => setPersonalization({ ...personalization, showBanner: checked })}
            />
          </div>
        </div>

        <Button
          onClick={handleSavePersonalization}
          disabled={saving}
          className="mt-6 bg-[#5865f2] hover:bg-[#4752c4] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Personalization'}
        </Button>
      </div>

      {/* Privacy Settings Section */}
      <div className="bg-[#1e1f22] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-[#f23f43]" />
          <h3 className="text-lg font-semibold text-white">Privacy & Safety</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#3f4147]">
            <div>
              <p className="text-sm font-medium text-white">Show Activity Status</p>
              <p className="text-xs text-[#949ba4]">Let others see when you're online</p>
            </div>
            <Switch
              checked={privacySettings.showActivityStatus}
              onCheckedChange={(checked: boolean) => setPrivacySettings({ ...privacySettings, showActivityStatus: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[#3f4147]">
            <div>
              <p className="text-sm font-medium text-white">Show Current Server</p>
              <p className="text-xs text-[#949ba4]">Display which server you're currently in</p>
            </div>
            <Switch
              checked={privacySettings.showCurrentServer}
              onCheckedChange={(checked: boolean) => setPrivacySettings({ ...privacySettings, showCurrentServer: checked })}
            />
          </div>
        </div>

        <Button
          onClick={handleSavePrivacy}
          disabled={saving}
          className="mt-6 bg-[#f23f43] hover:bg-[#da373c] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>

      {/* Account Security Section */}
      <AccountSecuritySection user={user} />
    </div>
  )
}

// Account Security Component
function AccountSecuritySection({ user }: { user: any }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password change state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: '',
    verificationCode: ''
  })
  const [emailChangeStep, setEmailChangeStep] = useState<'input' | 'verify'>('input')

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')

  const handleChangePassword = async () => {
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await apiPost('/account/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      })
      toast.success('Password changed successfully!')
      setShowPasswordForm(false)
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestEmailChange = async () => {
    try {
      setLoading(true)
      const response = await apiPost<any>('/account/request-email-change', {
        newEmail: emailData.newEmail
      })
      toast.info(`Verification code sent to ${emailData.newEmail}!`)
      // Still show alert for development since verification code is returned in response
      if (process.env.NODE_ENV === 'development') {
         alert(`Code: ${response.verificationCode}`)
      }
      setEmailChangeStep('verify')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    try {
      setLoading(true)
      await apiPost('/account/verify-email-change', {
        verificationCode: emailData.verificationCode
      })
      toast.success('Email changed successfully!')
      setShowEmailForm(false)
      setEmailData({ newEmail: '', verificationCode: '' })
      setEmailChangeStep('input')
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableAccount = async () => {
    if (!confirm('Are you sure you want to disable your account? You have 7 days to reactivate it.')) {
      return
    }

    try {
      setLoading(true)
      await apiPost('/account/disable', {})
      toast.success('Account disabled')
      window.location.href = '/'
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable account')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true)
      await apiDelete<any>('/account/delete?' + new URLSearchParams({ password: deletePassword }))
      toast.success('Account deleted permanently')
      window.location.href = '/'
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1e1f22] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-5 h-5 text-[#f0b232]" />
        <h3 className="text-lg font-semibold text-white">Account Security</h3>
      </div>

      <div className="space-y-4">
        {/* Change Password */}
        <div className="pb-4 border-b border-[#3f4147]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-white">Password</p>
              <p className="text-xs text-[#949ba4]">Change your account password</p>
            </div>
            <Button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              size="sm"
              variant="outline"
              className="border-[#3f4147] text-[#dbdee1] hover:bg-[#2b2d31]"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {showPasswordForm && (
            <div className="mt-4 space-y-3 bg-[#111214] p-4 rounded-lg">
              <Input
                type="password"
                placeholder="Current Password"
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                className="bg-[#1e1f22] border-[#3f4147] text-white"
              />
              <Input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                className="bg-[#1e1f22] border-[#3f4147] text-white"
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                className="bg-[#1e1f22] border-[#3f4147] text-white"
              />
              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
              >
                {loading ? 'Changing...' : 'Update Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Change Email */}
        <div className="pb-4 border-b border-[#3f4147]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-white">Email</p>
              <p className="text-xs text-[#949ba4]">Current: {user.email}</p>
            </div>
            <Button
              onClick={() => setShowEmailForm(!showEmailForm)}
              size="sm"
              variant="outline"
              className="border-[#3f4147] text-[#dbdee1] hover:bg-[#2b2d31]"
            >
              {showEmailForm ? 'Cancel' : 'Change Email'}
            </Button>
          </div>

          {showEmailForm && (
            <div className="mt-4 space-y-3 bg-[#111214] p-4 rounded-lg">
              {emailChangeStep === 'input' ? (
                <>
                  <Input
                    type="email"
                    placeholder="New Email Address"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    className="bg-[#1e1f22] border-[#3f4147] text-white"
                  />
                  <Button
                    onClick={handleRequestEmailChange}
                    disabled={loading}
                    className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#949ba4]">Enter the 6-digit code sent to {emailData.newEmail}</p>
                  <Input
                    type="text"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={emailData.verificationCode}
                    onChange={(e) => setEmailData({ ...emailData, verificationCode: e.target.value })}
                    className="bg-[#1e1f22] border-[#3f4147] text-white text-center text-2xl tracking-widest"
                  />
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={loading}
                    className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
                  >
                    {loading ? 'Verifying...' : 'Verify & Update Email'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Disable Account */}
        <div className="pb-4 border-b border-[#3f4147]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#faa61a]">Disable Account</p>
              <p className="text-xs text-[#949ba4]">Temporarily disable your account (7-day grace period)</p>
            </div>
            <Button
              onClick={handleDisableAccount}
              disabled={loading}
              size="sm"
              className="bg-[#faa61a] hover:bg-[#e89505] text-white"
            >
              Disable
            </Button>
          </div>
        </div>

        {/* Delete Account */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-[#da373c]">Delete Account</p>
              <p className="text-xs text-[#949ba4]">Permanently delete your account and all data</p>
            </div>
            <Button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              size="sm"
              className="bg-[#da373c] hover:bg-[#a12d30] text-white"
            >
              {showDeleteConfirm ? 'Cancel' : 'Delete'}
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 space-y-3 bg-[#da373c]/10 border border-[#da373c] p-4 rounded-lg">
              <p className="text-sm text-white font-semibold">⚠️ This action is permanent and cannot be undone!</p>
              <Input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-[#1e1f22] border-[#da373c] text-white"
              />
              <Button
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword}
                className="w-full bg-[#da373c] hover:bg-[#a12d30] text-white"
              >
                {loading ? 'Deleting...' : 'Permanently Delete Account'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
