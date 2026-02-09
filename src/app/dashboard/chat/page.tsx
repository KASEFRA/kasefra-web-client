/**
 * AI Chat Dashboard Page
 * Full chat interface with streaming, session management, and welcome screen.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, PanelLeft, Loader2 } from 'lucide-react'
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

import {
  ChatMessageBubble,
  ChatInput,
  ChatSessionList,
  ChatWelcome,
} from '@/components/chat'
import { aiChatApi } from '@/lib/api'
import type { ChatMessage, ChatSession, SSEEvent } from '@/types/chat'

// Message type used locally (extends backend type with streaming state)
interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string | null
  toolsUsed?: string[]
  isStreaming?: boolean
}

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

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // ── Auto-scroll ───────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    // Small delay to let DOM update
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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
  }, [])

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
    [loadSessions],
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

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Desktop sidebar for sessions */}
      <div className="hidden lg:flex w-72 flex-col border-r bg-card/50">
        <ChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
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
            <SheetContent side="left" className="w-72 p-0">
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
            <h1 className="font-semibold truncate">
              {activeSessionId
                ? sessions.find((s) => s.id === activeSessionId)?.title ||
                  'AI Chat'
                : 'New Conversation'}
            </h1>
          </div>

          {/* New chat button (desktop) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="hidden lg:flex gap-1.5 text-xs"
            disabled={!hasMessages}
          >
            New Chat
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !hasMessages ? (
            <ScrollArea className="h-full">
              <ChatWelcome onSendPrompt={handleWelcomePrompt} />
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="flex flex-col gap-4 p-4 pb-2 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    toolsUsed={msg.toolsUsed}
                    isStreaming={msg.isStreaming}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-card/50 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
            />
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              AI responses may not always be accurate. Always verify important financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
