/**
 * Chat input component.
 * Auto-growing textarea with send button.
 */

'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { SendHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VoiceInputButton } from './voice-input-button'

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
  placeholder = 'Ask Loky AI anything about your finances...',
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
    <div className="relative flex items-end gap-2 rounded-2xl border-2 bg-background px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
      <VoiceInputButton
        onTranscript={(text) => onChange(text)}
        disabled={isLoading || disabled}
      />
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
          'placeholder:text-muted-foreground/50',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-[28px] max-h-[200px] py-1.5',
        )}
      />

      {value.length > 200 && (
        <span className="absolute bottom-1 right-14 text-xs text-muted-foreground">
          {value.length}
        </span>
      )}

      {isLoading ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={onStop}
          className="h-9 w-9 shrink-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Square className="h-4 w-4 fill-current" />
          <span className="sr-only">Stop generating</span>
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            'h-9 w-9 shrink-0 rounded-xl transition-all',
            canSend && 'shadow-sm hover:shadow-md hover:scale-105'
          )}
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      )}
    </div>
  )
}
