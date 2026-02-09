/**
 * Chat input component.
 * Auto-growing textarea with send button.
 */

'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { SendHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask Kasefra AI anything about your finances...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [value])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSend()
      }
    }
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm leading-relaxed',
          'placeholder:text-muted-foreground/60',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-[24px] max-h-[200px] py-1',
        )}
      />

      {isLoading ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={onStop}
          className="h-8 w-8 shrink-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Square className="h-4 w-4 fill-current" />
          <span className="sr-only">Stop generating</span>
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          className="h-8 w-8 shrink-0 rounded-xl"
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      )}
    </div>
  )
}
