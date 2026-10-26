import type { OnHeaderButton } from './x-chat-page.types'

const BUTTON_MARKER = 'data-x-dm-export'
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

function findChatShadowRoot(): ShadowRoot | null {
    const route = document.querySelector('[data-testid="xchatEmbedRoute"]')
    if (!route) return null
    const host = [route, ...route.querySelectorAll('*')].find(
        element => element.shadowRoot
    )
    return host?.shadowRoot ?? null
}

function createHeaderButton(template: HTMLButtonElement): HTMLButtonElement {
    const button = template.cloneNode(true) as HTMLButtonElement
    button.setAttribute(BUTTON_MARKER, '')
    button.removeAttribute('data-testid')
    button.title = 'Export chat'
    button.setAttribute('aria-label', 'Export chat')
    getButtonSlot(button).replaceChildren()
    return button
}

export function watchChatHeader(onHeaderButton: OnHeaderButton): void {
    setInterval(() => {
        const moreButton = findChatShadowRoot()?.querySelector(
            '[data-testid="dm-conversation-more-button"]'
        )
        const moreWrapper = moreButton?.parentElement
        const actions = moreWrapper?.parentElement
        if (
            !moreWrapper ||
            !actions ||
            actions.querySelector(`[${BUTTON_MARKER}]`)
        ) {
            return
        }
        const template =
            actions.querySelector<HTMLButtonElement>(':scope > button') ??
            (moreButton as HTMLButtonElement)
        const button = createHeaderButton(template)
        actions.insertBefore(button, moreWrapper)
        onHeaderButton(button)
    }, POLL_INTERVAL_MS)
}
