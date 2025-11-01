/**
 * Net Worth API module
 */

import { apiClient } from './client'
import type {
  NetWorthCurrent,
  NetWorthSnapshot,
  NetWorthSnapshotCreate,
  NetWorthHistoryResponse,
  NetWorthTrend,
  NetWorthAllocation,
} from '@/types'

export const networthApi = {
  /**
   * Get current net worth (real-time calculation)
   */
  async getCurrent(): Promise<NetWorthCurrent> {
    const response = await apiClient.get<NetWorthCurrent>('/networth/current')
    return response.data
  },

  /**
   * Create a new net worth snapshot
   */
  async createSnapshot(snapshotData?: NetWorthSnapshotCreate): Promise<NetWorthSnapshot> {
    const response = await apiClient.post<NetWorthSnapshot>(
      '/networth/snapshots',
      snapshotData || {}
    )
    return response.data
  },

  /**
   * Get historical net worth snapshots
   */
  async getHistory(startDate?: string, endDate?: string, limit?: number): Promise<NetWorthHistoryResponse> {
    const response = await apiClient.get<NetWorthHistoryResponse>('/networth/history', {
      params: { start_date: startDate, end_date: endDate, limit },
    })
    return response.data
  },

  /**
   * Get net worth trends with MoM/YoY changes
   */
  async getTrends(): Promise<NetWorthTrend> {
    const response = await apiClient.get<NetWorthTrend>('/networth/trends')
    return response.data
  },

  /**
   * Get asset allocation breakdown
   */
  async getAllocation(): Promise<NetWorthAllocation> {
    const response = await apiClient.get<NetWorthAllocation>('/networth/allocation')
    return response.data
  },

  /**
   * Delete a net worth snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/networth/snapshots/${snapshotId}`)
    return response.data
  },
}
