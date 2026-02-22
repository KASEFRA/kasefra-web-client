/**
 * Financial Health Score API module
 */

import { apiClient } from './client'

export interface DimensionScore {
  label: string
  raw_score: number
  weighted_score: number
  weight: number
  detail: string
}

export interface HealthScoreResponse {
  total_score: number
  grade: string
  dimensions: DimensionScore[]
  insights: string[]
  calculated_at: string
}

export const healthScoreApi = {
  async get(): Promise<HealthScoreResponse> {
    const response = await apiClient.get<HealthScoreResponse>('/health-score')
    return response.data
  },
}
