import type { OnHeaderButton } from './x-chat-page.types'

const BUTTON_MARKER = 'data-x-dm-export'
const MORE_BUTTON = '[data-testid="dm-conversation-more-button"]'
const POLL_INTERVAL_MS = 1000

export function getCurrentChatId(): string | null {
    const match = location.pathname.match(/^\/i\/chat\/([^/]+)/)
    if (!match) return null
    const id = decodeURIComponent(match[1])
    return /^\d+-\d+$/.test(id) ? id.replace('-', ':') : id
}

export function isDarkPage(): boolean {
    const [r, g, b] = (
        getComputedStyle(document.body).backgroundColor.match(/\d+/g) ?? []
    ).map(Number)
    return (r ?? 255) + (g ?? 255) + (b ?? 255) < 384
}

export function getButtonSlot(button: HTMLElement): HTMLElement {
    return button.querySelector<HTMLElement>('.x-button-slot') ?? button
}

export function updateHeaderButton(
    button: HTMLButtonElement,
    { disabled, title }: { disabled?: boolean; title?: string }
): void {
    if (disabled !== undefined) button.disabled = disabled
    if (title !== undefined) button.title = title
}

let chatHost: Element | undefined

function findChatShadowRoot(): ShadowRoot | null {
    if (!chatHost?.isConnected) {
        chatHost = [...document.querySelectorAll('main *')].find(element =>
            element.shadowRoot?.querySelector(MORE_BUTTON)
        )
    }
    return chatHost?.shadowRoot ?? null
}

export function getVisibleMessageIds(): string[] {
    const messages = findChatShadowRoot()?.querySelectorAll<HTMLElement>(
        '[data-testid^="message-"]:not([data-testid^="message-text-"])'
    )
    return [...(messages ?? [])].map(message =>
        message.dataset.testid!.slice('message-'.length)
    )
}

function createHeaderButton(template: Element): {
    button: HTMLButtonElement
    element: Element
} {
    const element = template.cloneNode(true) as Element
    const button =
        element instanceof HTMLButtonElement
            ? element
            : element.querySelector('button')!
    element.setAttribute(BUTTON_MARKER, '')
    button.removeAttribute('data-testid')
    button.removeAttribute('aria-haspopup')
    button.title = 'Export chat'
    button.setAttribute('aria-label', 'Export chat')
    getButtonSlot(button).replaceChildren()
    return { button, element }
}

export function watchChatHeader(onHeaderButton: OnHeaderButton): void {
    setInterval(() => {
        if (!getCurrentChatId()) return
        const moreButton = findChatShadowRoot()?.querySelector(MORE_BUTTON)
        const moreWrapper = moreButton?.parentElement
        const actions = moreWrapper?.parentElement
        if (
            !moreWrapper ||
            !actions ||
            actions.querySelector(`[${BUTTON_MARKER}]`)
        ) {
            return
        }
        const { button, element } = createHeaderButton(
            actions.firstElementChild ?? moreWrapper
        )
        actions.insertBefore(element, moreWrapper)
        onHeaderButton(button)
    }, POLL_INTERVAL_MS)
}
