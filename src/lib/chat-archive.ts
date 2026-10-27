import { strToU8, type Zippable, zipSync } from 'fflate'

import { openChatDatabase } from './chat-database'
import { renderChatHtml, renderChatJson, renderChatText } from './chat-render'
import { listChatMediaFiles, readChatDatabaseFile } from './chat-storage'
import type {
    ChatArchive,
    ChatDatabase,
    ChatMediaRef,
    ChatSummary,
    ExportOptions,
    ExportProgressHandler,
} from './chat.types'

const FILE_SIGNATURES = [
    { bytes: [0x47, 0x49, 0x46], ext: 'gif', mime: 'image/gif' },
    { bytes: [0x89, 0x50, 0x4e, 0x47], ext: 'png', mime: 'image/png' },
    { bytes: [0xff, 0xd8], ext: 'jpg', mime: 'image/jpeg' },
    {
        bytes: [0x66, 0x74, 0x79, 0x70],
        ext: 'mp4',
        mime: 'video/mp4',
        offset: 4,
    },
    {
        bytes: [0x57, 0x45, 0x42, 0x50],
        ext: 'webp',
        mime: 'image/webp',
        offset: 8,
    },
]

function detectFileType(bytes: Uint8Array) {
    const match = FILE_SIGNATURES.find(({ bytes: signature, offset = 0 }) =>
        signature.every((byte, index) => bytes[offset + index] === byte)
    )
    return match ?? { ext: 'bin', mime: 'application/octet-stream' }
}

function slugify(value: string): string {
    const slug = value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 40)
    return slug || 'chat'
}

const X_SAVE_EVENT = 'xchat_database_backup_event'
const SAVE_WAIT_TIMEOUT_MS = 10_000
const SAVE_POLL_INTERVAL_MS = 500

const today = () => new Date().toISOString().slice(0, 10)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loadChatDatabase(): Promise<ChatDatabase> {
    const { bytes, ownerId } = await readChatDatabaseFile()
    return openChatDatabase(bytes, ownerId)
}

async function loadSavedChatDatabase(
    messageIds: string[]
): Promise<ChatDatabase> {
    const requestedAt = Date.now()
    window.dispatchEvent(new CustomEvent(X_SAVE_EVENT))
    for (;;) {
        const { bytes, modifiedAt, ownerId } = await readChatDatabaseFile()
        const db = await openChatDatabase(bytes, ownerId)
        const isSaved =
            modifiedAt >= requestedAt ||
            (messageIds.length > 0 && db.hasMessages(messageIds))
        if (isSaved || Date.now() - requestedAt >= SAVE_WAIT_TIMEOUT_MS) {
            return db
        }
        db.close()
        await sleep(SAVE_POLL_INTERVAL_MS)
    }
}

async function addChatFiles(
    files: Zippable,
    db: ChatDatabase,
    chat: ChatSummary,
    folder: string,
    includeMedia: boolean
): Promise<void> {
    const media = new Map<string, ChatMediaRef>()
    if (includeMedia) {
        for (const { file, messageId } of await listChatMediaFiles(
            db.owner.id,
            chat.id
        )) {
            const bytes = new Uint8Array(await file.arrayBuffer())
            const { ext, mime } = detectFileType(bytes)
            const path = `media/${messageId}.${ext}`
            files[`${folder}${path}`] = [bytes, { level: 0 }]
            media.set(messageId, { mime, path })
        }
    }

    const messages = db.getMessages(chat.id)
    files[`${folder}chat.html`] = strToU8(renderChatHtml(chat, messages, media))
    files[`${folder}chat.json`] = strToU8(renderChatJson(chat, messages, media))
    files[`${folder}_chat.txt`] = strToU8(renderChatText(messages, media))
}

async function buildArchive(
    db: ChatDatabase,
    chatIds: string[],
    includeMedia: boolean,
    onProgress?: ExportProgressHandler
): Promise<ChatArchive> {
    const chats = db.listChats().filter(chat => chatIds.includes(chat.id))
    if (!chats.length) throw new Error('Chat not found in local database')

    const isSingle = chats.length === 1
    const files: Zippable = {}
    for (const [index, chat] of chats.entries()) {
        onProgress?.({ current: index + 1, total: chats.length })
        const folder = isSingle
            ? ''
            : `${slugify(chat.name)}-${chat.id.replace(/\D/g, '').slice(-6)}/`
        await addChatFiles(files, db, chat, folder, includeMedia)
    }

    const name = isSingle
        ? `x-chat-${slugify(chats[0].name)}-${today()}.zip`
        : `x-chats-${today()}.zip`
    return { archive: zipSync(files), name }
}

export async function exportChats(
    chatIds: string[],
    includeMedia: boolean,
    { requiredMessageIds = [], onProgress }: ExportOptions = {}
): Promise<void> {
    const db = await loadSavedChatDatabase(requiredMessageIds)
    let result: ChatArchive
    try {
        result = await buildArchive(db, chatIds, includeMedia, onProgress)
    } finally {
        db.close()
    }

    const url = URL.createObjectURL(
        new Blob([result.archive], { type: 'application/zip' })
    )
    const link = Object.assign(document.createElement('a'), {
        download: result.name,
        href: url,
    })
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
