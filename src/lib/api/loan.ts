/**
 * Loan Account Details API Client
 * Handles CRUD operations for loan account-specific details
 */

import { apiClient } from './client'

export enum LoanType {
  MORTGAGE = 'mortgage',
  AUTO = 'auto',
  PERSONAL = 'personal',
  STUDENT = 'student',
  OTHER = 'other',
}

export interface LoanDetail {
  id: string
  account_id: string
  user_id: string
  loan_type: LoanType
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: string
  monthly_payment: number
  created_at: string
  updated_at: string
}

export interface LoanDetailCreate {
  account_id: string
  loan_type: LoanType
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: string
  monthly_payment: number
}

export interface LoanDetailUpdate {
  loan_type?: LoanType
  principal_amount?: number
  interest_rate?: number
  term_months?: number
  start_date?: string
  monthly_payment?: number
}

export const loanApi = {
  /**
   * Create loan account details
   */
  async createDetails(
    accountId: string,
    data: LoanDetailCreate
  ): Promise<LoanDetail> {
    const response = await apiClient.post(
      `/accounts/loan/${accountId}/details`,
      { ...data, account_id: accountId }
    )
    return response.data
  },

  /**
   * Get loan account details
   */
  async getDetails(accountId: string): Promise<LoanDetail> {
    const response = await apiClient.get(`/accounts/loan/${accountId}/details`)
    return response.data
  },

  /**
   * Update loan account details
   */
  async updateDetails(
    accountId: string,
    data: LoanDetailUpdate
  ): Promise<LoanDetail> {
    const response = await apiClient.put(
      `/accounts/loan/${accountId}/details`,
      data
    )
    return response.data
  },

  /**
   * Delete loan account details
   */
  async deleteDetails(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/loan/${accountId}/details`)
  },
}
