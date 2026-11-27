import type { ChatSummary, ChatUser, ExportProgress } from './chat.types'

export type ContentMessage = ExportChatsMessage | ListChatsMessage

export interface ErrorResponse {
    error: string
}

export interface ExportChatsMessage {
    chatIds: string[]
    includeMedia: boolean
    type: 'EXPORT_CHATS'
}

export interface ExportChatsResponse {
    fileName: string
}

export interface ExportProgressMessage {
    progress: ExportProgress
    type: 'EXPORT_PROGRESS'
}

export interface ListChatsMessage {
    type: 'LIST_CHATS'
}

export interface ListChatsResponse {
    chats: ChatSummary[]
    owner: ChatUser
}

export function broadcastProgress(progress: ExportProgress): void {
    const message: ExportProgressMessage = { progress, type: 'EXPORT_PROGRESS' }

    chrome.runtime.sendMessage(message).catch(() => undefined)
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
    return (
        typeof response === 'object' && response !== null && 'error' in response
    )
}

export async function sendToTab<TResponse>(
    tabId: number,
    message: ContentMessage
): Promise<ErrorResponse | TResponse | undefined> {
    try {
        return await chrome.tabs.sendMessage(tabId, message)
    } catch {
        return undefined
    }
}
