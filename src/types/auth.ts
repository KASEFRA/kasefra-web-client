/**
 * Authentication TypeScript Types
 * Matching the FastAPI backend response schemas
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  full_name: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  avatar_url?: string | null
  default_account_id?: string | null
  created_at: string
  updated_at: string
}

export interface UserProfileStatsResponse {
  connected_accounts: number
  active_budgets: number
  active_goals: number
  recurring_bills: number
  transactions_this_month: number
  latest_transaction_date: string | null
}

export interface UserProfileResponse {
  user: UserResponse
  stats: UserProfileStatsResponse
}

export interface UserProfileStatsResponse {
  connected_accounts: number
  active_budgets: number
  active_goals: number
  recurring_bills: number
  transactions_this_month: number
  latest_transaction_date: string | null
}

export interface UserProfileResponse {
  user: UserResponse
  stats: UserProfileStatsResponse
}

export interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  signup: (data: SignupRequest) => Promise<void>
  logout: () => void
  refreshUser: (force?: boolean) => Promise<void>
}
