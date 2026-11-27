import type { ChatMediaFile } from './chat.types'

const CHAT_DATABASE_FILE = /^chat_(\d+)\.db$/

export async function listChatMediaFiles(
    ownerId: string,
    chatId: string
): Promise<ChatMediaFile[]> {
    let root: FileSystemDirectoryHandle
    try {
        root = await getDirectory([
            `dm-files-${ownerId}`,
            'decrypted-media-v2',
            chatId.replaceAll(':', '-'),
        ])
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError')
            return []
        throw error
    }

    const media: ChatMediaFile[] = []
    for await (const [messageId, directory] of root.entries()) {
        if (directory.kind !== 'directory') continue
        let largest: File | null = null
        for await (const handle of directory.values()) {
            if (handle.kind !== 'file') continue
            const file = await handle.getFile()
            if (!largest || file.size > largest.size) largest = file
        }
        if (largest) media.push({ file: largest, messageId })
    }
    return media
}

export async function readChatDatabaseFile(): Promise<{
    bytes: Uint8Array
    modifiedAt: number
    ownerId: string
}> {
    const backups = await getDirectory(['backups'])
    let latest: null | { file: File; ownerId: string } = null
    for await (const [name, handle] of backups.entries()) {
        const match = CHAT_DATABASE_FILE.exec(name)
        if (handle.kind !== 'file' || !match) continue
        const file = await handle.getFile()
        if (!latest || file.lastModified > latest.file.lastModified)
            latest = { file, ownerId: match[1] ?? '' }
    }
    if (!latest) throw new Error('No chat database found')
    return {
        bytes: new Uint8Array(await latest.file.arrayBuffer()),
        modifiedAt: latest.file.lastModified,
        ownerId: latest.ownerId,
    }
}

async function getDirectory(
    path: string[]
): Promise<FileSystemDirectoryHandle> {
    let directory = await navigator.storage.getDirectory()
    for (const name of path)
        directory = await directory.getDirectoryHandle(name)
    return directory
}
