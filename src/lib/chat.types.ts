export interface ChatUser {
    id: string
    avatarUrl: string | null
    handle: string
    name: string
}

export interface ChatSummary {
    id: string
    firstAt: number
    isGroup: boolean
    lastAt: number
    messageCount: number
    name: string
    participants: ChatUser[]
}

export interface ChatReaction {
    by: string
    emoji: string
}

export interface ChatMessage {
    id: string
    hasAttachment: boolean
    isOwn: boolean
    reactions: ChatReaction[]
    sender: ChatUser
    sentAt: number
    text: string | null
    type: string
}

export interface ChatMediaRef {
    mime: string
    path: string
}

export interface ChatMediaFile {
    file: File
    messageId: string
}

export interface ChatArchive {
    archive: Uint8Array<ArrayBuffer>
    name: string
}

export interface ChatDatabase {
    close: () => void
    getMessages: (chatId: string) => ChatMessage[]
    hasMessages: (messageIds: string[]) => boolean
    listChats: () => ChatSummary[]
    owner: ChatUser
}

export interface ExportProgress {
    current: number
    total: number
}

export type ExportProgressHandler = (progress: ExportProgress) => void

export interface ExportOptions {
    requiredMessageIds?: string[]
    onProgress?: ExportProgressHandler
}

export type ExportStatus = 'idle' | 'exporting' | 'done' | 'error'
