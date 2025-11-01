/**
 * Bank Transactions API module
 */

import { apiClient } from './client'
import type {
  BankTransaction,
  BankTransactionCreate,
  BankTransactionUpdate,
  BankTransactionListResponse,
} from '@/types'

export const bankApi = {
  /**
   * Get all transactions for an account
   */
  async getAll(accountId: string): Promise<BankTransactionListResponse> {
    const response = await apiClient.get<BankTransactionListResponse>(
      `/bank/${accountId}/transactions`
    )
    return response.data
  },

  /**
   * Get transactions with filters
   */
  async getFiltered(
    accountId: string,
    filters?: {
      start_date?: string
      end_date?: string
      category_id?: string
      transaction_type?: string
      min_amount?: number
      max_amount?: number
      search?: string
    }
  ): Promise<BankTransactionListResponse> {
    const response = await apiClient.get<BankTransactionListResponse>(
      `/bank/${accountId}/transactions`,
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single transaction by ID
   */
  async getById(accountId: string, transactionId: string): Promise<BankTransaction> {
    const response = await apiClient.get<BankTransaction>(
      `/bank/${accountId}/transactions/${transactionId}`
    )
    return response.data
  },

  /**
   * Create new transaction
   */
  async create(accountId: string, transactionData: BankTransactionCreate): Promise<BankTransaction> {
    const response = await apiClient.post<BankTransaction>(
      `/bank/${accountId}/transactions`,
      transactionData
    )
    return response.data
  },

  /**
   * Update existing transaction
   */
  async update(
    accountId: string,
    transactionId: string,
    transactionData: BankTransactionUpdate
  ): Promise<BankTransaction> {
    const response = await apiClient.put<BankTransaction>(
      `/bank/${accountId}/transactions/${transactionId}`,
      transactionData
    )
    return response.data
  },

  /**
   * Delete transaction
   */
  async delete(accountId: string, transactionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/bank/${accountId}/transactions/${transactionId}`
    )
    return response.data
  },

  /**
   * Get transaction summary for account
   */
  async getSummary(accountId: string, period?: string): Promise<{
    total_income: number
    total_expenses: number
    net_cashflow: number
    transaction_count: number
    top_categories: Array<{ category: string; amount: number; count: number }>
  }> {
    const response = await apiClient.get(`/bank/${accountId}/summary`, {
      params: { period },
    })
    return response.data
  },
}
