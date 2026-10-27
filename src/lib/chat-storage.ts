import type { ChatMediaFile } from './chat.types'

const CHAT_DATABASE_FILE = /^chat_(\d+)\.db$/

async function getDirectory(
    path: string[]
): Promise<FileSystemDirectoryHandle> {
    let directory = await navigator.storage.getDirectory()
    for (const name of path)
        directory = await directory.getDirectoryHandle(name)
    return directory
}

export async function readChatDatabaseFile(): Promise<{
    bytes: Uint8Array
    modifiedAt: number
    ownerId: string
}> {
    const backups = await getDirectory(['backups'])
    for await (const [name, handle] of backups.entries()) {
        const match = name.match(CHAT_DATABASE_FILE)
        if (handle.kind !== 'file' || !match) continue
        const file = await (handle as FileSystemFileHandle).getFile()
        return {
            bytes: new Uint8Array(await file.arrayBuffer()),
            modifiedAt: file.lastModified,
            ownerId: match[1],
        }
    }
    throw new Error('No chat database found')
}

export async function listChatMediaFiles(
    ownerId: string,
    chatId: string
): Promise<ChatMediaFile[]> {
    let root: FileSystemDirectoryHandle
    try {
        root = await getDirectory([
            `dm-files-${ownerId}`,
            'decrypted-media-v2',
            chatId.replace(':', '-'),
        ])
    } catch {
        return []
    }

    const media: ChatMediaFile[] = []
    for await (const [messageId, directory] of root.entries()) {
        if (directory.kind !== 'directory') continue
        let largest: File | null = null
        for await (const handle of (
            directory as FileSystemDirectoryHandle
        ).values()) {
            if (handle.kind !== 'file') continue
            const file = await (handle as FileSystemFileHandle).getFile()
            if (!largest || file.size > largest.size) largest = file
        }
        if (largest) media.push({ file: largest, messageId })
    }
    return media
}
