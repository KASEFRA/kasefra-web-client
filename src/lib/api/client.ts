/**
 * Axios API Client with interceptors for authentication
 */

import axios from 'axios'
import { getAccessToken, clearTokens } from '@/lib/auth/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      clearTokens()

      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
