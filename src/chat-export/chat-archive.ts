import { strToU8, type Zippable, zipSync } from 'fflate'
import { fileTypeFromBuffer } from 'file-type'
import slugify from 'slugify'

import type {
    ChatArchive,
    ChatDatabase,
    ChatMediaRef,
    ChatSummary,
    ExportOptions,
    ExportProgressHandler,
} from './chat.types'

import { openChatDatabase } from './chat-database'
import { renderChatHtml, renderChatJson, renderChatText } from './chat-render'
import { listChatMediaFiles, readChatDatabaseFile } from './chat-storage'

const UNKNOWN_FILE_TYPE = { ext: 'bin', mime: 'application/octet-stream' }

const toSlug = (value: string) =>
    slugify(value, { lower: true, strict: true }).slice(0, 40) || 'chat'

const X_SAVE_EVENT = 'xchat_database_backup_event'
const SAVE_WAIT_TIMEOUT_MS = 10_000
const SAVE_POLL_INTERVAL_MS = 500

const today = () => new Date().toISOString().slice(0, 10)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function buildArchive(
    db: ChatDatabase,
    chatIds: string[],
    includeMedia: boolean,
    onProgress?: ExportProgressHandler
): Promise<ChatArchive> {
    const chats = db.listChats().filter(chat => chatIds.includes(chat.id))
    if (!chats.length)
        throw new Error(
            "This chat is not in X's local backup yet. Open the chat, scroll up through it, wait a few seconds and try again."
        )

    const isSingle = chats.length === 1
    const files: Zippable = {}
    for (const [index, chat] of chats.entries()) {
        onProgress?.({ current: index + 1, total: chats.length })
        const folder = isSingle
            ? ''
            : `${toSlug(chat.name)}-${chat.id.replace(/\D/g, '').slice(-6)}/`
        await addChatFiles(files, db, chat, folder, includeMedia)
    }

    const name = isSingle
        ? `x-chat-${toSlug(chats[0]?.name ?? '')}-${today()}.zip`
        : `x-chats-${today()}.zip`
    return { archive: zipSync(files), name }
}

export async function exportChats(
    chatIds: string[],
    includeMedia: boolean,
    { onProgress, requiredMessageIds = [] }: ExportOptions = {}
): Promise<string> {
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
    setTimeout(() => {
        URL.revokeObjectURL(url)
    }, 60_000)
    return result.name
}

export async function loadChatDatabase(): Promise<ChatDatabase> {
    const { bytes, ownerId } = await readChatDatabaseFile()
    return openChatDatabase(bytes, ownerId)
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
            const { ext, mime } =
                (await fileTypeFromBuffer(bytes)) ?? UNKNOWN_FILE_TYPE
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
