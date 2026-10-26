import { ExportStatusIcon } from '@/components/export-status-icon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import type { ExportFooterProps } from './export-footer.types'

export function ExportFooter({
    exportState,
    includeMedia,
    selectedCount,
    onExport,
    onIncludeMediaChange,
}: ExportFooterProps) {
    const isExporting = exportState.type === 'exporting'

    return (
        <footer className="space-y-3 px-4 py-3">
            {exportState.type === 'exporting' && (
                <div className="space-y-1.5">
                    <Progress
                        className="h-1"
                        value={(exportState.current / exportState.total) * 100}
                    />
                    <p className="text-muted-foreground text-xs">
                        Exporting {exportState.current}/{exportState.total}…
                    </p>
                </div>
            )}
            {(exportState.type === 'done' || exportState.type === 'error') && (
                <p
                    className={cn(
                        'flex items-center gap-1.5 text-xs',
                        exportState.type === 'done'
                            ? 'text-primary'
                            : 'text-destructive'
                    )}>
                    <ExportStatusIcon status={exportState.type} />
                    {exportState.type === 'done'
                        ? `Exported ${exportState.count} chat${exportState.count > 1 ? 's' : ''}. Check your downloads.`
                        : exportState.message}
                </p>
            )}
            <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-[13px]">
                    <Switch
                        checked={includeMedia}
                        onCheckedChange={onIncludeMediaChange}
                    />
                    Include media
                </label>
                <Button
                    className="px-5"
                    disabled={!selectedCount || isExporting}
                    onClick={onExport}>
                    <ExportStatusIcon
                        status={isExporting ? 'exporting' : 'idle'}
                    />
                    Export{selectedCount ? ` ${selectedCount}` : ''}
                </Button>
            </div>
            <p className="text-muted-foreground text-[11px] leading-snug">
                Includes messages your browser has loaded. Scroll to the top of
                a chat on X to load older history.
            </p>
        </footer>
    )
}
