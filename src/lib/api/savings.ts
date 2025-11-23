/**
 * Savings Account Details API Client
 * Handles CRUD operations for savings account-specific details
 */

import { apiClient } from './client'

export interface SavingsDetail {
  id: string
  account_id: string
  user_id: string
  interest_rate?: number
  goal_name?: string
  goal_target_amount?: number
  created_at: string
  updated_at: string
}

export interface SavingsDetailCreate {
  account_id: string
  interest_rate?: number
  goal_name?: string
  goal_target_amount?: number
}

export interface SavingsDetailUpdate {
  interest_rate?: number
  goal_name?: string
  goal_target_amount?: number
}

export const savingsApi = {
  /**
   * Create savings account details
   */
  async createDetails(
    accountId: string,
    data: SavingsDetailCreate
  ): Promise<SavingsDetail> {
    const response = await apiClient.post(
      `/accounts/savings/${accountId}/details`,
      { ...data, account_id: accountId }
    )
    return response.data
  },

  /**
   * Get savings account details
   */
  async getDetails(accountId: string): Promise<SavingsDetail> {
    const response = await apiClient.get(`/accounts/savings/${accountId}/details`)
    return response.data
  },

  /**
   * Update savings account details
   */
  async updateDetails(
    accountId: string,
    data: SavingsDetailUpdate
  ): Promise<SavingsDetail> {
    const response = await apiClient.put(
      `/accounts/savings/${accountId}/details`,
      data
    )
    return response.data
  },

  /**
   * Delete savings account details
   */
  async deleteDetails(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/savings/${accountId}/details`)
  },
}
