'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Trash2, Camera, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUpdate: (data: any) => Promise<void>
  onUploadAvatar: (file: File) => Promise<void>
  onUploadBanner: (file: File) => Promise<void>
  onDeleteAvatar: () => Promise<void>
  onDeleteBanner: () => Promise<void>
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onUpdate,
  onUploadAvatar,
  onUploadBanner,
  onDeleteAvatar,
  onDeleteBanner
}: UserProfileModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    pronouns: '',
    themeColor: '#5865F2'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        pronouns: user.pronouns || '',
        themeColor: user.themeColor || '#5865F2'
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onUpdate(formData)
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsLoading(true)
      try {
        await onUploadAvatar(file)
      } catch (error) {
        console.error('Avatar upload failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsLoading(true)
      try {
        await onUploadBanner(file)
      } catch (error) {
        console.error('Banner upload failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDeleteAvatar = async () => {
    setIsLoading(true)
    try {
      await onDeleteAvatar()
    } catch (error) {
      console.error('Delete avatar failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    setIsLoading(true)
    try {
      await onDeleteBanner()
    } catch (error) {
      console.error('Delete banner failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-[#313338] border-none text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3f4147]">
          <h2 className="text-xl font-bold">Edit User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Banner Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[#b5bac1] uppercase">Profile Banner</Label>
              <div className="relative h-40 bg-gradient-to-r from-[#5865f2] to-[#7289da] rounded-lg overflow-hidden group">
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
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#5865f2] hover:bg-[#4752c4] text-white pointer-events-none"
                      disabled={isLoading}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Change Banner
                    </Button>
                  </label>
                  {user.banner && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteBanner}
                      disabled={isLoading}
                      className="bg-[#da373c] hover:bg-[#a12d30]"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#949ba4]">Minimum size: 960x540, recommended: 1920x1080</p>
            </div>

            {/* Avatar Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[#b5bac1] uppercase">Avatar</Label>
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 rounded-full overflow-hidden bg-[#5865f2] group">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
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
                        disabled={isLoading}
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
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#5865f2] hover:bg-[#4752c4] text-white pointer-events-none"
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Avatar
                    </Button>
                  </label>
                  {user.avatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteAvatar}
                      disabled={isLoading}
                      className="border-[#da373c] text-[#da373c] hover:bg-[#da373c] hover:text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Avatar
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#949ba4]">Recommended: 512x512, max 8MB</p>
            </div>

            <div className="border-t border-[#3f4147] pt-6 space-y-5">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-semibold text-[#b5bac1] uppercase">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  placeholder={user.username}
                  maxLength={32}
                  className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#5865f2] focus:ring-[#5865f2]"
                />
                <p className="text-xs text-[#949ba4]">{formData.displayName.length}/32 characters</p>
              </div>

              {/* Pronouns */}
              <div className="space-y-2">
                <Label htmlFor="pronouns" className="text-sm font-semibold text-[#b5bac1] uppercase">
                  Pronouns
                </Label>
                <Input
                  id="pronouns"
                  value={formData.pronouns}
                  onChange={(e) => handleChange('pronouns', e.target.value)}
                  placeholder="e.g., he/him, she/her, they/them"
                  maxLength={40}
                  className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#5865f2] focus:ring-[#5865f2]"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold text-[#b5bac1] uppercase">
                  About Me
                </Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={190}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#1e1f22] rounded-md text-white placeholder:text-[#6d6f78] focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2] resize-none"
                />
                <p className="text-xs text-[#949ba4]">{formData.bio.length}/190 characters</p>
              </div>

              {/* Theme Color */}
              <div className="space-y-2">
                <Label htmlFor="themeColor" className="text-sm font-semibold text-[#b5bac1] uppercase">
                  Profile Theme Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="themeColor"
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="w-20 h-12 rounded cursor-pointer border-2 border-[#1e1f22]"
                  />
                  <Input
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    placeholder="#5865F2"
                    className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#5865f2] focus:ring-[#5865f2]"
                  />
                </div>
                <p className="text-xs text-[#949ba4]">This color will be used for your profile banner</p>
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-[#2b2d31] border-t border-[#3f4147]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-white hover:bg-[#3f4147]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
