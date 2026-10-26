import type { ComponentProps } from 'react'

import type { ExportStatus } from '@/lib/chat.types'

import { AlertIcon, CheckIcon, DownloadIcon, SpinnerIcon } from './x-icons'

const STATUS_ICONS = {
    done: CheckIcon,
    error: AlertIcon,
    exporting: SpinnerIcon,
    idle: DownloadIcon,
}

const STATUS_COLORS: Partial<Record<ExportStatus, string>> = {
    done: '#1d9bf0',
    error: '#f4212e',
}

export function ExportStatusIcon({
    status,
    ...props
}: ComponentProps<'svg'> & { status: ExportStatus }) {
    const Icon = STATUS_ICONS[status]
    return <Icon color={STATUS_COLORS[status]} {...props} />
}
