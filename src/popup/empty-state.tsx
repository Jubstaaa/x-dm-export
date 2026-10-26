import { Button } from '@/components/ui/button'

import type { EmptyStateProps } from './empty-state.types'

export function EmptyState({ config, onAction }: EmptyStateProps) {
    const { actionLabel, icon: Icon, text } = config
    return (
        <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
            <Icon className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm leading-relaxed">
                {text}
            </p>
            <Button onClick={onAction}>{actionLabel}</Button>
        </div>
    )
}
