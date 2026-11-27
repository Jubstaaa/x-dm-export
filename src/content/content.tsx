import { createRoot } from 'react-dom/client'

import {
    broadcastProgress,
    type ContentMessage,
    type ExportChatsResponse,
    getErrorMessage,
} from '@/chat-export/chrome-messaging'

import styles from './content.css?inline'
import { ExportMenu } from './export-menu'
import { isDarkPage, watchChatHeader } from './x-chat-page'

function createOverlay() {
    const host = document.createElement('x-dm-export')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = styles
    const container = document.createElement('div')
    shadow.append(style, container)
    document.body.append(host)
    return { container, root: createRoot(container) }
}

async function handleMessage(message: ContentMessage): Promise<unknown> {
    const { exportChats, loadChatDatabase } =
        await import('@/chat-export/chat-archive')
    if (message.type === 'LIST_CHATS') {
        return loadChatDatabase().then(db => {
            const chats = db.listChats()
            db.close()
            return { chats, owner: db.owner }
        })
    }
    return exportChats(message.chatIds, message.includeMedia, {
        onProgress: broadcastProgress,
    }).then(fileName => ({ fileName }) satisfies ExportChatsResponse)
}

function registerPropertyRules(): void {
    const rules = styles.match(/@property[^{]+\{[^}]*\}/g)
    if (!rules) return
    const style = document.createElement('style')
    style.textContent = rules.join('\n')
    document.head.append(style)
}

chrome.runtime.onMessage.addListener(
    (message: ContentMessage, _sender, sendResponse) => {
        handleMessage(message)
            .then(sendResponse)
            .catch((error: unknown) => {
                sendResponse({ error: getErrorMessage(error) })
            })
        return true
    }
)

registerPropertyRules()

const overlay = createOverlay()
let mountCount = 0
watchChatHeader(button => {
    mountCount += 1
    overlay.container.className = isDarkPage() ? 'dark' : ''
    overlay.root.render(
        <ExportMenu
            anchor={button}
            key={mountCount}
            portalContainer={overlay.container}
        />
    )
})
