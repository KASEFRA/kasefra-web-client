/**
 * Auth API Functions
 * Handles all authentication-related API calls to the FastAPI backend
 */

import { apiClient } from './client'
import type {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '@/types/auth'

export const authAPI = {
  /**
   * Register a new user
   */
  signup: async (data: SignupRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/register', data)
    return response.data
  },

  /**
   * Login user and get JWT tokens
   */
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/auth/me')
    return response.data
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    data: Partial<Pick<UserResponse, 'full_name' | 'email'>>
  ): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>('/auth/me', data)
    return response.data
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    current_password: string
    new_password: string
  }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/me/change-password',
      data
    )
    return response.data
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (file: File): Promise<UserResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<UserResponse>('/auth/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
