/**
 * Cash Account Details API Client
 * Handles CRUD operations for cash account-specific details
 */

import { apiClient } from './client'

export interface CashDetail {
  id: string
  account_id: string
  user_id: string
  location?: string
  created_at: string
  updated_at: string
}

export interface CashDetailCreate {
  account_id: string
  location?: string
}

export interface CashDetailUpdate {
  location?: string
}

export const cashApi = {
  /**
   * Create cash account details
   */
  async createDetails(
    accountId: string,
    data: CashDetailCreate
  ): Promise<CashDetail> {
    const response = await apiClient.post(
      `/accounts/cash/${accountId}/details`,
      { ...data, account_id: accountId }
    )
    return response.data
  },

  /**
   * Get cash account details
   */
  async getDetails(accountId: string): Promise<CashDetail> {
    const response = await apiClient.get(`/accounts/cash/${accountId}/details`)
    return response.data
  },

  /**
   * Update cash account details
   */
  async updateDetails(
    accountId: string,
    data: CashDetailUpdate
  ): Promise<CashDetail> {
    const response = await apiClient.put(
      `/accounts/cash/${accountId}/details`,
      data
    )
    return response.data
  },

  /**
   * Delete cash account details
   */
  async deleteDetails(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/cash/${accountId}/details`)
  },
}
