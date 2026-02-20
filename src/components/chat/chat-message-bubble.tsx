/**
 * Chat message bubble component.
 * Renders a single message from the user or AI assistant.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Wrench, Copy, Check } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Button } from '@/components/ui/button'
import { ChatConfirmationCard } from './chat-confirmation-card'
import type { MessageRole, PendingConfirmation } from '@/types/chat'

interface ChatMessageBubbleProps {
  role: MessageRole
  content: string | null
  toolsUsed?: string[]
  isStreaming?: boolean
  confirmation?: PendingConfirmation
  onConfirm?: () => void
  onCancel?: () => void
}

type MarkdownSegment =
  | { type: 'markdown'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

const TABLE_DIVIDER_REGEX =
  /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function extractMarkdownSegments(markdown: string): MarkdownSegment[] {
  const lines = markdown.split('\n')
  const segments: MarkdownSegment[] = []
  let textBuffer: string[] = []

  const flushTextBuffer = () => {
    const text = textBuffer.join('\n').trim()
    if (text) {
      segments.push({ type: 'markdown', content: text })
    }
    textBuffer = []
  }

  let index = 0
  while (index < lines.length) {
    const currentLine = lines[index]
    const nextLine = lines[index + 1]

    if (
      currentLine?.includes('|') &&
      nextLine &&
      TABLE_DIVIDER_REGEX.test(nextLine)
    ) {
      const headers = parseTableCells(currentLine)
      if (headers.length >= 2) {
        flushTextBuffer()

        index += 2
        const rows: string[][] = []

        while (index < lines.length) {
          const rowLine = lines[index]
          if (!rowLine?.trim() || !rowLine.includes('|')) break
          rows.push(parseTableCells(rowLine))
          index += 1
        }

        segments.push({ type: 'table', headers, rows })
        continue
      }
    }

    textBuffer.push(currentLine)
    index += 1
  }

  flushTextBuffer()

  if (segments.length === 0) {
    return [{ type: 'markdown', content: markdown }]
  }

  return segments
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-lg font-semibold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-base font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-foreground">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 leading-7 text-foreground/95">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 ml-5 list-disc space-y-1 marker:text-primary/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 marker:text-primary/80">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1 text-foreground/95">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-lg border-l-2 border-primary/60 bg-muted/40 px-3 py-2 text-foreground/90">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border/70" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-border/70 bg-muted/70 p-3 text-xs leading-6">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    if (className?.startsWith('language-')) {
      return (
        <code className="font-mono text-xs text-foreground">
          {children}
        </code>
      )
    }

    return (
      <code className="rounded-md border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-primary">
        {children}
      </code>
    )
  },
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
}

const inlineMarkdownComponents: Components = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[0.8em] text-primary">
      {children}
    </code>
  ),
}

export function ChatMessageBubble({
  role,
  content,
  toolsUsed,
  isStreaming = false,
  confirmation,
  onConfirm,
  onCancel,
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
          <div className="space-y-3 text-sm leading-relaxed">
            {extractMarkdownSegments(content).map((segment, segmentIndex) => {
              if (segment.type === 'markdown') {
                return (
                  <ReactMarkdown
                    key={`md-${segmentIndex}`}
                    components={markdownComponents}
                  >
                    {segment.content}
                  </ReactMarkdown>
                )
              }

              return (
                <div
                  key={`table-${segmentIndex}`}
                  className="my-3 overflow-x-auto rounded-xl border border-border/70 bg-card/80 shadow-sm"
                >
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {segment.headers.map((header, colIndex) => (
                          <th
                            key={`${header}-${colIndex}`}
                            className="border-b border-border/70 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            <ReactMarkdown components={inlineMarkdownComponents}>
                              {header}
                            </ReactMarkdown>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {segment.rows.map((row, rowIndex) => (
                        <tr
                          key={`row-${rowIndex}`}
                          className={rowIndex % 2 === 0 ? 'bg-background/80' : 'bg-muted/15'}
                        >
                          {segment.headers.map((_, colIndex) => (
                            <td
                              key={`cell-${rowIndex}-${colIndex}`}
                              className="border-b border-border/50 px-3 py-2 text-sm text-foreground"
                            >
                              <ReactMarkdown components={inlineMarkdownComponents}>
                                {row[colIndex] ?? '—'}
                              </ReactMarkdown>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
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

        {/* Inline confirmation card for pending write actions */}
        {confirmation && onConfirm && onCancel && (
          <ChatConfirmationCard
            confirmation={confirmation}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}

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
