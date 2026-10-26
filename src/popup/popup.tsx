import { Search } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SpinnerIcon } from '@/components/x-icons'

import { ChatRow } from './chat-row'
import { EmptyState } from './empty-state'
import { ExportFooter } from './export-footer'
import { EMPTY_STATES } from './popup.constants'
import { useChatExporter } from './popup.hooks'

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
                                className="bg-secondary focus-visible:border-primary focus-visible:bg-background h-10 rounded-full border-transparent pl-10"
                                placeholder="Search chats"
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                            />
                        </div>
                        <label className="text-muted-foreground flex cursor-pointer items-center justify-between px-1 text-[13px]">
                            <span>
                                {selectedIds.size
                                    ? `${selectedIds.size} selected`
                                    : `${filteredChats.length} chats`}
                            </span>
                            <span className="flex items-center gap-2">
                                Select all
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={handleToggleAll}
                                />
                            </span>
                        </label>
                    </div>

                    <ScrollArea className="h-[340px] border-y">
                        {filteredChats.map(chat => (
                            <ChatRow
                                key={chat.id}
                                chat={chat}
                                isSelected={selectedIds.has(chat.id)}
                                ownerId={owner?.id ?? ''}
                                onToggle={handleToggleChat}
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
                        selectedCount={selectedIds.size}
                        onExport={() => void handleExport()}
                        onIncludeMediaChange={setIncludeMedia}
                    />
                </>
            )}
        </div>
    )
}
