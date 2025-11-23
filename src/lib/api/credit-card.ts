/**
 * Credit Card Account Details API Client
 * Handles CRUD operations for credit card account-specific details
 */

import { apiClient } from './client'

export interface CreditCardDetail {
  id: string
  account_id: string
  user_id: string
  credit_limit?: number
  apr?: number
  payment_due_day?: number
  card_last_four?: string
  created_at: string
  updated_at: string
}

export interface CreditCardDetailCreate {
  account_id: string
  credit_limit?: number
  apr?: number
  payment_due_day?: number
  card_last_four?: string
}

export interface CreditCardDetailUpdate {
  credit_limit?: number
  apr?: number
  payment_due_day?: number
  card_last_four?: string
}

export const creditCardApi = {
  /**
   * Create credit card account details
   */
  async createDetails(
    accountId: string,
    data: CreditCardDetailCreate
  ): Promise<CreditCardDetail> {
    const response = await apiClient.post(
      `/accounts/credit-card/${accountId}/details`,
      { ...data, account_id: accountId }
    )
    return response.data
  },

  /**
   * Get credit card account details
   */
  async getDetails(accountId: string): Promise<CreditCardDetail> {
    const response = await apiClient.get(`/accounts/credit-card/${accountId}/details`)
    return response.data
  },

  /**
   * Update credit card account details
   */
  async updateDetails(
    accountId: string,
    data: CreditCardDetailUpdate
  ): Promise<CreditCardDetail> {
    const response = await apiClient.put(
      `/accounts/credit-card/${accountId}/details`,
      data
    )
    return response.data
  },

  /**
   * Delete credit card account details
   */
  async deleteDetails(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/credit-card/${accountId}/details`)
  },
}
