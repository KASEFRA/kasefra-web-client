/**
 * Assets API module
 */

import { apiClient } from './client'
import type {
  AssetValuation,
  AssetValuationCreate,
  AssetValuationUpdate,
  AssetValuationListResponse,
} from '@/types'

export const assetsApi = {
  /**
   * Get all assets for an account
   */
  async getAll(accountId: string): Promise<AssetValuationListResponse> {
    const response = await apiClient.get<AssetValuationListResponse>(
      `/assets/${accountId}/valuations`
    )
    return response.data
  },

  /**
   * Get single asset by ID
   */
  async getById(accountId: string, assetId: string): Promise<AssetValuation> {
    const response = await apiClient.get<AssetValuation>(
      `/assets/${accountId}/valuations/${assetId}`
    )
    return response.data
  },

  /**
   * Create new asset
   */
  async create(accountId: string, assetData: AssetValuationCreate): Promise<AssetValuation> {
    const response = await apiClient.post<AssetValuation>(
      `/assets/${accountId}/valuations`,
      assetData
    )
    return response.data
  },

  /**
   * Update existing asset
   */
  async update(
    accountId: string,
    assetId: string,
    assetData: AssetValuationUpdate
  ): Promise<AssetValuation> {
    const response = await apiClient.put<AssetValuation>(
      `/assets/${accountId}/valuations/${assetId}`,
      assetData
    )
    return response.data
  },

  /**
   * Delete asset
   */
  async delete(accountId: string, assetId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/assets/${accountId}/valuations/${assetId}`
    )
    return response.data
  },

  /**
   * Get assets summary
   */
  async getSummary(accountId: string): Promise<{
    total_value: number
    total_cost: number
    total_appreciation: number
    total_appreciation_percentage: number
    assets_count: number
    by_type: Array<{
      asset_type: string
      count: number
      total_value: number
      total_cost: number
    }>
  }> {
    const response = await apiClient.get(`/assets/${accountId}/summary`)
    return response.data
  },
}
