import type { ComponentProps } from 'react'

import { Popover } from 'radix-ui'

import { cn } from '@/lib/utils'

const Menu = Popover.Root
const MenuAnchor = Popover.Anchor

function MenuContent({
    className,
    container,
    ...props
}: ComponentProps<typeof Popover.Content> & { container?: HTMLElement }) {
    return (
        <Popover.Portal container={container}>
            <Popover.Content
                align="end"
                className={cn(
                    'bg-background text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 z-50 min-w-60 overflow-hidden rounded-2xl py-1 font-sans',
                    'shadow-[0_0_15px_rgba(101,119,134,0.2),0_0_3px_1px_rgba(101,119,134,0.15)]',
                    'dark:shadow-[0_0_15px_rgba(255,255,255,0.2),0_0_3px_1px_rgba(255,255,255,0.15)]',
                    className
                )}
                sideOffset={8}
                {...props}
            />
        </Popover.Portal>
    )
}

function MenuItem({ className, ...props }: ComponentProps<'button'>) {
    return (
        <button
            className={cn(
                'hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.03] flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] leading-5 font-bold outline-none [&_svg]:size-[18.75px]',
                className
            )}
            type="button"
            {...props}
        />
    )
}

export { Menu, MenuAnchor, MenuContent, MenuItem }
