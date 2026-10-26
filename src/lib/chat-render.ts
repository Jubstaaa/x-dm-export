import {
    CHAT_HTML_STYLE,
    MEDIA_OMITTED_LABEL,
    MISSING_MEDIA_LABEL,
} from './chat-render.constants'
import type { ChatMediaRef, ChatMessage, ChatSummary } from './chat.types'

type MediaByMessage = Map<string, ChatMediaRef>

const HTML_ESCAPES: Record<string, string> = {
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
}

const escapeHtml = (value: string) =>
    value.replace(/[&<>"]/g, char => HTML_ESCAPES[char])

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString()

const formatDay = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

function formatTextTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    return `[${day}, ${time}]`
}

function renderMedia(media: ChatMediaRef): string {
    if (media.mime.startsWith('video/'))
        return `<video controls src="${media.path}"></video>`
    return `<img loading="lazy" src="${media.path}" alt="">`
}

function renderMessage(
    message: ChatMessage,
    media: ChatMediaRef | undefined
): string {
    if (message.type !== 'message') {
        return `<div class="info">${escapeHtml(message.text ?? message.type)}</div>`
    }
    const attachment = media
        ? renderMedia(media)
        : message.hasAttachment
          ? `<div class="missing">${MISSING_MEDIA_LABEL}</div>`
          : ''
    const text = message.text ? `<div>${escapeHtml(message.text)}</div>` : ''
    const reactions = message.reactions.length
        ? `<div class="reactions">${message.reactions.map(r => escapeHtml(r.emoji)).join(' ')}</div>`
        : ''
    return (
        `<div class="msg ${message.isOwn ? 'own' : 'other'}">` +
        `<div class="bubble">${attachment}${text}${reactions}</div>` +
        `<div class="meta">${escapeHtml(message.sender.name)} · ${formatDateTime(message.sentAt)}</div></div>`
    )
}

export function renderChatHtml(
    chat: ChatSummary,
    messages: ChatMessage[],
    media: MediaByMessage
): string {
    const rows: string[] = []
    let lastDay = ''
    for (const message of messages) {
        const day = formatDay(message.sentAt)
        if (day !== lastDay) {
            rows.push(`<div class="day">${day}</div>`)
            lastDay = day
        }
        rows.push(renderMessage(message, media.get(message.id)))
    }

    const avatar = chat.isGroup
        ? null
        : chat.participants.find(user => user.avatarUrl)?.avatarUrl
    const range = messages.length
        ? `${formatDateTime(messages[0].sentAt)} – ${formatDateTime(messages[messages.length - 1].sentAt)}`
        : ''

    return (
        '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        `<title>${escapeHtml(chat.name)}</title><style>${CHAT_HTML_STYLE}</style></head><body>` +
        `<header>${avatar ? `<img src="${avatar}" alt="">` : ''}<div>` +
        `<h1>${escapeHtml(chat.name)}</h1><p>${messages.length} messages · ${range}</p></div></header>` +
        `<main>${rows.join('')}</main>` +
        `<footer>Exported ${formatDateTime(Date.now())} with DM Export for X</footer></body></html>`
    )
}

export function renderChatText(
    messages: ChatMessage[],
    media: MediaByMessage
): string {
    const lines: string[] = []
    for (const message of messages) {
        if (message.type !== 'message') continue
        const prefix = `${formatTextTimestamp(message.sentAt)} ${message.sender.name}:`
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
