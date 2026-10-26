import { CHATS, OWNER } from './fake-data'

const listeners: ((message: unknown) => void)[] = []

Object.assign(window, {
    chrome: {
        runtime: {
            getURL: (path: string) => `/${path}`,
            lastError: undefined,
            onMessage: {
                addListener: (listener: (message: unknown) => void) =>
                    listeners.push(listener),
                removeListener: () => {},
            },
        },
        tabs: {
            create: () => {},
            query: async () => [{ id: 1, url: 'https://x.com/i/chat' }],
            reload: () => {},
            sendMessage: (
                _tabId: number,
                _message: unknown,
                callback: (response: unknown) => void
            ) => callback({ chats: CHATS, owner: OWNER }),
        },
    },
})

export function emitProgress(current: number, total: number): void {
    listeners.forEach(listener =>
        listener({ progress: { current, total }, type: 'EXPORT_PROGRESS' })
    )
}
