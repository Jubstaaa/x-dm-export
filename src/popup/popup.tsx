import { MessageSquareOff, RotateCw, Search } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SpinnerIcon } from '@/components/x-icons'

import type { EmptyStateConfig, PopupStatus } from './popup.types'

import { ChatRow } from './chat-row'
import { EmptyState } from './empty-state'
import { ExportFooter } from './export-footer'
import { useChatExporter } from './popup.hooks'

const EMPTY_STATES: Partial<Record<PopupStatus, EmptyStateConfig>> = {
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

export function Popup() {
    const {
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
    } = useChatExporter()

    const emptyState = EMPTY_STATES[status]

    return (
        <div className="flex flex-col">
            <header className="flex items-center gap-2.5 border-b px-4 py-3">
                <img alt="" className="size-7 rounded-lg" src="/icon-128.png" />
                <div className="min-w-0 flex-1">
                    <h1 className="text-[15px] leading-tight font-bold">
                        DM Export for X
                    </h1>
                    <p className="text-muted-foreground truncate text-xs">
                        {owner
                            ? `@${owner.handle} · ${chats.length} chats`
                            : 'Your chats, saved locally'}
                    </p>
                </div>
            </header>

            <main>
                {status === 'loading' && (
                    <div className="text-primary flex justify-center py-16 text-xl">
                        <SpinnerIcon />
                    </div>
                )}

                {emptyState && (
                    <EmptyState
                        config={emptyState}
                        onAction={
                            emptyState.action === 'reload'
                                ? handleReloadTab
                                : handleOpenX
                        }
                    />
                )}

                {status === 'ready' && (
                    <>
                        <div className="space-y-2 px-4 pt-3 pb-2">
                            <div className="relative">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                                <Input
                                    aria-label="Search chats"
                                    className="bg-secondary focus-visible:border-primary focus-visible:bg-background h-10 rounded-full border-transparent pl-10"
                                    onChange={event => {
                                        setQuery(event.target.value)
                                    }}
                                    placeholder="Search chats"
                                    value={query}
                                />
                            </div>
                            <div className="text-muted-foreground flex items-center justify-between px-1 text-[13px]">
                                <span>
                                    {selectedIds.size
                                        ? `${selectedIds.size} selected`
                                        : `${filteredChats.length} chats`}
                                </span>
                                <label className="flex cursor-pointer items-center gap-2">
                                    Select all
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleToggleAll}
                                    />
                                </label>
                            </div>
                        </div>

                        <ScrollArea className="h-[340px] border-y">
                            {filteredChats.map(chat => (
                                <ChatRow
                                    chat={chat}
                                    isSelected={selectedIds.has(chat.id)}
                                    key={chat.id}
                                    onToggle={handleToggleChat}
                                    ownerId={owner?.id ?? ''}
                                />
                            ))}
                            {!filteredChats.length && (
                                <p className="text-muted-foreground py-10 text-center text-sm">
                                    No chats match “{query}”.
                                </p>
                            )}
                        </ScrollArea>

                        <ExportFooter
                            exportState={exportState}
                            includeMedia={includeMedia}
                            onExport={() => void handleExport()}
                            onIncludeMediaChange={setIncludeMedia}
                            selectedCount={selectedIds.size}
                        />
                    </>
                )}
            </main>
        </div>
    )
}
