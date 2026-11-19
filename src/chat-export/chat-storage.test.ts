import { afterEach, describe, expect, it, vi } from 'vitest'

import { listChatMediaFiles } from './chat-storage'

function stubStorageRoot(getDirectoryHandle: () => Promise<unknown>) {
    vi.stubGlobal('navigator', {
        storage: { getDirectory: async () => ({ getDirectoryHandle }) },
    })
}

const originalNavigator = globalThis.navigator

afterEach(() => {
    vi.stubGlobal('navigator', originalNavigator)
})

describe('listChatMediaFiles', () => {
    it('returns no media when X has no media folder for the chat', async () => {
        stubStorageRoot(() =>
            Promise.reject(new DOMException('missing', 'NotFoundError'))
        )
        await expect(listChatMediaFiles('1', '1:2')).resolves.toEqual([])
    })

    it('surfaces storage failures other than a missing folder', async () => {
        stubStorageRoot(() =>
            Promise.reject(new DOMException('denied', 'SecurityError'))
        )
        await expect(listChatMediaFiles('1', '1:2')).rejects.toThrow('denied')
    })
})
