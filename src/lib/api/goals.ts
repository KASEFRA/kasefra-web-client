/**
 * Goals API module
 */

import { apiClient } from './client'
import type {
  Goal,
  GoalCreate,
  GoalUpdate,
  GoalListResponse,
  GoalProgress,
  GoalSummary,
  GoalType,
  GoalStatus,
} from '@/types'

export const goalsApi = {
  /**
   * Get all goals for the current user
   */
  async getAll(): Promise<GoalListResponse> {
    const response = await apiClient.get<GoalListResponse>('/goals')
    return response.data
  },

  /**
   * Get single goal by ID
   */
  async getById(goalId: string): Promise<Goal> {
    const response = await apiClient.get<Goal>(`/goals/${goalId}`)
    return response.data
  },

  /**
   * Create new goal
   */
  async create(goalData: GoalCreate): Promise<Goal> {
    const response = await apiClient.post<Goal>('/goals', goalData)
    return response.data
  },

  /**
   * Update existing goal
   */
  async update(goalId: string, goalData: GoalUpdate): Promise<Goal> {
    const response = await apiClient.put<Goal>(`/goals/${goalId}`, goalData)
    return response.data
  },

  /**
   * Delete goal
   */
  async delete(goalId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/goals/${goalId}`)
    return response.data
  },

  /**
   * Get active goals
   */
  async getActive(): Promise<GoalListResponse> {
    const response = await apiClient.get<GoalListResponse>('/goals/active')
    return response.data
  },

  /**
   * Get goals by type
   */
  async getByType(goalType: GoalType): Promise<GoalListResponse> {
    const response = await apiClient.get<GoalListResponse>(`/goals/type/${goalType}`)
    return response.data
  },

  /**
   * Get goals by status
   */
  async getByStatus(status: GoalStatus): Promise<GoalListResponse> {
    const response = await apiClient.get<GoalListResponse>(`/goals/status/${status}`)
    return response.data
  },

  /**
   * Get goal progress with detailed tracking
   */
  async getProgress(goalId: string): Promise<GoalProgress> {
    const response = await apiClient.get<GoalProgress>(`/goals/${goalId}/progress`)
    return response.data
  },

  /**
   * Get goals summary statistics
   */
  async getSummary(): Promise<GoalSummary> {
    const response = await apiClient.get<GoalSummary>('/goals/summary')
    return response.data
  },
}
