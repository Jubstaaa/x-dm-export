import { describe, expect, it } from 'vitest'

import { openChatDatabase } from './chat-database'
import {
    buildChatDatabaseBytes,
    type FixtureData,
} from './chat-fixture.test-utils'

const OWNER = '100'
const ALICE = '200'
const BOB = '300'
const DIRECT = `${OWNER}:${ALICE}`
const GROUP = 'g42'
const SELF = `${OWNER}:${OWNER}`

const fixture: FixtureData = {
    entries: [
        { chatId: DIRECT, id: 'm1', sender: ALICE, seq: 1, timestamp: 1_000 },
        { chatId: DIRECT, id: 'm2', sender: OWNER, seq: 2, timestamp: 2_000 },
        {
            attachment: true,
            chatId: DIRECT,
            id: 'm3',
            sender: ALICE,
            seq: 3,
            text: null,
            timestamp: 2_000,
        },
        { chatId: GROUP, id: 'g1', sender: BOB, seq: 1, timestamp: 5_000 },
        { chatId: SELF, id: 's1', sender: OWNER, seq: 1, timestamp: 500 },
    ],
    members: [
        { chatId: GROUP, userId: OWNER },
        { chatId: GROUP, userId: ALICE },
        { chatId: GROUP, userId: BOB },
        { chatId: GROUP, current: false, userId: '999' },
    ],
    reactions: [
        { by: OWNER, chatId: DIRECT, emoji: '❤️', seq: 1 },
        { by: ALICE, chatId: DIRECT, emoji: '😂', seq: 1 },
        { by: ALICE, chatId: DIRECT, deleted: true, emoji: '👎', seq: 1 },
    ],
    titles: [{ chatId: GROUP, title: 'Weekend plans' }],
    users: [
        {
            contents: {
                name: 'Owner Name',
                profileImageUrl: 'https://pbs.twimg.com/o_normal.jpg',
            },
            id: OWNER,
            screenName: 'owner',
        },
        {
            contents: {
                user: {
                    name: 'Alice',
                    profileImageUrl: 'https://pbs.twimg.com/a_normal.jpg',
                },
            },
            id: ALICE,
            screenName: 'alice',
        },
        {
            contents: new Uint8Array([0xff, 0xff, 0xff]),
            id: BOB,
            nickname: 'Bobby',
            screenName: 'bob',
        },
    ],
}

async function openFixture(data: FixtureData = fixture) {
    return openChatDatabase(await buildChatDatabaseBytes(data), OWNER)
}

describe('openChatDatabase', () => {
    it('resolves the owner from dm_user', async () => {
        const db = await openFixture()
        expect(db.owner).toEqual({
            avatarUrl: 'https://pbs.twimg.com/o_bigger.jpg',
            handle: 'owner',
            id: OWNER,
            name: 'Owner Name',
        })
        db.close()
    })

    it('lists chats newest first with counts and time range', async () => {
        const db = await openFixture()
        const chats = db.listChats()
        expect(chats.map(chat => chat.id)).toEqual([GROUP, DIRECT, SELF])
        expect(chats[1]).toMatchObject({
            firstAt: 1_000,
            isGroup: false,
            lastAt: 2_000,
            messageCount: 3,
        })
        db.close()
    })

    it('names a direct chat after the other participant', async () => {
        const db = await openFixture()
        const direct = db.listChats().find(chat => chat.id === DIRECT)
        expect(direct?.name).toBe('Alice')
        expect(direct?.participants.map(user => user.id)).toEqual([
            OWNER,
            ALICE,
        ])
        db.close()
    })

    it('uses the custom title and current members for a group', async () => {
        const db = await openFixture()
        const group = db.listChats().find(chat => chat.id === GROUP)
        expect(group?.name).toBe('Weekend plans')
        expect(group?.isGroup).toBe(true)
        expect(group?.participants.map(user => user.id)).toEqual([
            OWNER,
            ALICE,
            BOB,
        ])
        db.close()
    })

    it('names a self chat after the owner handle', async () => {
        const db = await openFixture()
        const self = db.listChats().find(chat => chat.id === SELF)
        expect(self?.name).toBe('@owner')
        db.close()
    })

    it('prefers the nickname and survives an undecodable profile blob', async () => {
        const db = await openFixture()
        const group = db.listChats().find(chat => chat.id === GROUP)
        expect(group?.participants.find(user => user.id === BOB)).toEqual({
            avatarUrl: null,
            handle: 'bob',
            id: BOB,
            name: 'Bobby',
        })
        db.close()
    })

    it('falls back to the id for users missing from dm_user', async () => {
        const db = await openFixture({
            entries: [
                {
                    chatId: '100:777',
                    id: 'x',
                    sender: '777',
                    seq: 1,
                    timestamp: 1,
                },
            ],
            users: [],
        })
        const [chat] = db.listChats()
        expect(chat?.name).toBe('777')
        expect(db.owner.handle).toBe(OWNER)
        db.close()
    })

    it('returns messages in time then sequence order with reactions', async () => {
        const db = await openFixture()
        const messages = db.getMessages(DIRECT)
        expect(messages.map(message => message.id)).toEqual(['m1', 'm2', 'm3'])
        expect(messages[0]?.reactions).toEqual([
            { by: 'Owner Name', emoji: '❤️' },
            { by: 'Alice', emoji: '😂' },
        ])
        expect(messages[1]).toMatchObject({ isOwn: true, text: 'text m2' })
        expect(messages[2]).toMatchObject({
            hasAttachment: true,
            isOwn: false,
            text: null,
            type: 'message',
        })
        db.close()
    })

    it('reports whether every requested message is present', async () => {
        const db = await openFixture()
        expect(db.hasMessages([])).toBe(true)
        expect(db.hasMessages(['m1', 'm2', 'm1'])).toBe(true)
        expect(db.hasMessages(['m1', 'missing'])).toBe(false)
        db.close()
    })
})
