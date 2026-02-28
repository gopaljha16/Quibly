'use client'

interface DeleteMessageModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

export default function DeleteMessageModal({
    open,
    onClose,
    onConfirm
}: DeleteMessageModalProps) {
    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl">
                    <div className="p-4">
                        <h2 className="text-xl font-bold text-white mb-2">
                            Delete Message
                        </h2>
                        <p className="text-sm text-slate-300">
                            Are you sure you want to delete this message? This action cannot be undone.
                        </p>
                    </div>

                    <div className="p-4 bg-[#111214] flex justify-end gap-2 rounded-b-lg">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-[3px] text-sm font-medium text-white hover:underline transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            className="px-4 py-2 rounded-[3px] text-sm font-medium bg-[#da373c] text-white hover:bg-[#a12d30] transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
