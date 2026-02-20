/**
 * TypeScript type definitions for AI Chat module
 * Matches backend schemas from ai_chat/schemas.py
 */

// ===== Chat Message Types =====

export type MessageRole = 'user' | 'assistant' | 'tool'

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string | null
  tool_calls: Record<string, unknown> | null
  tool_results: Record<string, unknown> | null
  tokens_used: number | null
  created_at: string
}

// ===== Chat Session Types =====

export interface ChatSession {
  id: string
  title: string
  is_active: boolean
  last_message_at: string | null
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatSessionDetail {
  id: string
  title: string
  is_active: boolean
  last_message_at: string | null
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

export interface ChatSessionListResponse {
  sessions: ChatSession[]
  total_count: number
}

// ===== Request Types =====

export interface ChatMessageRequest {
  message: string
  session_id?: string | null
}

export interface ChatSessionUpdateRequest {
  title?: string | null
  is_active?: boolean | null
}

// ===== Response Types =====

export interface ChatResponse {
  session_id: string
  message: ChatMessage
  tools_used: string[]
}

// ===== SSE Stream Event Types =====

export interface SSESessionEvent {
  session_id: string
}

export interface SSETokenEvent {
  content: string
}

export interface SSEToolEvent {
  tool: string
}

export interface SSEDoneEvent {
  tools_used: string[]
}

export interface SSEErrorEvent {
  error: string
}

export interface SSEConfirmationEvent {
  action_id: string
  action_type: string
  summary: string
  details: Record<string, string>
}

export interface SSEActionResultEvent {
  action_id: string
  success: boolean
  message: string
}

export type SSEEvent =
  | { type: 'session'; data: SSESessionEvent }
  | { type: 'token'; data: SSETokenEvent }
  | { type: 'tool'; data: SSEToolEvent }
  | { type: 'done'; data: SSEDoneEvent }
  | { type: 'error'; data: SSEErrorEvent }
  | { type: 'confirmation_required'; data: SSEConfirmationEvent }
  | { type: 'action_result'; data: SSEActionResultEvent }

// ===== Pending Confirmation (frontend UI state) =====

export type ConfirmationStatus = 'pending' | 'confirming' | 'cancelled' | 'executed'

export interface PendingConfirmation {
  actionId: string
  actionType: string
  summary: string
  details: Record<string, string>
  status: ConfirmationStatus
}
