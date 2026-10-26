import type { ChatSummary } from '@/lib/chat.types'

export interface ChatRowProps {
    chat: ChatSummary
    isSelected: boolean
    ownerId: string
    onToggle: (chatId: string) => void
}
