/**
 * Investments API module
 */

import { apiClient } from './client'
import type {
  InvestmentHolding,
  InvestmentHoldingCreate,
  InvestmentHoldingUpdate,
  InvestmentHoldingListResponse,
} from '@/types'

export const investmentsApi = {
  /**
   * Get all investment holdings for an account
   */
  async getAll(accountId: string): Promise<InvestmentHoldingListResponse> {
    const response = await apiClient.get<InvestmentHoldingListResponse>(
      `/investments/${accountId}/holdings`
    )
    return response.data
  },

  /**
   * Get single holding by ID
   */
  async getById(accountId: string, holdingId: string): Promise<InvestmentHolding> {
    const response = await apiClient.get<InvestmentHolding>(
      `/investments/${accountId}/holdings/${holdingId}`
    )
    return response.data
  },

  /**
   * Create new holding
   */
  async create(
    accountId: string,
    holdingData: InvestmentHoldingCreate
  ): Promise<InvestmentHolding> {
    const response = await apiClient.post<InvestmentHolding>(
      `/investments/${accountId}/holdings`,
      holdingData
    )
    return response.data
  },

  /**
   * Update existing holding
   */
  async update(
    accountId: string,
    holdingId: string,
    holdingData: InvestmentHoldingUpdate
  ): Promise<InvestmentHolding> {
    const response = await apiClient.put<InvestmentHolding>(
      `/investments/${accountId}/holdings/${holdingId}`,
      holdingData
    )
    return response.data
  },

  /**
   * Delete holding
   */
  async delete(accountId: string, holdingId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/investments/${accountId}/holdings/${holdingId}`
    )
    return response.data
  },

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(accountId: string): Promise<{
    total_value: number
    total_cost: number
    total_gain_loss: number
    total_gain_loss_percentage: number
    holdings_count: number
    top_performers: Array<{
      symbol: string
      name: string
      gain_loss_percentage: number
    }>
    asset_allocation: Array<{ symbol: string; percentage: number }>
  }> {
    const response = await apiClient.get(`/investments/${accountId}/summary`)
    return response.data
  },
}
