import type { ChatMessage, ChatSummary, ChatUser } from '@/lib/chat.types'

const GRADIENTS = [
    ['#f97316', '#ec4899'],
    ['#06b6d4', '#3b82f6'],
    ['#a855f7', '#6366f1'],
    ['#22c55e', '#14b8a6'],
    ['#eab308', '#f97316'],
    ['#ef4444', '#f43f5e'],
    ['#0ea5e9', '#22d3ee'],
    ['#8b5cf6', '#d946ef'],
]

function avatar(name: string, index: number): string {
    const [from, to] = GRADIENTS[index % GRADIENTS.length]
    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="48" y="60" font-family="-apple-system,Helvetica,Arial" font-size="38" font-weight="700" fill="#fff" text-anchor="middle">${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const user = (index: number, name: string, handle: string): ChatUser => ({
    id: String(1000 + index),
    avatarUrl: avatar(name, index),
    handle,
    name,
})

export const OWNER = user(0, 'Sam Carter', 'samcarter')

const PEOPLE = [
    user(1, 'Maya Chen', 'mayachen'),
    user(2, 'Alex Rivera', 'alexrivera'),
    user(3, 'Priya Patel', 'priyabuilds'),
    user(4, 'Jonas Weber', 'jonasweber'),
    user(5, 'Lena Okafor', 'lenaokafor'),
    user(6, 'Diego Santos', 'diegosantos'),
    user(7, 'Hana Sato', 'hanasato'),
    user(8, 'Noah Brooks', 'noahbrooks'),
    user(9, 'Zoe Martin', 'zoemartin'),
]

const NOW = new Date('2026-10-26T15:30:00').getTime()
const HOUR = 3_600_000

const direct = (
    person: ChatUser,
    hoursAgo: number,
    count: number
): ChatSummary => ({
    id: `${OWNER.id}:${person.id}`,
    firstAt: NOW - hoursAgo * HOUR - 400 * 24 * HOUR,
    isGroup: false,
    lastAt: NOW - hoursAgo * HOUR,
    messageCount: count,
    name: person.name,
    participants: [OWNER, person],
})

export const CHATS: ChatSummary[] = [
    direct(PEOPLE[0], 0.2, 1284),
    {
        id: 'g1',
        firstAt: NOW - 900 * 24 * HOUR,
        isGroup: true,
        lastAt: NOW - 1.5 * HOUR,
        messageCount: 3920,
        name: 'Weekend trip 🏕️',
        participants: [OWNER, PEOPLE[1], PEOPLE[2], PEOPLE[5]],
    },
    direct(PEOPLE[1], 3, 642),
    direct(PEOPLE[2], 9, 211),
    direct(PEOPLE[3], 26, 87),
    direct(PEOPLE[4], 50, 455),
    direct(PEOPLE[5], 74, 39),
    direct(PEOPLE[6], 140, 1201),
    direct(PEOPLE[7], 300, 18),
    direct(PEOPLE[8], 800, 64),
]

const CONVERSATION: [boolean, string, number][] = [
    [false, 'did you see they moved DMs to the new encrypted chat?', 0],
    [
        true,
        'yeah, looks nice but I was worried about losing our old messages',
        1,
    ],
    [false, 'same. there’s no export button anywhere 😅', 2],
    [
        true,
        'found a way, it saves the whole chat locally. html + json + text',
        3,
    ],
    [false, 'wait, including photos?', 4],
    [true, 'yep, media too. nothing gets uploaded anywhere', 5],
    [
        false,
        'ok that’s exactly what I needed. sending you the trip photos now',
        7,
    ],
    [false, '', 8],
    [true, 'these are so good 🔥', 9],
    [
        false,
        'exporting our chat before I forget, it’s basically our travel journal at this point',
        12,
    ],
    [true, 'haha same. keeping it forever', 13],
]

export function conversationMessages(): ChatMessage[] {
    const maya = PEOPLE[0]
    return CONVERSATION.map(([isOwn, text, minutes], index) => ({
        id: `m${index}`,
        hasAttachment: !text,
        isOwn,
        reactions: index === 8 ? [{ by: maya.name, emoji: '❤️' }] : [],
        sender: isOwn ? OWNER : maya,
        sentAt: NOW - (60 - minutes * 4) * 60_000,
        text: text || null,
        type: 'message',
    }))
}
