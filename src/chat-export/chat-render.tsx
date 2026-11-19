import { renderToStaticMarkup } from 'react-dom/server'

import { ChatPage } from './chat-page'
import type { ChatMediaRef, ChatMessage, ChatSummary } from './chat.types'

type MediaByMessage = Map<string, ChatMediaRef>

const MEDIA_OMITTED_LABEL = '<Media omitted>'

// en-GB gives the "dd/mm/yyyy, hh:mm:ss" shape WhatsApp-style readers expect.
const textTimestamp = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    year: 'numeric',
})

export function renderChatHtml(
    chat: ChatSummary,
    messages: ChatMessage[],
    media: MediaByMessage
): string {
    return `<!doctype html>${renderToStaticMarkup(
        <ChatPage
            chat={chat}
            exportedAt={Date.now()}
            media={media}
            messages={messages}
        />
    )}`
}

export function renderChatText(
    messages: ChatMessage[],
    media: MediaByMessage
): string {
    const lines: string[] = []
    for (const message of messages) {
        if (message.type !== 'message') continue
        const prefix = `[${textTimestamp.format(message.sentAt)}] ${message.sender.name}:`
        const attachment = media.get(message.id)
        if (attachment) lines.push(`${prefix} <attached: ${attachment.path}>`)
        else if (message.hasAttachment)
            lines.push(`${prefix} ${MEDIA_OMITTED_LABEL}`)
        if (message.text) lines.push(`${prefix} ${message.text}`)
    }
    return `${lines.join('\n')}\n`
}

export function renderChatJson(
    chat: ChatSummary,
    messages: ChatMessage[],
    media: MediaByMessage
): string {
    return JSON.stringify(
        {
            exportedAt: new Date().toISOString(),
            id: chat.id,
            messages: messages.map(message => ({
                ...message,
                media: media.get(message.id) ?? null,
                sentAt: new Date(message.sentAt).toISOString(),
            })),
            name: chat.name,
            participants: chat.participants,
        },
        null,
        2
    )
}
