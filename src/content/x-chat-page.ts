type OnHeaderButton = (button: HTMLButtonElement) => void

const BUTTON_MARKER = 'data-x-dm-export'
const MORE_BUTTON = '[data-testid="dm-conversation-more-button"]'
const POLL_INTERVAL_MS = 1000

export function getButtonSlot(button: HTMLElement): HTMLElement {
    return button.querySelector<HTMLElement>('.x-button-slot') ?? button
}

export function getCurrentChatId(): null | string {
    const match = /^\/i\/chat\/([^/]+)/.exec(location.pathname)
    const raw = match?.[1]
    if (raw === undefined) return null
    const id = decodeURIComponent(raw)
    return /^\d+-\d+$/.test(id) ? id.replace('-', ':') : id
}

export function isDarkPage(): boolean {
    const [r, g, b] = (
        getComputedStyle(document.body).backgroundColor.match(/\d+/g) ?? []
    ).map(Number)
    return (r ?? 255) + (g ?? 255) + (b ?? 255) < 384
}

export function updateHeaderButton(
    button: HTMLButtonElement,
    { disabled, title }: { disabled?: boolean; title?: string }
): void {
    if (disabled !== undefined) button.disabled = disabled
    if (title !== undefined) button.title = title
}

let chatHost: Element | undefined

export function getVisibleMessageIds(): string[] {
    const messages = findChatShadowRoot()?.querySelectorAll<HTMLElement>(
        '[data-testid^="message-"]:not([data-testid^="message-text-"])'
    )
    return [...(messages ?? [])].flatMap(message => {
        const testid = message.dataset.testid
        return testid ? [testid.slice('message-'.length)] : []
    })
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
        const created = createHeaderButton(moreWrapper)
        if (!created) return
        const { button, element } = created
        actions.insertBefore(element, moreWrapper)
        onHeaderButton(button)
    }, POLL_INTERVAL_MS)
}

function createHeaderButton(template: Element): null | {
    button: HTMLButtonElement
    element: Element
} {
    const element = template.cloneNode(true) as Element
    const button =
        element instanceof HTMLButtonElement
            ? element
            : element.querySelector('button')
    if (!button) return null
    element.setAttribute(BUTTON_MARKER, '')
    button.removeAttribute('data-testid')
    button.removeAttribute('aria-haspopup')
    button.removeAttribute('aria-expanded')
    button.removeAttribute('aria-disabled')
    button.disabled = false
    button.title = 'Export chat'
    button.setAttribute('aria-label', 'Export chat')
    getButtonSlot(button).replaceChildren()
    return { button, element }
}

function findChatShadowRoot(): null | ShadowRoot {
    if (!chatHost?.isConnected) {
        chatHost = [...document.querySelectorAll('main *')].find(element =>
            element.shadowRoot?.querySelector(MORE_BUTTON)
        )
    }
    return chatHost?.shadowRoot ?? null
}
