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
   * Get all transactions with optional filters
   */
  async getAll(filters?: {
    account_id?: string
    category_id?: string
    transaction_type?: string
    status?: string
    start_date?: string
    end_date?: string
    min_amount?: number
    max_amount?: number
    search_term?: string
    skip?: number
    limit?: number
  }): Promise<BankTransactionListResponse> {
    const response = await apiClient.get<BankTransactionListResponse>(
      '/accounts/bank/transactions',
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single transaction by ID
   */
  async getById(transactionId: string): Promise<BankTransaction> {
    const response = await apiClient.get<BankTransaction>(
      `/accounts/bank/transactions/${transactionId}`
    )
    return response.data
  },

  /**
   * Create new transaction
   */
  async create(transactionData: BankTransactionCreate): Promise<BankTransaction> {
    const response = await apiClient.post<BankTransaction>(
      '/accounts/bank/transactions',
      transactionData
    )
    return response.data
  },

  /**
   * Update existing transaction
   */
  async update(
    transactionId: string,
    transactionData: BankTransactionUpdate
  ): Promise<BankTransaction> {
    const response = await apiClient.put<BankTransaction>(
      `/accounts/bank/transactions/${transactionId}`,
      transactionData
    )
    return response.data
  },

  /**
   * Delete transaction
   */
  async delete(transactionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string}>(
      `/accounts/bank/transactions/${transactionId}`
    )
    return response.data
  },

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<{
    account_id: string
    current_balance: number
    currency: string
    as_of_date: string
    transaction_count: number
    total_income: number
    total_expenses: number
  }> {
    const response = await apiClient.get(`/accounts/bank/${accountId}/balance`)
    return response.data
  },

  /**
   * Get income/expense summary for account
   */
  async getSummary(accountId: string, startDate?: string, endDate?: string): Promise<{
    account_id: string
    period: string
    start_date: string
    end_date: string
    total_income: number
    total_expenses: number
    net_income: number
    income_count: number
    expense_count: number
  }> {
    const response = await apiClient.get(`/accounts/bank/${accountId}/summary`, {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },
}
