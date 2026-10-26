import type { ExportState } from './popup.types'

export interface ExportFooterProps {
    exportState: ExportState
    includeMedia: boolean
    selectedCount: number
    onExport: () => void
    onIncludeMediaChange: (includeMedia: boolean) => void
}
