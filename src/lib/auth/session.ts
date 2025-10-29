/**
 * Session Management using sessionStorage
 * Tokens are cleared when the browser tab/window is closed
 */

import type { UserResponse } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined'

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (!isBrowser) return
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const getAccessToken = (): string | null => {
  if (!isBrowser) return null
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  if (!isBrowser) return null
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setUser = (user: UserResponse): void => {
  if (!isBrowser) return
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = (): UserResponse | null => {
  if (!isBrowser) return null
  const userStr = sessionStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as UserResponse
  } catch {
    return null
  }
}

export const clearTokens = (): void => {
  if (!isBrowser) return
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export const isAuthenticated = (): boolean => {
  return !!getAccessToken()
}
