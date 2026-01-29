import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type ModalType = 
  | 'createServer' 
  | 'joinServer' 
  | 'createChannel' 
  | 'serverSettings' 
  | 'inviteServer'
  | 'memberProfile'
  | null

type RouteInfo = {
  isMe: boolean
  serverId: string | null
  channelId: string | null
}

interface UIState {
  // Route state
  route: RouteInfo
  setRoute: (route: RouteInfo) => void
  
  // Modal state
  activeModal: ModalType
  modalData: Record<string, any>
  openModal: (modal: ModalType, data?: Record<string, any>) => void
  closeModal: () => void
  
  // Message drafts (persisted per channel)
  drafts: Record<string, string>
  setDraft: (channelId: string, content: string) => void
  clearDraft: (channelId: string) => void
  
  // Edit message state
  editingMessageId: string | null
  editingMessageContent: string
  startEditingMessage: (messageId: string, content: string) => void
  stopEditingMessage: () => void
  
  // UI preferences
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Selected items
  selectedServerId: string | null
  selectedChannelId: string | null
  setSelectedServer: (serverId: string | null) => void
  setSelectedChannel: (channelId: string | null) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Route state
        route: { isMe: false, serverId: null, channelId: null },
        setRoute: (route) => set({ route }),
        
        // Modal state
        activeModal: null,
        modalData: {},
        openModal: (modal, data = {}) => 
          set({ activeModal: modal, modalData: data }),
        closeModal: () => 
          set({ activeModal: null, modalData: {} }),
        
        // Message drafts
        drafts: {},
        setDraft: (channelId, content) =>
          set((state) => ({
            drafts: { ...state.drafts, [channelId]: content },
          })),
        clearDraft: (channelId) =>
          set((state) => {
            const { [channelId]: _, ...rest } = state.drafts
            return { drafts: rest }
          }),
        
        // Edit message state
        editingMessageId: null,
        editingMessageContent: '',
        startEditingMessage: (messageId, content) =>
          set({ editingMessageId: messageId, editingMessageContent: content }),
        stopEditingMessage: () =>
          set({ editingMessageId: null, editingMessageContent: '' }),
        
        // UI preferences
        sidebarCollapsed: false,
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        
        // Selected items
        selectedServerId: null,
        selectedChannelId: null,
        setSelectedServer: (serverId) => set({ selectedServerId: serverId }),
        setSelectedChannel: (channelId) => set({ selectedChannelId: channelId }),
      }),
      {
        name: 'discord-ui-store',
        // Only persist drafts and UI preferences
        partialize: (state) => ({
          drafts: state.drafts,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
)
