'use client'

/**
 * Authentication Context Provider
 * Manages global authentication state and provides auth functions
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api/auth'
import { setTokens, clearTokens, isAuthenticated, setUser as setStoredUser, getUser as getStoredUser } from '@/lib/auth/session'
import type { AuthContextType, UserResponse, LoginRequest, SignupRequest } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user on mount
  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async (force = false) => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Check if authenticated
    if (isAuthenticated()) {
      try {
        // Try to get user from sessionStorage first
        const storedUser = getStoredUser()
        if (storedUser && !force) {
          setUser(storedUser)
          setLoading(false)
          return
        }

        // If not in storage, fetch from API
        const userData = await authAPI.getCurrentUser()
        setUser(userData)
        setStoredUser(userData)
      } catch (error) {
        console.error('Failed to load user:', error)
        clearTokens()
      }
    }
    setLoading(false)
  }

  const login = async (data: LoginRequest) => {
    try {
      const tokens = await authAPI.login(data)
      setTokens(tokens.access_token, tokens.refresh_token)
      await loadUser()
      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (data: SignupRequest) => {
    try {
      // Create account
      await authAPI.signup(data)

      // Auto-login after signup
      await login({ email: data.email, password: data.password })
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async (force = true) => {
    await loadUser(force)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
