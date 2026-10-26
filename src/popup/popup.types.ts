import type { LucideIcon } from 'lucide-react'

export type PopupStatus =
    'loading' | 'not-on-x' | 'reload-needed' | 'no-database' | 'ready'

export type ExportState =
    | { type: 'idle' }
    | { current: number; total: number; type: 'exporting' }
    | { count: number; type: 'done' }
    | { message: string; type: 'error' }

export interface EmptyStateConfig {
    action: 'open-x' | 'reload'
    actionLabel: string
    icon: LucideIcon
    text: string
}
