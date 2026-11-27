import type { LucideIcon } from 'lucide-react'

export interface EmptyStateConfig {
    action: 'open-x' | 'reload'
    actionLabel: string
    icon: LucideIcon
    text: string
}

export type ExportState =
    | { current: number; total: number; type: 'exporting' }
    | { fileName: string; type: 'done' }
    | { message: string; type: 'error' }
    | { type: 'idle' }

export type PopupStatus =
    'loading' | 'no-database' | 'not-on-x' | 'ready' | 'reload-needed'
