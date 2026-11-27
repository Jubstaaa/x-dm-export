import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { ExportStatus } from '@/chat-export/chat.types'

import { getErrorMessage } from '@/chat-export/chrome-messaging'
import { ExportStatusIcon } from '@/components/export-status-icon'
import { Menu, MenuAnchor, MenuContent, MenuItem } from '@/components/ui/menu'
import { MediaIcon, TextIcon } from '@/components/x-icons'

import {
    getButtonSlot,
    getCurrentChatId,
    getVisibleMessageIds,
    updateHeaderButton,
} from './x-chat-page'

export interface ExportMenuProps {
    anchor: HTMLButtonElement
    portalContainer: HTMLElement
}

const STATUS_RESET_MS = 2500

const MENU_ITEMS = [
    { icon: MediaIcon, includeMedia: true, label: 'Export with media' },
    { icon: TextIcon, includeMedia: false, label: 'Export without media' },
]

export function ExportMenu({ anchor, portalContainer }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<ExportStatus>('idle')

    const [resultTitle, setResultTitle] = useState<string>()
    const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    const anchorRef = useMemo(() => ({ current: anchor }), [anchor])
    const iconSlot = useMemo(() => getButtonSlot(anchor), [anchor])

    const handleExport = useCallback(async (includeMedia: boolean) => {
        const chatId = getCurrentChatId()
        setIsOpen(false)
        if (!chatId) return
        clearTimeout(resetTimer.current)
        setResultTitle(undefined)
        setStatus('exporting')
        try {
            const { exportChats } = await import('@/chat-export/chat-archive')
            const fileName = await exportChats([chatId], includeMedia, {
                requiredMessageIds: getVisibleMessageIds(),
            })
            setResultTitle(
                `Downloaded ${fileName}. Press Ctrl+J (⌘⇧J on Mac) to find it.`
            )
            setStatus('done')
        } catch (error) {
            setResultTitle(getErrorMessage(error))
            setStatus('error')
        } finally {
            resetTimer.current = setTimeout(() => {
                setStatus('idle')
            }, STATUS_RESET_MS)
        }
    }, [])

    useEffect(
        () => () => {
            clearTimeout(resetTimer.current)
        },
        []
    )

    useEffect(() => {
        const handleClick = () => {
            setIsOpen(open => !open)
        }
        anchor.addEventListener('click', handleClick)
        return () => {
            anchor.removeEventListener('click', handleClick)
        }
    }, [anchor])

    useEffect(() => {
        updateHeaderButton(anchor, {
            disabled: status === 'exporting',
            title: resultTitle ?? 'Export chat',
        })
    }, [anchor, resultTitle, status])

    useEffect(() => {
        anchor.setAttribute('aria-expanded', String(isOpen))
    }, [anchor, isOpen])

    return (
        <>
            {createPortal(<ExportStatusIcon status={status} />, iconSlot)}
            <Menu onOpenChange={setIsOpen} open={isOpen}>
                <MenuAnchor virtualRef={anchorRef} />
                <MenuContent
                    container={portalContainer}
                    onInteractOutside={event => {
                        if (
                            event.detail.originalEvent
                                .composedPath()
                                .includes(anchor)
                        ) {
                            event.preventDefault()
                        }
                    }}>
                    {MENU_ITEMS.map(({ icon: Icon, includeMedia, label }) => (
                        <MenuItem
                            key={label}
                            onClick={() => void handleExport(includeMedia)}>
                            <Icon />
                            {label}
                        </MenuItem>
                    ))}
                </MenuContent>
            </Menu>
        </>
    )
}
