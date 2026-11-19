// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'

import { getCurrentChatId, isDarkPage } from './x-chat-page'

function visit(path: string) {
    history.replaceState(null, '', path)
}

afterEach(() => {
    visit('/')
    document.body.removeAttribute('style')
})

describe('getCurrentChatId', () => {
    it('returns null outside a chat', () => {
        visit('/home')
        expect(getCurrentChatId()).toBeNull()
    })

    it('turns a direct chat URL into the database conversation id', () => {
        visit('/i/chat/100-200')
        expect(getCurrentChatId()).toBe('100:200')
    })

    it('keeps group ids and ignores trailing segments', () => {
        visit('/i/chat/g1234567890/info')
        expect(getCurrentChatId()).toBe('g1234567890')
    })

    it('decodes percent-encoded ids', () => {
        visit('/i/chat/100%3A200')
        expect(getCurrentChatId()).toBe('100:200')
    })
})

describe('isDarkPage', () => {
    it('detects a dark body background', () => {
        document.body.style.backgroundColor = 'rgb(0, 0, 0)'
        expect(isDarkPage()).toBe(true)
    })

    it('treats a light background as light', () => {
        document.body.style.backgroundColor = 'rgb(255, 255, 255)'
        expect(isDarkPage()).toBe(false)
    })
})
