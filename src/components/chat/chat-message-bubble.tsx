/**
 * Chat message bubble component.
 * Renders a single message from the user or AI assistant.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Wrench, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import type { MessageRole } from '@/types/chat'

interface ChatMessageBubbleProps {
  role: MessageRole
  content: string | null
  toolsUsed?: string[]
  isStreaming?: boolean
}

export function ChatMessageBubble({
  role,
  content,
  toolsUsed,
  isStreaming = false,
}: ChatMessageBubbleProps) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  if (role === 'tool') return null

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // User message — right-aligned bubble, no avatar
  if (isUser) {
    return (
      <div className="flex w-full animate-fade-in-up justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    )
  }

  // Assistant message — left-aligned, no bubble, full-width feel
  return (
    <div className="flex gap-3 w-full animate-fade-in-up group">
      {/* Loky avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
          <Image
            src="/loky.png"
            alt="Loky AI"
            width={28}
            height={28}
            className="object-cover"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Tool usage indicator — chip style */}
        {toolsUsed && toolsUsed.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 bg-muted/50 rounded-full px-2 py-0.5">
              <Wrench className="h-2.5 w-2.5" />
              <span>{toolsUsed.map(t => t.replace(/_/g, ' ')).join(', ')}</span>
            </div>
          </div>
        )}

        {/* Message content — no bubble for assistant */}
        {content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-p:my-1.5 prose-p:leading-relaxed
            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
            prose-headings:my-3 prose-headings:font-semibold
            prose-pre:my-3 prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:relative
            prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-primary
            prose-a:text-primary prose-a:underline prose-a:underline-offset-2
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-0.5 prose-blockquote:rounded-r-lg
            prose-strong:font-semibold prose-strong:text-foreground
            prose-table:my-3 prose-th:bg-muted/50 prose-th:px-3 prose-th:py-1.5
            prose-td:px-3 prose-td:py-1.5 prose-td:border-border
            text-sm leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
            </div>
            <span className="text-xs">Thinking...</span>
          </div>
        ) : null}

        {/* Message actions — copy with feedback */}
        {content && !isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
