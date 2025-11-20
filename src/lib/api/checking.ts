/**
 * Checking Account Details API Client
 * Handles CRUD operations for checking account-specific details
 */

import { apiClient } from './client'

export interface CheckingDetail {
  id: string
  account_id: string
  user_id: string
  overdraft_limit?: number
  monthly_fee?: number
  account_number_last_four?: string
  created_at: string
  updated_at: string
}

export interface CheckingDetailCreate {
  account_id: string
  overdraft_limit?: number
  monthly_fee?: number
  account_number_last_four?: string
}

export interface CheckingDetailUpdate {
  overdraft_limit?: number
  monthly_fee?: number
  account_number_last_four?: string
}

export const checkingApi = {
  /**
   * Create checking account details
   */
  async createDetails(
    accountId: string,
    data: CheckingDetailCreate
  ): Promise<CheckingDetail> {
    const response = await apiClient.post(
      `/accounts/checking/${accountId}/details`,
      { ...data, account_id: accountId }
    )
    return response.data
  },

  /**
   * Get checking account details
   */
  async getDetails(accountId: string): Promise<CheckingDetail> {
    const response = await apiClient.get(`/accounts/checking/${accountId}/details`)
    return response.data
  },

  /**
   * Update checking account details
   */
  async updateDetails(
    accountId: string,
    data: CheckingDetailUpdate
  ): Promise<CheckingDetail> {
    const response = await apiClient.put(
      `/accounts/checking/${accountId}/details`,
      data
    )
    return response.data
  },

  /**
   * Delete checking account details
   */
  async deleteDetails(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/checking/${accountId}/details`)
  },
}
