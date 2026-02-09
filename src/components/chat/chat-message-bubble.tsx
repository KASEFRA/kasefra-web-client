/**
 * Chat message bubble component.
 * Renders a single message from the user or AI assistant.
 */

'use client'

import { Bot, User, Wrench } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
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

  if (role === 'tool') return null

  return (
    <div
      className={cn(
        'flex gap-3 w-full',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {/* Tool usage indicator */}
        {!isUser && toolsUsed && toolsUsed.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Wrench className="h-3 w-3" />
            <span>
              Used: {toolsUsed.map(t => t.replace(/_/g, ' ')).join(', ')}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md',
          )}
        >
          {content ? (
            isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-xs prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )
          ) : isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
            </div>
          ) : null}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground">
            <User className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  )
}
