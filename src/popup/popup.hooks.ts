import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ChatSummary, ChatUser } from '@/lib/chat.types'
import {
    type ExportProgressMessage,
    isErrorResponse,
    type ListChatsResponse,
    sendToTab,
} from '@/lib/chrome-messaging'

import type { ExportState, PopupStatus } from './popup.types'

const X_CHAT_URL = 'https://x.com/i/chat'

export function useChatExporter() {
    const [status, setStatus] = useState<PopupStatus>('loading')
    const [tabId, setTabId] = useState<number | null>(null)
    const [owner, setOwner] = useState<ChatUser | null>(null)
    const [chats, setChats] = useState<ChatSummary[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [query, setQuery] = useState('')
    const [includeMedia, setIncludeMedia] = useState(true)
    const [exportState, setExportState] = useState<ExportState>({
        type: 'idle',
    })

    const filteredChats = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return chats
        return chats.filter(
            chat =>
                chat.name.toLowerCase().includes(needle) ||
                chat.participants.some(user =>
                    user.handle.toLowerCase().includes(needle)
                )
        )
    }, [chats, query])

    const isAllSelected =
        filteredChats.length > 0 &&
        filteredChats.every(chat => selectedIds.has(chat.id))

    const handleToggleChat = useCallback((chatId: string) => {
        setSelectedIds(previous => {
            const next = new Set(previous)
            if (next.has(chatId)) next.delete(chatId)
            else next.add(chatId)
            return next
        })
    }, [])

    const handleToggleAll = useCallback(() => {
        setSelectedIds(previous => {
            const next = new Set(previous)
            for (const chat of filteredChats) {
                if (isAllSelected) next.delete(chat.id)
                else next.add(chat.id)
            }
            return next
        })
    }, [filteredChats, isAllSelected])

    const handleOpenX = useCallback(() => {
        void chrome.tabs.create({ url: X_CHAT_URL })
        window.close()
    }, [])

    const handleReloadTab = useCallback(() => {
        if (tabId === null) return
        void chrome.tabs.reload(tabId)
        window.close()
    }, [tabId])

    const handleExport = useCallback(async () => {
        if (tabId === null || !selectedIds.size) return
        setExportState({
            current: 0,
            total: selectedIds.size,
            type: 'exporting',
        })
        const response = await sendToTab<{ ok: true }>(tabId, {
            chatIds: [...selectedIds],
            includeMedia,
            type: 'EXPORT_CHATS',
        })
        if (!response) {
            setExportState({
                message: 'The X tab did not respond. Reload it and try again.',
                type: 'error',
            })
            return
        }
        if (isErrorResponse(response)) {
            setExportState({ message: response.error, type: 'error' })
            return
        }
        setExportState({ count: selectedIds.size, type: 'done' })
    }, [includeMedia, selectedIds, tabId])

    useEffect(() => {
        const loadChats = async () => {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            })
            if (!tab?.id || !tab.url?.startsWith('https://x.com/')) {
                setStatus('not-on-x')
                return
            }
            setTabId(tab.id)
            const response = await sendToTab<ListChatsResponse>(tab.id, {
                type: 'LIST_CHATS',
            })
            if (!response) {
                setStatus('reload-needed')
                return
            }
            if (isErrorResponse(response)) {
                setStatus('no-database')
                return
            }
            setOwner(response.owner)
            setChats(response.chats)
            setStatus('ready')
        }
        void loadChats()
    }, [])

    useEffect(() => {
        const handleProgress = (message: ExportProgressMessage) => {
            if (message.type !== 'EXPORT_PROGRESS') return
            setExportState({ ...message.progress, type: 'exporting' })
        }
        chrome.runtime.onMessage.addListener(handleProgress)
        return () => chrome.runtime.onMessage.removeListener(handleProgress)
    }, [])

    return {
        chats,
        exportState,
        filteredChats,
        handleExport,
        handleOpenX,
        handleReloadTab,
        handleToggleAll,
        handleToggleChat,
        includeMedia,
        isAllSelected,
        owner,
        query,
        selectedIds,
        setIncludeMedia,
        setQuery,
        status,
    }
}
