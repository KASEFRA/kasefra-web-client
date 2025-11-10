/**
 * Assets API module
 */

import { apiClient } from './client'
import type {
  AssetValuation,
  AssetValuationCreate,
  AssetValuationUpdate,
  AssetValuationListResponse,
  TotalValueResponse,
} from '@/types'

export const assetsApi = {
  /**
   * Get all asset valuations for an account
   */
  async getAll(accountId: string): Promise<AssetValuationListResponse> {
    const response = await apiClient.get<AssetValuationListResponse>(
      `/accounts/assets/${accountId}/valuations`
    )
    return response.data
  },

  /**
   * Get single asset valuation by ID
   */
  async getById(valuationId: string): Promise<AssetValuation> {
    const response = await apiClient.get<AssetValuation>(
      `/accounts/assets/valuations/${valuationId}`
    )
    return response.data
  },

  /**
   * Create new asset valuation
   */
  async create(assetData: AssetValuationCreate): Promise<AssetValuation> {
    const response = await apiClient.post<AssetValuation>(
      `/accounts/assets/valuations`,
      assetData
    )
    return response.data
  },

  /**
   * Update existing asset valuation
   */
  async update(
    valuationId: string,
    assetData: AssetValuationUpdate
  ): Promise<AssetValuation> {
    const response = await apiClient.put<AssetValuation>(
      `/accounts/assets/valuations/${valuationId}`,
      assetData
    )
    return response.data
  },

  /**
   * Delete asset valuation
   */
  async delete(valuationId: string): Promise<void> {
    await apiClient.delete(`/accounts/assets/valuations/${valuationId}`)
  },

  /**
   * Get total asset value for an account
   */
  async getTotalValue(accountId: string): Promise<TotalValueResponse> {
    const response = await apiClient.get<TotalValueResponse>(
      `/accounts/assets/${accountId}/total-value`
    )
    return response.data
  },
}
