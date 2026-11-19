import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendToTab } from './chrome-messaging'

const originalChrome = globalThis.chrome

function stubSendMessage(sendMessage: () => Promise<unknown>) {
    vi.stubGlobal('chrome', { ...originalChrome, tabs: { sendMessage } })
}

afterEach(() => {
    vi.stubGlobal('chrome', originalChrome)
})

describe('sendToTab', () => {
    it("resolves with the content script's response", async () => {
        stubSendMessage(() => Promise.resolve({ ok: true }))
        await expect(sendToTab(1, { type: 'LIST_CHATS' })).resolves.toEqual({
            ok: true,
        })
    })

    it('resolves undefined when no content script is listening', async () => {
        stubSendMessage(() =>
            Promise.reject(new Error('Receiving end does not exist.'))
        )
        await expect(
            sendToTab(1, { type: 'LIST_CHATS' })
        ).resolves.toBeUndefined()
    })
})
