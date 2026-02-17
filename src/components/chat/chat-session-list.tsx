/**
 * Chat session list component.
 * Displays chat history with session management (rename, delete).
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import {
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/types/chat'

const SESSION_SCROLL_THRESHOLD = 8

interface ChatSessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onRenameSession: (sessionId: string, title: string) => void
  onDeleteSession: (sessionId: string) => void
}

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  isEditing: boolean
  editTitle: string
  onSelect: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onEditTitleChange: (value: string) => void
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditTitleChange,
}: SessionItemProps) {
  return (
    <div
      className={cn(
        'group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all',
        isActive
          ? 'bg-primary/15 text-primary font-medium shadow-[0_0_0_1px_rgb(var(--primary)/0.2),0_1px_2px_0_rgb(0_0_0/0.05)]'
          : 'hover:bg-accent/50 text-foreground hover:shadow-sm',
      )}
      onClick={onSelect}
    >
      {isEditing ? (
        <div
          className="col-span-2 flex min-w-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
            className="h-6 text-xs"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onSaveEdit}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onCancelEdit}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="min-w-0 overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block w-full truncate text-sm leading-5" title={session.title}>
                  {session.title}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs break-words">
                {session.title}
              </TooltipContent>
            </Tooltip>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              {session.last_message_at
                ? formatDistanceToNow(new Date(session.last_message_at), {
                    addSuffix: true,
                  })
                : formatDistanceToNow(new Date(session.created_at), {
                    addSuffix: true,
                  })}
            </p>
          </div>

          {/* Action buttons — visible on hover */}
          <div
            className="flex h-6 w-[3.25rem] shrink-0 items-center justify-end gap-0.5 rounded px-0.5 opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onStartEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
}: ChatSessionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const sessionsViewportRef = useRef<HTMLDivElement | null>(null)

  const updateScrollAffordance = useCallback(() => {
    const viewport = sessionsViewportRef.current
    if (!viewport) {
      setCanScrollUp(false)
      setCanScrollDown(false)
      return
    }

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
    setCanScrollUp(viewport.scrollTop > SESSION_SCROLL_THRESHOLD)
    setCanScrollDown(maxScrollTop - viewport.scrollTop > SESSION_SCROLL_THRESHOLD)
  }, [])

  useEffect(() => {
    const viewport = sessionsViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      updateScrollAffordance()
    }

    handleScroll()
    viewport.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [updateScrollAffordance, sessions.length])

  useEffect(() => {
    updateScrollAffordance()
  }, [sessions.length, editingId, updateScrollAffordance])

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.last_message_at || session.created_at)
    let category = 'older'

    if (isToday(date)) {
      category = 'today'
    } else if (isYesterday(date)) {
      category = 'yesterday'
    } else if (isThisWeek(date)) {
      category = 'thisWeek'
    }

    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(session)
    return groups
  }, {} as Record<string, ChatSession[]>)

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteSession(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header with New Chat button */}
      <div className="px-3 py-2 border-b">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Header with conversation count */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b">
        <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          Recent
        </p>
        <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </div>

      {/* Session list */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={sessionsViewportRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col px-3 py-2">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              <>
                {groupedSessions.today && groupedSessions.today.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-[11px] font-medium text-muted-foreground/60 px-2 mb-1.5">Today</h3>
                    <div className="flex flex-col gap-0.5">
                      {groupedSessions.today.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          isEditing={editingId === session.id}
                          editTitle={editTitle}
                          onSelect={() => editingId !== session.id && onSelectSession(session.id)}
                          onStartEdit={() => handleStartEdit(session)}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onDelete={() => setDeleteId(session.id)}
                          onEditTitleChange={setEditTitle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedSessions.yesterday && groupedSessions.yesterday.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-[11px] font-medium text-muted-foreground/60 px-2 mb-1.5">Yesterday</h3>
                    <div className="flex flex-col gap-0.5">
                      {groupedSessions.yesterday.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          isEditing={editingId === session.id}
                          editTitle={editTitle}
                          onSelect={() => editingId !== session.id && onSelectSession(session.id)}
                          onStartEdit={() => handleStartEdit(session)}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onDelete={() => setDeleteId(session.id)}
                          onEditTitleChange={setEditTitle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedSessions.thisWeek && groupedSessions.thisWeek.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-[11px] font-medium text-muted-foreground/60 px-2 mb-1.5">This Week</h3>
                    <div className="flex flex-col gap-0.5">
                      {groupedSessions.thisWeek.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          isEditing={editingId === session.id}
                          editTitle={editTitle}
                          onSelect={() => editingId !== session.id && onSelectSession(session.id)}
                          onStartEdit={() => handleStartEdit(session)}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onDelete={() => setDeleteId(session.id)}
                          onEditTitleChange={setEditTitle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedSessions.older && groupedSessions.older.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-[11px] font-medium text-muted-foreground/60 px-2 mb-1.5">Older</h3>
                    <div className="flex flex-col gap-0.5">
                      {groupedSessions.older.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          isEditing={editingId === session.id}
                          editTitle={editTitle}
                          onSelect={() => editingId !== session.id && onSelectSession(session.id)}
                          onStartEdit={() => handleStartEdit(session)}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onDelete={() => setDeleteId(session.id)}
                          onEditTitleChange={setEditTitle}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background via-background/90 to-transparent transition-opacity duration-200',
            canScrollUp ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/90 to-transparent transition-opacity duration-200',
            canScrollDown ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
