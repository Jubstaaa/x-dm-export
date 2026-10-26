import { MessageSquareOff, RotateCw } from 'lucide-react'

import type { EmptyStateConfig, PopupStatus } from './popup.types'

export const EMPTY_STATES: Partial<Record<PopupStatus, EmptyStateConfig>> = {
    'no-database': {
        action: 'open-x',
        actionLabel: 'Open X Chat',
        icon: MessageSquareOff,
        text: 'No chats found yet. Open Chat on x.com once, wait for it to load, then try again.',
    },
    'not-on-x': {
        action: 'open-x',
        actionLabel: 'Open X Chat',
        icon: MessageSquareOff,
        text: 'Open X in this tab to see your chats.',
    },
    'reload-needed': {
        action: 'reload',
        actionLabel: 'Reload X',
        icon: RotateCw,
        text: 'Reload the X tab once so the extension can connect.',
    },
}
