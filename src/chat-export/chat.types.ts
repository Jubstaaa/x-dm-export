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

export interface ChatMediaFile {
    file: File
    messageId: string
}

export interface ChatMediaRef {
    mime: string
    path: string
}

export interface ChatMessage {
    hasAttachment: boolean
    id: string
    isOwn: boolean
    reactions: ChatReaction[]
    sender: ChatUser
    sentAt: number
    text: null | string
    type: string
}

export interface ChatReaction {
    by: string
    emoji: string
}

export interface ChatSummary {
    firstAt: number
    id: string
    isGroup: boolean
    lastAt: number
    messageCount: number
    name: string
    participants: ChatUser[]
}

export interface ChatUser {
    avatarUrl: null | string
    handle: string
    id: string
    name: string
}

export interface ExportOptions {
    onProgress?: ExportProgressHandler
    requiredMessageIds?: string[]
}

export interface ExportProgress {
    current: number
    total: number
}

export type ExportProgressHandler = (progress: ExportProgress) => void

export type ExportStatus = 'done' | 'error' | 'exporting' | 'idle'
