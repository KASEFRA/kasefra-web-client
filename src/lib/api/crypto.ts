/**
 * Crypto API module
 */

import { apiClient } from './client'
import type {
  CryptoHolding,
  CryptoHoldingCreate,
  CryptoHoldingUpdate,
  CryptoHoldingListResponse,
} from '@/types'

export const cryptoApi = {
  /**
   * Get all crypto holdings for an account
   */
  async getAll(accountId: string): Promise<CryptoHoldingListResponse> {
    const response = await apiClient.get<CryptoHoldingListResponse>(
      `/crypto/${accountId}/holdings`
    )
    return response.data
  },

  /**
   * Get single holding by ID
   */
  async getById(accountId: string, holdingId: string): Promise<CryptoHolding> {
    const response = await apiClient.get<CryptoHolding>(
      `/crypto/${accountId}/holdings/${holdingId}`
    )
    return response.data
  },

  /**
   * Create new holding
   */
  async create(accountId: string, holdingData: CryptoHoldingCreate): Promise<CryptoHolding> {
    const response = await apiClient.post<CryptoHolding>(
      `/crypto/${accountId}/holdings`,
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
    holdingData: CryptoHoldingUpdate
  ): Promise<CryptoHolding> {
    const response = await apiClient.put<CryptoHolding>(
      `/crypto/${accountId}/holdings/${holdingId}`,
      holdingData
    )
    return response.data
  },

  /**
   * Delete holding
   */
  async delete(accountId: string, holdingId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/crypto/${accountId}/holdings/${holdingId}`
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
    allocation: Array<{ symbol: string; percentage: number }>
  }> {
    const response = await apiClient.get(`/crypto/${accountId}/summary`)
    return response.data
  },
}
