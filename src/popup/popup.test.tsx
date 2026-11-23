// @vitest-environment happy-dom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ListChatsResponse } from '@/chat-export/chrome-messaging'

import { Popup } from './popup'

const me = { avatarUrl: null, handle: 'me', id: '1', name: 'Me' }
const friend = { avatarUrl: null, handle: 'friend', id: '2', name: 'Friend' }

const listResponse: ListChatsResponse = {
    chats: [
        {
            firstAt: 0,
            id: '1:2',
            isGroup: false,
            lastAt: Date.now(),
            messageCount: 3,
            name: 'Friend',
            participants: [me, friend],
        },
    ],
    owner: me,
}

const originalChrome = globalThis.chrome

beforeEach(() => {
    vi.stubGlobal('chrome', {
        ...originalChrome,
        runtime: {
            ...originalChrome.runtime,
            onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
        },
        tabs: {
            query: async () => [{ id: 7, url: 'https://x.com/i/chat' }],
            sendMessage: async (_tabId: number, message: { type: string }) =>
                message.type === 'LIST_CHATS'
                    ? listResponse
                    : { fileName: 'x-chat-friend-2026-11-24.zip' },
        },
    })
})

afterEach(() => {
    cleanup()
    vi.stubGlobal('chrome', originalChrome)
})

describe('Popup accessibility', () => {
    it('puts the chat list in a main landmark with a labelled search box', async () => {
        render(<Popup />)
        const main = await screen.findByRole('main')
        expect(
            within(main).getByRole('textbox', { name: 'Search chats' })
        ).toBeTruthy()
    })

    it('names the select-all checkbox without the chat count', async () => {
        render(<Popup />)
        expect(
            await screen.findByRole('checkbox', { name: 'Select all' })
        ).toBeTruthy()
    })

    it('announces the export result in a status region', async () => {
        render(<Popup />)
        await userEvent.click(
            await screen.findByRole('checkbox', { name: /Friend/ })
        )
        await userEvent.click(screen.getByRole('button', { name: /Export/ }))
        expect(screen.getByRole('status').textContent).toContain(
            'Saved x-chat-friend-2026-11-24.zip to your Downloads folder.'
        )
    })
})
