/**
 * Accounts API module
 */

import { apiClient } from './client'
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountListResponse,
} from '@/types'

export const accountsApi = {
  /**
   * Get all accounts for the current user
   */
  async getAll(): Promise<AccountListResponse> {
    const response = await apiClient.get<AccountListResponse>('/accounts')
    return response.data
  },

  /**
   * Get accounts by type
   */
  async getByType(accountType: string): Promise<AccountListResponse> {
    const response = await apiClient.get<AccountListResponse>('/accounts', {
      params: { account_type: accountType },
    })
    return response.data
  },

  /**
   * Get single account by ID
   */
  async getById(accountId: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/accounts/${accountId}`)
    return response.data
  },

  /**
   * Create new account
   */
  async create(accountData: AccountCreate): Promise<Account> {
    const response = await apiClient.post<Account>('/accounts', accountData)
    return response.data
  },

  /**
   * Update existing account
   */
  async update(accountId: string, accountData: AccountUpdate): Promise<Account> {
    const response = await apiClient.put<Account>(`/accounts/${accountId}`, accountData)
    return response.data
  },

  /**
   * Delete account
   */
  async delete(accountId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/accounts/${accountId}`)
    return response.data
  },

  /**
   * Get account statistics (count by type, currency, etc.)
   */
  async getStats(): Promise<{
    total_accounts: number
    active_accounts: number
    by_type: Record<string, number>
    by_currency: Record<string, number>
  }> {
    const response = await apiClient.get('/accounts/stats')
    return response.data
  },
}
