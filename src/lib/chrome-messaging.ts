import type { ChatSummary, ChatUser, ExportProgress } from './chat.types'

export interface ListChatsMessage {
    type: 'LIST_CHATS'
}

export interface ListChatsResponse {
    chats: ChatSummary[]
    owner: ChatUser
}

export interface ExportChatsMessage {
    chatIds: string[]
    includeMedia: boolean
    type: 'EXPORT_CHATS'
}

export interface ExportProgressMessage {
    progress: ExportProgress
    type: 'EXPORT_PROGRESS'
}

export interface ErrorResponse {
    error: string
}

export type ContentMessage = ExportChatsMessage | ListChatsMessage

export function sendToTab<TResponse>(
    tabId: number,
    message: ContentMessage
): Promise<TResponse | ErrorResponse | undefined> {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(
            tabId,
            message,
            (response: TResponse | ErrorResponse) => {
                void chrome.runtime.lastError
                resolve(response)
            }
        )
    })
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
    return (
        typeof response === 'object' && response !== null && 'error' in response
    )
}

export function broadcastProgress(progress: ExportProgress): void {
    const message: ExportProgressMessage = { progress, type: 'EXPORT_PROGRESS' }
    chrome.runtime.sendMessage(message).catch(() => {})
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
