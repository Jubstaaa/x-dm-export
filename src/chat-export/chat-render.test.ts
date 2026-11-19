// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import { renderChatHtml, renderChatJson, renderChatText } from './chat-render'
import type {
    ChatMediaRef,
    ChatMessage,
    ChatSummary,
    ChatUser,
} from './chat.types'

const owner: ChatUser = {
    avatarUrl: null,
    handle: 'owner',
    id: '1',
    name: 'Owner',
}
const alice: ChatUser = {
    avatarUrl: 'https://pbs.twimg.com/a_bigger.jpg',
    handle: 'alice',
    id: '2',
    name: 'Alice',
}

const chat: ChatSummary = {
    firstAt: Date.UTC(2026, 0, 2, 9, 5, 7),
    id: '1:2',
    isGroup: false,
    lastAt: Date.UTC(2026, 0, 3, 18, 0, 0),
    messageCount: 3,
    name: 'Alice',
    participants: [owner, alice],
}

function message(overrides: Partial<ChatMessage>): ChatMessage {
    return {
        hasAttachment: false,
        id: 'm',
        isOwn: false,
        reactions: [],
        sender: alice,
        sentAt: Date.UTC(2026, 0, 2, 9, 5, 7),
        text: 'hello',
        type: 'message',
        ...overrides,
    }
}

const messages: ChatMessage[] = [
    message({ id: 'm1', reactions: [{ by: 'Owner', emoji: '❤️' }] }),
    message({
        hasAttachment: true,
        id: 'm2',
        isOwn: true,
        sender: owner,
        sentAt: Date.UTC(2026, 0, 3, 18, 0, 0),
        text: 'look',
    }),
    message({
        hasAttachment: true,
        id: 'm3',
        sentAt: Date.UTC(2026, 0, 3, 18, 0, 0),
        text: null,
    }),
    message({
        id: 'i1',
        sentAt: Date.UTC(2026, 0, 3, 18, 1, 0),
        text: 'Alice joined',
        type: 'join_conversation',
    }),
]

const media = new Map<string, ChatMediaRef>([
    ['m2', { mime: 'image/jpeg', path: 'media/m2.jpg' }],
])

describe('renderChatText', () => {
    it('writes one WhatsApp-style line per message part', () => {
        expect(renderChatText(messages, media)).toBe(
            [
                '[02/01/2026, 09:05:07] Alice: hello',
                '[03/01/2026, 18:00:00] Owner: <attached: media/m2.jpg>',
                '[03/01/2026, 18:00:00] Owner: look',
                '[03/01/2026, 18:00:00] Alice: <Media omitted>',
                '',
            ].join('\n')
        )
    })
})

describe('renderChatJson', () => {
    it('serialises messages with ISO dates and media references', () => {
        const json = JSON.parse(renderChatJson(chat, messages, media))
        expect(json).toMatchObject({
            id: '1:2',
            name: 'Alice',
            participants: [owner, alice],
        })
        expect(json.messages).toHaveLength(4)
        expect(json.messages[0]).toMatchObject({
            id: 'm1',
            media: null,
            reactions: [{ by: 'Owner', emoji: '❤️' }],
            sentAt: '2026-01-02T09:05:07.000Z',
        })
        expect(json.messages[1].media).toEqual({
            mime: 'image/jpeg',
            path: 'media/m2.jpg',
        })
    })
})

describe('renderChatHtml', () => {
    const html = renderChatHtml(chat, messages, media)
    const page = new DOMParser().parseFromString(html, 'text/html')

    it('titles the page and header after the chat', () => {
        expect(page.title).toBe('Alice')
        expect(page.querySelector('h1')?.textContent).toBe('Alice')
        expect(page.querySelector('header img')?.getAttribute('src')).toBe(
            alice.avatarUrl
        )
    })

    it('renders own and other bubbles, day separators and info rows', () => {
        expect(page.querySelectorAll('.msg.own')).toHaveLength(1)
        expect(page.querySelectorAll('.msg.other')).toHaveLength(2)
        expect(page.querySelectorAll('.day')).toHaveLength(2)
        expect(page.querySelector('.info')?.textContent).toBe('Alice joined')
    })

    it('embeds available media and marks missing media', () => {
        expect(page.querySelector('.own img')?.getAttribute('src')).toBe(
            'media/m2.jpg'
        )
        expect(page.querySelector('.missing')?.textContent).toBe(
            'Media not available on this device'
        )
        expect(page.querySelector('.reactions')?.textContent).toBe('❤️')
    })

    it('escapes message text', () => {
        const hostile = renderChatHtml(
            chat,
            [message({ text: '<script>alert(1)</script>' })],
            new Map()
        )
        const doc = new DOMParser().parseFromString(hostile, 'text/html')
        expect(doc.querySelector('script')).toBeNull()
        expect(doc.querySelector('.bubble')?.textContent).toContain(
            '<script>alert(1)</script>'
        )
    })

    it('escapes the avatar URL and media paths inside attributes', () => {
        const hostileUser = {
            ...alice,
            avatarUrl: 'https://pbs.twimg.com/a.jpg" onerror="alert(1)',
        }
        const hostile = renderChatHtml(
            chat,
            [message({ hasAttachment: true, id: 'x', sender: hostileUser })],
            new Map([
                [
                    'x',
                    {
                        mime: 'video/mp4',
                        path: 'media/x" autoplay onplay="alert(2)',
                    },
                ],
            ])
        )
        const doc = new DOMParser().parseFromString(hostile, 'text/html')
        expect(doc.querySelector('[onerror], [onplay]')).toBeNull()
        expect(doc.querySelector('header img')?.getAttribute('src')).toBe(
            hostileUser.avatarUrl
        )
        expect(doc.querySelector('video')?.getAttribute('src')).toBe(
            'media/x" autoplay onplay="alert(2)'
        )
    })
})
