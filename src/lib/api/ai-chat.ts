/**
 * AI Chat API module
 * Handles chat messaging (with SSE streaming) and session management.
 */

import { apiClient } from './client'
import { getAccessToken } from '@/lib/auth/session'
import type {
  ChatResponse,
  ChatSession,
  ChatSessionDetail,
  ChatSessionListResponse,
  ChatSessionUpdateRequest,
  SSEEvent,
} from '@/types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

// ── Chat Endpoints ──────────────────────────────────────────────

/**
 * Send a chat message and get a complete (non-streaming) response.
 */
export async function sendMessage(
  message: string,
  sessionId?: string | null,
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', {
    message,
    session_id: sessionId ?? null,
  })
  return data
}

/**
 * Send a chat message with Server-Sent Events streaming.
 *
 * Uses native fetch (not axios) because axios doesn't support ReadableStream.
 * Yields parsed SSE events as they arrive.
 */
export async function* streamMessage(
  message: string,
  sessionId?: string | null,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const token = getAccessToken()
  const url = `${API_URL}/api/${API_VERSION}/ai/chat/stream`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      session_id: sessionId ?? null,
    }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Chat stream error (${response.status}): ${errorBody}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || ''

      let currentEvent = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6))
            yield { type: currentEvent, data } as SSEEvent
          } catch {
            // Skip malformed JSON
          }
          currentEvent = ''
        } else if (line === '') {
          // Empty line is SSE event separator
          currentEvent = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── Session Endpoints ───────────────────────────────────────────

/**
 * List all chat sessions for the current user.
 */
export async function getSessions(
  includeInactive = false,
  limit = 50,
  offset = 0,
): Promise<ChatSessionListResponse> {
  const { data } = await apiClient.get<ChatSessionListResponse>('/ai/sessions', {
    params: { include_inactive: includeInactive, limit, offset },
  })
  return data
}

/**
 * Get a specific chat session with all its messages.
 */
export async function getSession(sessionId: string): Promise<ChatSessionDetail> {
  const { data } = await apiClient.get<ChatSessionDetail>(`/ai/sessions/${sessionId}`)
  return data
}

/**
 * Update a chat session (rename or archive).
 */
export async function updateSession(
  sessionId: string,
  update: ChatSessionUpdateRequest,
): Promise<ChatSession> {
  const { data } = await apiClient.put<ChatSession>(`/ai/sessions/${sessionId}`, update)
  return data
}

/**
 * Delete a chat session and all its messages.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/ai/sessions/${sessionId}`)
}

// ── Grouped Export ──────────────────────────────────────────────

export const aiChatApi = {
  sendMessage,
  streamMessage,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
}
