import { useEffect, useMemo, useRef } from 'react'

import { Phone, Video } from 'lucide-react'

import { Menu, MenuAnchor, MenuContent, MenuItem } from '@/components/ui/menu'
import { DownloadIcon, MediaIcon, TextIcon } from '@/components/x-icons'
import { renderChatHtml } from '@/lib/chat-render'
import { Popup } from '@/popup/popup'

import { emitProgress } from './chrome-stub'
import { CHATS, conversationMessages, OWNER } from './fake-data'
import { XShell } from './x-shell'

const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><rect width="400" height="260" fill="url(#s)"/><circle cx="290" cy="110" r="36" fill="#fde68a"/><path d="M0 200 120 110l70 60 60-40 150 90v80H0z" fill="#1e1b4b"/><path d="M0 230 90 170l90 50 90-30 130 70H0z" fill="#312e81"/></svg>'
)}`

const headerButton =
    'flex size-12 items-center justify-center rounded-full border border-black/15 text-[24px] text-foreground'

function ChatPane({ children }: { children?: React.ReactNode }) {
    const messages = conversationMessages()
    const maya = CHATS[0].participants[1]
    return (
        <>
            <header className="flex items-center gap-3 border-b px-4 py-2">
                <img
                    alt=""
                    className="size-10 rounded-full"
                    src={maya.avatarUrl ?? ''}
                />
                <div className="flex-1">
                    <div className="font-bold">{maya.name}</div>
                    <div className="text-muted-foreground text-sm">
                        @{maya.handle}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={headerButton}>
                        <Phone className="size-6" strokeWidth={1.8} />
                    </span>
                    <span className={headerButton}>
                        <Video className="size-6" strokeWidth={1.8} />
                    </span>
                    {children}
                    <span className={headerButton}>•••</span>
                </div>
            </header>
            <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-4 pb-4">
                {messages.slice(-9).map(message => (
                    <div
                        key={message.id}
                        className={message.isOwn ? 'flex justify-end' : 'flex'}>
                        {message.text ? (
                            <div
                                className={
                                    message.isOwn
                                        ? 'bg-primary max-w-[70%] rounded-3xl rounded-br-md px-4 py-2.5 text-white'
                                        : 'bg-secondary max-w-[70%] rounded-3xl rounded-bl-md px-4 py-2.5'
                                }>
                                {message.text}
                            </div>
                        ) : (
                            <img
                                alt=""
                                className="w-64 rounded-2xl"
                                src={PHOTO}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="border-t px-4 py-3">
                <div className="bg-secondary text-muted-foreground rounded-full px-4 py-2.5">
                    Start a new message
                </div>
            </div>
        </>
    )
}

export function ChatScene() {
    const anchorRef = useRef<HTMLButtonElement>(null)
    return (
        <XShell activeChatId={CHATS[0].id}>
            <ChatPane>
                <Menu open>
                    <MenuAnchor asChild>
                        <button
                            ref={anchorRef}
                            className={`${headerButton} bg-foreground/[0.06]`}
                            type="button">
                            <DownloadIcon />
                        </button>
                    </MenuAnchor>
                    <MenuContent
                        onOpenAutoFocus={event => event.preventDefault()}>
                        <MenuItem>
                            <MediaIcon />
                            Export with media
                        </MenuItem>
                        <MenuItem>
                            <TextIcon />
                            Export without media
                        </MenuItem>
                    </MenuContent>
                </Menu>
            </ChatPane>
        </XShell>
    )
}

export function PopupScene() {
    useEffect(() => {
        const timer = setTimeout(() => {
            const rows = document.querySelectorAll<HTMLButtonElement>(
                '[data-popup-frame] [data-slot="checkbox"]'
            )
            ;[1, 2, 3, 5].forEach(index => rows[index]?.click())
            ;[
                ...document.querySelectorAll<HTMLButtonElement>(
                    '[data-popup-frame] footer button'
                ),
            ]
                .find(button => button.textContent?.startsWith('Export'))
                ?.click()
            setTimeout(() => emitProgress(2, 4), 50)
        }, 300)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="relative">
            <XShell>
                <ChatPane />
            </XShell>
            <div className="absolute inset-0 bg-black/10" />
            <div
                className="bg-background shadow-x absolute top-3 right-6 w-[380px] overflow-hidden rounded-xl"
                data-popup-frame>
                <Popup />
            </div>
        </div>
    )
}

export function ExportScene() {
    const html = useMemo(() => {
        const messages = conversationMessages()
        const media = new Map(
            messages
                .filter(message => message.hasAttachment)
                .map(message => [
                    message.id,
                    { mime: 'image/svg+xml', path: PHOTO },
                ])
        )
        return renderChatHtml(CHATS[0], messages, media).replaceAll(
            'loading="lazy" ',
            ''
        )
    }, [])
    return (
        <div className="flex h-[800px] w-[1280px] flex-col bg-[#dee1e6]">
            <div className="flex items-center gap-2 px-4 py-2.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
                <div className="ml-4 flex-1 rounded-full bg-white px-4 py-1.5 text-sm text-[#5f6368]">
                    file:///Users/{OWNER.handle}
                    /Downloads/x-chat-maya-chen-2026-10-26/chat.html
                </div>
            </div>
            <iframe
                className="flex-1 bg-white"
                srcDoc={html}
                title="Exported chat"
            />
        </div>
    )
}

export function HeroScene() {
    return (
        <div className="relative flex h-[800px] w-[1280px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#0f2a44_0%,#0b0f14_70%)] text-white">
            <div className="absolute top-24 left-28 rotate-[-8deg] rounded-3xl rounded-bl-md bg-white/[0.06] px-6 py-4 text-2xl text-white/25">
                see you tomorrow?
            </div>
            <div className="absolute right-28 bottom-16 rotate-[6deg] rounded-3xl rounded-br-md bg-[#1d9bf0]/20 px-6 py-4 text-2xl text-white/30">
                saved forever ✓
            </div>
            <img
                alt=""
                className="size-[168px] rounded-[40px] shadow-[0_20px_60px_rgba(29,155,240,0.35)]"
                src="/icon-128.png"
            />
            <h1 className="mt-12 text-[76px] leading-none font-extrabold tracking-tight">
                DM Export for X
            </h1>
            <p className="mt-5 text-[26px] text-white/70">
                Save your X chats, including the encrypted ones.
            </p>
            <p className="mt-16 text-[15px] font-semibold tracking-[0.35em] text-white/40">
                ENCRYPTED CHATS · HTML · JSON · TEXT · MEDIA · 100% LOCAL
            </p>
        </div>
    )
}

export function TileScene() {
    return (
        <div className="flex h-[280px] w-[440px] items-center gap-5 bg-[radial-gradient(ellipse_at_center,#0f2a44_0%,#0b0f14_75%)] px-8 text-white">
            <img
                alt=""
                className="size-[88px] rounded-[22px] shadow-[0_10px_30px_rgba(29,155,240,0.35)]"
                src="/icon-128.png"
            />
            <div>
                <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
                    DM Export for X
                </h1>
                <p className="mt-2 text-[15px] text-white/70">
                    Save your X chats, including encrypted ones.
                </p>
            </div>
        </div>
    )
}
