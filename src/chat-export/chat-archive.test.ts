import { strFromU8, unzipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildArchive } from './chat-archive'
import { openChatDatabase } from './chat-database'
import { buildChatDatabaseBytes } from './chat-fixture.test-utils'
import { listChatMediaFiles } from './chat-storage'

vi.mock('./chat-storage', () => ({
    listChatMediaFiles: vi.fn(),
    readChatDatabaseFile: vi.fn(),
}))

const OWNER = '100'

async function openFixture() {
    const bytes = await buildChatDatabaseBytes({
        entries: [
            {
                chatId: '100:200',
                id: 'm1',
                sender: '200',
                seq: 1,
                timestamp: 1,
            },
            {
                chatId: '100:200',
                id: 'm2',
                sender: '200',
                seq: 2,
                timestamp: 2,
            },
            {
                chatId: 'g123456789',
                id: 'g1',
                sender: '300',
                seq: 1,
                timestamp: 3,
            },
            {
                chatId: '100:400',
                id: 'c1',
                sender: '400',
                seq: 1,
                timestamp: 4,
            },
        ],
        titles: [
            { chatId: 'g123456789', title: 'Café Crew!' },
            { chatId: '100:400', title: 'Иван Петров' },
        ],
        users: [
            { id: OWNER, screenName: 'owner' },
            {
                contents: { name: 'Alice Smith' },
                id: '200',
                screenName: 'alice',
            },
            { id: '300', screenName: 'bob' },
        ],
    })
    return openChatDatabase(bytes, OWNER)
}

const file = (bytes: number[]) => new File([new Uint8Array(bytes)], 'blob')

beforeEach(() => {
    vi.useFakeTimers({
        now: new Date('2026-11-19T12:00:00Z'),
        toFake: ['Date'],
    })
})

afterEach(() => {
    vi.useRealTimers()
    vi.mocked(listChatMediaFiles).mockReset()
})

describe('buildArchive', () => {
    it('puts a single chat at the zip root and names the zip after it', async () => {
        const db = await openFixture()
        const { archive, name } = await buildArchive(db, ['100:200'], false)
        expect(name).toBe('x-chat-alice-smith-2026-11-19.zip')
        expect(Object.keys(unzipSync(archive)).sort()).toEqual([
            '_chat.txt',
            'chat.html',
            'chat.json',
        ])
        expect(listChatMediaFiles).not.toHaveBeenCalled()
        db.close()
    })

    it('gives each chat its own folder when exporting several', async () => {
        const db = await openFixture()
        const onProgress = vi.fn()
        const { archive, name } = await buildArchive(
            db,
            ['100:200', 'g123456789'],
            false,
            onProgress
        )
        expect(name).toBe('x-chats-2026-11-19.zip')
        expect(Object.keys(unzipSync(archive)).sort()).toEqual([
            'alice-smith-100200/_chat.txt',
            'alice-smith-100200/chat.html',
            'alice-smith-100200/chat.json',
            'cafe-crew-456789/_chat.txt',
            'cafe-crew-456789/chat.html',
            'cafe-crew-456789/chat.json',
        ])
        expect(onProgress.mock.calls).toEqual([
            [{ current: 1, total: 2 }],
            [{ current: 2, total: 2 }],
        ])
        db.close()
    })

    it('stores media under media/ with an extension from the file bytes', async () => {
        vi.mocked(listChatMediaFiles).mockResolvedValue([
            { file: file([0xff, 0xd8, 0xff, 0xe0]), messageId: 'm1' },
            {
                file: file([
                    0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34,
                    0x32,
                ]),
                messageId: 'm2',
            },
        ])
        const db = await openFixture()
        const { archive } = await buildArchive(db, ['100:200'], true)
        const files = unzipSync(archive)
        expect(Object.keys(files)).toEqual(
            expect.arrayContaining(['media/m1.jpg', 'media/m2.mp4'])
        )
        expect(strFromU8(files['_chat.txt'] ?? new Uint8Array())).toContain(
            '<attached: media/m1.jpg>'
        )
        expect(listChatMediaFiles).toHaveBeenCalledWith(OWNER, '100:200')
        db.close()
    })

    it('transliterates non-Latin chat names instead of dropping them', async () => {
        const db = await openFixture()
        const { name } = await buildArchive(db, ['100:400'], false)
        expect(name).toBe('x-chat-ivan-petrov-2026-11-19.zip')
        db.close()
    })

    it('recognises media formats beyond the common image types', async () => {
        vi.mocked(listChatMediaFiles).mockResolvedValue([
            {
                file: file([
                    0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x1f, 0x42, 0x86, 0x81, 0x01, 0x42, 0x82, 0x84, 0x77,
                    0x65, 0x62, 0x6d,
                ]),
                messageId: 'm1',
            },
            { file: file([1, 2, 3, 4]), messageId: 'm2' },
        ])
        const db = await openFixture()
        const files = unzipSync(
            (await buildArchive(db, ['100:200'], true)).archive
        )
        expect(Object.keys(files)).toEqual(
            expect.arrayContaining(['media/m1.webm', 'media/m2.bin'])
        )
        db.close()
    })

    it('refuses chats that are not in the local database', async () => {
        const db = await openFixture()
        await expect(buildArchive(db, ['nope'], false)).rejects.toThrow(
            "not in X's local backup"
        )
        db.close()
    })
})
