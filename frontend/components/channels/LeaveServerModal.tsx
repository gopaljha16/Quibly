'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface LeaveServerModalProps {
  open: boolean
  onClose: () => void
  serverName: string
  onConfirm: () => Promise<void>
  type?: 'leave' | 'delete'
}

export default function LeaveServerModal({
  open,
  onClose,
  serverName,
  onConfirm,
  type = 'leave'
}: LeaveServerModalProps) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      toast.success(type === 'leave' ? `Left ${serverName}` : `Deleted ${serverName}`)
      onClose()
    } catch (error: any) {
      console.error(`Failed to ${type} server:`, error)
      toast.error(error.message || `Failed to ${type} server`)
    } finally {
      setLoading(false)
    }
  }

  const isDelete = type === 'delete'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={() => !loading && onClose()} 
      />
      <div className="w-full max-w-[440px] rounded-lg bg-[#1a1a1c] border border-white/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="p-4 pt-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {isDelete ? 'Delete Server' : 'Leave Server'}
          </h2>
          <p className="text-[#b5bac1] text-sm">
            Are you sure you want to {isDelete ? 'delete' : 'leave'} <span className="font-bold text-white">{serverName}</span>? 
            {isDelete ? ' This action cannot be undone.' : ' You will need another invite to rejoin.'}
          </p>
        </div>

        <div className="bg-[#111214] p-4 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-white hover:underline transition-colors px-4 py-2"
            disabled={loading}
          >
            Cancel
          </button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-[3px] text-sm font-medium text-white ${
              isDelete ? 'bg-[#da373c] hover:bg-[#a12d30]' : 'bg-[#da373c] hover:bg-[#a12d30]'
            } transition-colors min-w-[100px]`}
          >
            {loading ? (isDelete ? 'Deleting...' : 'Leaving...') : (isDelete ? 'Delete Server' : 'Leave Server')}
          </Button>
        </div>
      </div>
    </div>
  )
}
