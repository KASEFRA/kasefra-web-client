/**
 * AI Chat Dashboard Page
 * Full chat interface with streaming, session management, and welcome screen.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, Bot, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import {
  ChatMessageBubble,
  ChatInput,
  ChatSessionList,
  ChatWelcome,
} from '@/components/chat'
import { aiChatApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ChatMessage, ChatSession, PendingConfirmation, SSEEvent } from '@/types/chat'

// Message type used locally (extends backend type with streaming state)
interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string | null
  toolsUsed?: string[]
  isStreaming?: boolean
  confirmation?: PendingConfirmation
}

const SCROLL_BOTTOM_THRESHOLD = 96

export default function ChatPage() {
  // ── State ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [, setIsLoadingSessions] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const hasMessages = messages.length > 0
  const activeSessionTitle = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId)?.title || 'Loky AI'
    : 'New Conversation'

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesScrollRootRef = useRef<HTMLDivElement | null>(null)

  // ── Auto-scroll ───────────────────────────────────────────

  const getMessagesViewport = useCallback(() => {
    return (
      messagesScrollRootRef.current?.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]',
      ) || null
    )
  }, [])

  const isViewportNearBottom = useCallback((viewport: HTMLDivElement) => {
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD
  }, [])

  const updateIsAtBottom = useCallback(() => {
    const viewport = getMessagesViewport()
    if (!viewport) {
      setIsAtBottom(true)
      return
    }
    setIsAtBottom(isViewportNearBottom(viewport))
  }, [getMessagesViewport, isViewportNearBottom])

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const viewport = getMessagesViewport()
      if (!viewport) return

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      })
      setIsAtBottom(true)
    },
    [getMessagesViewport],
  )

  useEffect(() => {
    if (!hasMessages) {
      setIsAtBottom(true)
      return
    }

    const viewport = getMessagesViewport()
    if (!viewport) return

    const handleScroll = () => {
      setIsAtBottom(isViewportNearBottom(viewport))
    }

    handleScroll()
    viewport.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [getMessagesViewport, hasMessages, isViewportNearBottom])

  useEffect(() => {
    if (!hasMessages) return

    if (isAtBottom) {
      scrollMessagesToBottom(isLoading ? 'auto' : 'smooth')
      return
    }

    updateIsAtBottom()
  }, [
    hasMessages,
    isAtBottom,
    isLoading,
    messages,
    scrollMessagesToBottom,
    updateIsAtBottom,
  ])

  // ── Load sessions on mount ────────────────────────────────

  const loadSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true)
      const response = await aiChatApi.getSessions()
      setSessions(response.sessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // ── Load messages for a session ───────────────────────────

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoadingMessages(true)
      const session = await aiChatApi.getSession(sessionId)
      const displayMessages: DisplayMessage[] = session.messages
        .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
        .map((m: ChatMessage) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          toolsUsed: undefined,
        }))
      setMessages(displayMessages)
      setActiveSessionId(sessionId)
      setIsAtBottom(true)
    } catch (error) {
      console.error('Failed to load session messages:', error)
      toast.error('Failed to load conversation')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // ── Select session ────────────────────────────────────────

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) return
      loadSessionMessages(sessionId)
      setShowSidebar(false)
    },
    [activeSessionId, loadSessionMessages],
  )

  // ── New chat ──────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
    setInputValue('')
    setShowSidebar(false)
    setIsAtBottom(true)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.focus()
        }
      }

      // Cmd/Ctrl + N - New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        handleNewChat()
      }

      // Esc - Clear input
      if (e.key === 'Escape') {
        const textarea = document.querySelector('textarea')
        if (textarea && document.activeElement === textarea && !inputValue) {
          textarea.blur()
        } else if (inputValue) {
          setInputValue('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewChat, inputValue])

  // ── Core streaming function (shared by handleSend & handleWelcomePrompt) ──

  const streamChat = useCallback(
    async (message: string, currentSessionId: string | null, initialMessages?: DisplayMessage[]) => {
      setIsLoading(true)

      const userMsg: DisplayMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: message,
      }
      const assistantMsg: DisplayMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: null,
        isStreaming: true,
        toolsUsed: [],
      }

      if (initialMessages) {
        setMessages([...initialMessages, userMsg, assistantMsg])
      } else {
        setMessages((prev) => [...prev, userMsg, assistantMsg])
      }
      requestAnimationFrame(() => {
        scrollMessagesToBottom('smooth')
      })

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        let streamContent = ''
        const toolsUsed: string[] = []

        for await (const event of aiChatApi.streamMessage(
          message,
          currentSessionId,
          abortController.signal,
        )) {
          const sseEvent = event as SSEEvent

          switch (sseEvent.type) {
            case 'session':
              if (!currentSessionId) {
                setActiveSessionId(sseEvent.data.session_id)
              }
              break

            case 'token':
              streamContent += sseEvent.data.content
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: streamContent,
                    isStreaming: true,
                  }
                }
                return updated
              })
              break

            case 'tool':
              toolsUsed.push(sseEvent.data.tool)
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    toolsUsed: [...toolsUsed],
                  }
                }
                return updated
              })
              break

            case 'done':
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: streamContent || 'I could not generate a response.',
                    isStreaming: false,
                    toolsUsed: sseEvent.data.tools_used,
                  }
                }
                return updated
              })
              break

            case 'confirmation_required': {
              const confirmData = sseEvent.data
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    isStreaming: false,
                    confirmation: {
                      actionId: confirmData.action_id,
                      actionType: confirmData.action_type,
                      summary: confirmData.summary,
                      details: confirmData.details,
                      status: 'pending',
                    },
                  }
                }
                return updated
              })
              break
            }

            case 'error':
              toast.error(sseEvent.data.error || 'An error occurred')
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: 'Sorry, something went wrong. Please try again.',
                    isStreaming: false,
                  }
                }
                return updated
              })
              break
          }
        }

        loadSessions()
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content || 'Generation stopped.',
                isStreaming: false,
              }
            }
            return updated
          })
        } else {
          console.error('Chat stream error:', error)
          toast.error('Failed to send message. Please try again.')
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (
              updated[lastIdx]?.role === 'assistant' &&
              !updated[lastIdx].content
            ) {
              updated.pop()
            }
            return updated
          })
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [loadSessions, scrollMessagesToBottom],
  )

  // ── Send message (streaming) ──────────────────────────────

  const handleSend = useCallback(async () => {
    const message = inputValue.trim()
    if (!message || isLoading) return
    setInputValue('')
    await streamChat(message, activeSessionId)
  }, [inputValue, isLoading, activeSessionId, streamChat])

  // ── Stop generation ───────────────────────────────────────

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  // ── Send from welcome prompt ──────────────────────────────

  const handleWelcomePrompt = useCallback(
    (prompt: string) => {
      void streamChat(prompt, null, [])
    },
    [streamChat],
  )

  // ── Confirm / Cancel pending write actions ────────────────

  const handleConfirm = useCallback(
    async (actionId: string, messageId: string) => {
      if (!activeSessionId) return

      // Transition card to "confirming" state immediately
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.confirmation
            ? { ...m, confirmation: { ...m.confirmation, status: 'confirming' as const } }
            : m,
        ),
      )

      try {
        for await (const event of aiChatApi.confirmAction(actionId, true, activeSessionId)) {
          if (event.type === 'action_result') {
            // Mark the confirmation card as executed
            setMessages((prev) => {
              const updated = prev.map((m) =>
                m.id === messageId && m.confirmation
                  ? { ...m, confirmation: { ...m.confirmation, status: 'executed' as const } }
                  : m,
              )
              // Append result as a follow-up assistant message
              const resultMsg: DisplayMessage = {
                id: `result-${Date.now()}`,
                role: 'assistant',
                content: event.data.message,
              }
              return [...updated, resultMsg]
            })
          } else if (event.type === 'error') {
            toast.error(event.data.error || 'Action failed')
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId && m.confirmation
                  ? { ...m, confirmation: { ...m.confirmation, status: 'pending' as const } }
                  : m,
              ),
            )
          }
        }
      } catch {
        toast.error('Failed to confirm action. Please try again.')
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.confirmation
              ? { ...m, confirmation: { ...m.confirmation, status: 'pending' as const } }
              : m,
          ),
        )
      }
    },
    [activeSessionId],
  )

  const handleCancel = useCallback(
    async (actionId: string, messageId: string) => {
      if (!activeSessionId) return

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.confirmation
            ? { ...m, confirmation: { ...m.confirmation, status: 'cancelled' as const } }
            : m,
        ),
      )

      try {
        // Consume the SSE stream so the backend receives the request
        // and cleans up the pending action. No UI updates needed — the
        // card is already showing "cancelled".
        const gen = aiChatApi.confirmAction(actionId, false, activeSessionId)
        let next = await gen.next()
        while (!next.done) {
          next = await gen.next()
        }
      } catch {
        // Cancellation failures are non-critical — card already shows cancelled
      }
    },
    [activeSessionId],
  )

  // ── Session management handlers ───────────────────────────

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      try {
        await aiChatApi.updateSession(sessionId, { title })
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
        )
        toast.success('Conversation renamed')
      } catch {
        toast.error('Failed to rename conversation')
      }
    },
    [],
  )

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await aiChatApi.deleteSession(sessionId)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        if (activeSessionId === sessionId) {
          setActiveSessionId(null)
          setMessages([])
        }
        toast.success('Conversation deleted')
      } catch {
        toast.error('Failed to delete conversation')
      }
    },
    [activeSessionId],
  )

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Main chat area */}
      <div className="flex min-h-0 flex-1 flex-col min-w-0 order-1 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b px-4 py-3 bg-card/50">
          {/* Mobile session panel trigger */}
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Chat history</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat History</SheetTitle>
              </SheetHeader>
              <ChatSessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bot className="h-5 w-5 text-primary flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <h1
                  className="flex-1 min-w-0 truncate text-sm font-semibold leading-6"
                  title={activeSessionTitle}
                >
                  {activeSessionTitle}
                </h1>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs break-words">
                {activeSessionTitle}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages area */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isLoadingMessages ? (
            <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto animate-pulse">
              {/* Message skeletons */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    i % 2 === 0 ? 'justify-start' : 'justify-end'
                  )}
                >
                  {i % 2 === 0 && <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />}
                  <div
                    className={cn(
                      'h-20 rounded-2xl bg-muted',
                      i % 2 === 0 ? 'w-2/3' : 'w-1/2'
                    )}
                  />
                  {i % 2 !== 0 && <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />}
                </div>
              ))}
            </div>
          ) : !hasMessages ? (
            <ScrollArea className="h-full">
              <ChatWelcome onSendPrompt={handleWelcomePrompt} />
            </ScrollArea>
          ) : (
            <div ref={messagesScrollRootRef} className="h-full">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-4 pb-2 max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <ChatMessageBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      toolsUsed={msg.toolsUsed}
                      isStreaming={msg.isStreaming}
                      confirmation={msg.confirmation}
                      onConfirm={
                        msg.confirmation
                          ? () => handleConfirm(msg.confirmation!.actionId, msg.id)
                          : undefined
                      }
                      onCancel={
                        msg.confirmation
                          ? () => handleCancel(msg.confirmation!.actionId, msg.id)
                          : undefined
                      }
                    />
                  ))}

                  {/* Typing indicator */}
                  {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3 animate-fade-in-up">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                        <Image
                          src="/loky.png"
                          alt="Loky AI"
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Loky is thinking</span>
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {hasMessages && !isLoadingMessages && !isAtBottom && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => scrollMessagesToBottom('smooth')}
                aria-label="Jump to latest message"
                className="pointer-events-auto h-8 rounded-full border bg-background/95 px-3 shadow-sm backdrop-blur"
              >
                <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
                Jump to latest
              </Button>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-card/50 px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Desktop sidebar for sessions - moved to right */}
      <div className="hidden lg:flex w-72 min-h-0 flex-col border-l bg-card/50 order-2 overflow-hidden">
        <ChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  )
}
