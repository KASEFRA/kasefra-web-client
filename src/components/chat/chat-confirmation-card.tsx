/**
 * ChatConfirmationCard
 *
 * Inline card rendered inside an AI assistant message bubble when the agent
 * proposes a write action (create transaction, add goal contribution, etc.).
 *
 * States:
 *   pending    — shows Confirm / Cancel buttons
 *   confirming — shows a spinner while the action executes
 *   executed   — shows a success indicator
 *   cancelled  — shows a muted "Cancelled" label
 */

'use client'

import { CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PendingConfirmation } from '@/types/chat'

interface ChatConfirmationCardProps {
  confirmation: PendingConfirmation
  onConfirm: () => void
  onCancel: () => void
}

export function ChatConfirmationCard({
  confirmation,
  onConfirm,
  onCancel,
}: ChatConfirmationCardProps) {
  const { status, summary, details } = confirmation

  const isPending = status === 'pending'
  const isConfirming = status === 'confirming'
  const isExecuted = status === 'executed'
  const isCancelled = status === 'cancelled'

  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 space-y-2.5 max-w-sm text-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        {isExecuted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        ) : isCancelled ? (
          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
        )}
        <span className="font-semibold text-foreground text-xs uppercase tracking-wide">
          {isExecuted
            ? 'Action completed'
            : isCancelled
              ? 'Cancelled'
              : 'Confirmation required'}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-foreground/90 leading-snug">{summary}</p>

      {/* Details table */}
      {Object.keys(details).length > 0 && (
        <div className="rounded-lg bg-background/60 border border-border/50 divide-y divide-border/30">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center px-2.5 py-1.5 gap-3">
              <span className="text-xs text-muted-foreground flex-shrink-0">{key}</span>
              <span className="text-xs font-medium text-foreground text-right truncate max-w-[160px]">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-2 pt-0.5">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onConfirm}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs text-muted-foreground"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}

      {isConfirming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Processing…</span>
        </div>
      )}
    </div>
  )
}
