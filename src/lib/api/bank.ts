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
      '/accounts/transactions',
      { params: filters }
    )
    return response.data
  },

  /**
   * Get single transaction by ID
   */
  async getById(transactionId: string): Promise<BankTransaction> {
    const response = await apiClient.get<BankTransaction>(
      `/accounts/transactions/${transactionId}`
    )
    return response.data
  },

  /**
   * Create new transaction
   */
  async create(transactionData: BankTransactionCreate): Promise<BankTransaction> {
    const response = await apiClient.post<BankTransaction>(
      '/accounts/transactions',
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
      `/accounts/transactions/${transactionId}`,
      transactionData
    )
    return response.data
  },

  /**
   * Delete transaction
   */
  async delete(transactionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string}>(
      `/accounts/transactions/${transactionId}`
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
    const response = await apiClient.get(`/accounts/${accountId}/balance`)
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
    const response = await apiClient.get(`/accounts/${accountId}/summary`, {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },

  /**
   * Get overall transaction summary across all accounts
   * Aggregates data from all transactions based on filters
   */
  async getOverallSummary(filters?: {
    start_date?: string
    end_date?: string
  }): Promise<{
    total_income: number
    total_expenses: number
    net_income: number
    income_count: number
    expense_count: number
  }> {
    const response = await this.getAll({
      ...filters,
      limit: 10000, // High limit to get all transactions in range
    })

    const summary = response.transactions.reduce(
      (acc, txn) => {
        if (txn.transaction_type === 'credit') {
          acc.total_income += txn.amount
          acc.income_count++
        } else {
          acc.total_expenses += txn.amount
          acc.expense_count++
        }
        return acc
      },
      {
        total_income: 0,
        total_expenses: 0,
        net_income: 0,
        income_count: 0,
        expense_count: 0,
      }
    )

    summary.net_income = summary.total_income - summary.total_expenses
    return summary
  },
}
