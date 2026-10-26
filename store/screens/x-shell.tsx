import type { ReactNode } from 'react'

import {
    Bell,
    Bookmark,
    Home,
    Mail,
    MoreHorizontal,
    Search,
    User,
    Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { CHATS, OWNER } from './fake-data'

const NAV = [
    { icon: Home, label: 'Home' },
    { icon: Search, label: 'Explore' },
    { icon: Bell, label: 'Notifications' },
    { icon: Users, label: 'Follow' },
    { icon: Mail, label: 'Chat', isActive: true },
    { icon: Bookmark, label: 'Bookmarks' },
    { icon: User, label: 'Profile' },
    { icon: MoreHorizontal, label: 'More' },
]

const TIMES = [
    'now',
    '1h',
    '3h',
    '9h',
    '1d',
    '2d',
    '3d',
    '6d',
    'Oct 14',
    'Sep 22',
]

export function XShell({
    activeChatId,
    children,
}: {
    activeChatId?: string
    children?: ReactNode
}) {
    return (
        <div className="bg-background text-foreground flex h-[800px] w-[1280px] overflow-hidden font-sans">
            <nav className="flex w-[88px] flex-col items-center gap-2 border-r py-3">
                <div className="flex size-12 items-center justify-center text-[28px] font-black">
                    𝕏
                </div>
                {NAV.map(({ icon: Icon, isActive, label }) => (
                    <div
                        key={label}
                        className="hover:bg-accent flex size-12 items-center justify-center rounded-full">
                        <Icon
                            className="size-[26px]"
                            strokeWidth={isActive ? 2.6 : 1.8}
                        />
                    </div>
                ))}
                <img
                    alt=""
                    className="mt-auto size-10 rounded-full"
                    src={OWNER.avatarUrl ?? ''}
                />
            </nav>
            <aside className="flex w-[400px] flex-col border-r">
                <div className="px-4 pt-3 pb-2">
                    <h2 className="text-xl font-bold">Chat</h2>
                    <div className="bg-secondary text-muted-foreground mt-3 flex h-10 items-center gap-2 rounded-full px-4 text-sm">
                        <Search className="size-4" /> Search
                    </div>
                </div>
                {CHATS.map((chat, index) => {
                    const other = chat.participants.find(
                        user => user.id !== OWNER.id
                    )
                    return (
                        <div
                            key={chat.id}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3',
                                chat.id === activeChatId && 'bg-secondary'
                            )}>
                            <img
                                alt=""
                                className="size-12 rounded-full"
                                src={other?.avatarUrl ?? ''}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between">
                                    <span className="truncate font-bold">
                                        {chat.name}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                        {TIMES[index]}
                                    </span>
                                </div>
                                <p className="text-muted-foreground truncate text-sm">
                                    {index === 0
                                        ? 'haha same. keeping it forever'
                                        : 'Sent a post'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </aside>
            <section className="flex min-w-0 flex-1 flex-col">
                {children}
            </section>
        </div>
    )
}
