import { useCallback, useEffect, useMemo, useState } from 'react'

import { createPortal } from 'react-dom'

import { exportChats } from '@/chat-export/chat-archive'
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

    const anchorRef = useMemo(() => ({ current: anchor }), [anchor])
    const iconSlot = useMemo(() => getButtonSlot(anchor), [anchor])

    const handleExport = useCallback(
        async (includeMedia: boolean) => {
            const chatId = getCurrentChatId()
            setIsOpen(false)
            if (!chatId) return
            setStatus('exporting')
            try {
                await exportChats([chatId], includeMedia, {
                    requiredMessageIds: getVisibleMessageIds(),
                })
                setStatus('done')
            } catch (error) {
                updateHeaderButton(anchor, { title: getErrorMessage(error) })
                setStatus('error')
            } finally {
                setTimeout(() => setStatus('idle'), STATUS_RESET_MS)
            }
        },
        [anchor]
    )

    useEffect(() => {
        const handleClick = () => setIsOpen(open => !open)
        anchor.addEventListener('click', handleClick)
        return () => anchor.removeEventListener('click', handleClick)
    }, [anchor])

    useEffect(() => {
        updateHeaderButton(anchor, {
            disabled: status === 'exporting',
            title: status === 'idle' ? 'Export chat' : undefined,
        })
    }, [anchor, status])

    useEffect(() => {
        anchor.setAttribute('aria-expanded', String(isOpen))
    }, [anchor, isOpen])

    return (
        <>
            {createPortal(<ExportStatusIcon status={status} />, iconSlot)}
            <Menu open={isOpen} onOpenChange={setIsOpen}>
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
