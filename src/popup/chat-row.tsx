import { memo, useMemo } from 'react'

import { Users } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import type { ChatUser } from '@/lib/chat.types'
import { cn } from '@/lib/utils'

import type { ChatRowProps } from './chat-row.types'

const relativeTime = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
    style: 'short',
})

function formatLastActivity(timestamp: number): string {
    const days = Math.round((timestamp - Date.now()) / 86_400_000)
    if (days === 0)
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
    if (days > -7) return relativeTime.format(days, 'day')
    return new Date(timestamp).toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
    })
}

function Avatar({
    className,
    user,
}: {
    className?: string
    user: ChatUser | undefined
}) {
    if (!user?.avatarUrl) {
        return (
            <div
                className={cn(
                    'bg-secondary flex items-center justify-center rounded-full',
                    className
                )}>
                <Users className="text-muted-foreground size-4" />
            </div>
        )
    }
    return (
        <img
            alt=""
            className={cn('rounded-full object-cover', className)}
            src={user.avatarUrl}
        />
    )
}

export const ChatRow = memo(function ChatRow({
    chat,
    isSelected,
    ownerId,
    onToggle,
}: ChatRowProps) {
    const others = useMemo(
        () => chat.participants.filter(user => user.id !== ownerId),
        [chat.participants, ownerId]
    )
    const subtitle = chat.isGroup
        ? `${chat.participants.length} people`
        : `@${others[0]?.handle ?? ''}`

    return (
        <label
            className={cn(
                'hover:bg-accent flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
                isSelected && 'bg-primary/5 hover:bg-primary/10'
            )}>
            {chat.isGroup ? (
                <div className="relative size-10 shrink-0">
                    <Avatar
                        className="absolute top-0 left-0 size-7"
                        user={others[0]}
                    />
                    <Avatar
                        className="ring-background absolute right-0 bottom-0 size-7 ring-2"
                        user={others[1]}
                    />
                </div>
            ) : (
                <Avatar
                    className="size-10 shrink-0"
                    user={others[0] ?? chat.participants[0]}
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-[15px] font-bold">
                        {chat.name}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[13px]">
                        · {formatLastActivity(chat.lastAt)}
                    </span>
                </div>
                <p className="text-muted-foreground truncate text-[13px]">
                    {subtitle} · {chat.messageCount.toLocaleString()} messages
                </p>
            </div>
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(chat.id)}
            />
        </label>
    )
})
