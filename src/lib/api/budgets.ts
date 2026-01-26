/**
 * Budgets API module
 */

import { apiClient } from './client'
import type {
  Budget,
  BudgetCreate,
  BudgetUpdate,
  BudgetListResponse,
  BudgetCategory,
  BudgetCategoryCreate,
  BudgetCategoryUpdate,
  BudgetCategoryListResponse,
  BudgetProgress,
  RecurringBill,
  RecurringBillCreate,
  RecurringBillUpdate,
  RecurringBillListResponse,
  UpcomingBillsResponse,
} from '@/types'

export const budgetsApi = {
  // ===== BUDGETS =====

  /**
   * Get all budgets for the current user
   */
  async getAll(): Promise<BudgetListResponse> {
    const response = await apiClient.get<BudgetListResponse>('/budgets')
    return response.data
  },

  /**
   * Get single budget by ID
   */
  async getById(budgetId: string): Promise<Budget> {
    const response = await apiClient.get<Budget>(`/budgets/${budgetId}`)
    return response.data
  },

  /**
   * Create new budget
   */
  async create(budgetData: BudgetCreate): Promise<Budget> {
    const response = await apiClient.post<Budget>('/budgets', budgetData)
    return response.data
  },

  /**
   * Update existing budget
   */
  async update(budgetId: string, budgetData: BudgetUpdate): Promise<Budget> {
    const response = await apiClient.put<Budget>(`/budgets/${budgetId}`, budgetData)
    return response.data
  },

  /**
   * Delete budget
   */
  async delete(budgetId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/budgets/${budgetId}`)
    return response.data
  },

  /**
   * Get current active budget
   */
  async getCurrent(): Promise<Budget> {
    const response = await apiClient.get<Budget>('/budgets/current')
    return response.data
  },

  /**
   * Get budget progress/tracking
   */
  async getProgress(budgetId: string): Promise<BudgetProgress> {
    const response = await apiClient.get<BudgetProgress>(`/budgets/${budgetId}/progress`)
    return response.data
  },

  /**
   * Sync current budget spending from transactions
   */
  async syncCurrent(): Promise<BudgetProgress> {
    const response = await apiClient.post<BudgetProgress>('/budgets/current/sync')
    return response.data
  },

  // ===== BUDGET CATEGORIES =====

  /**
   * Get all categories for a budget
   */
  async getCategories(budgetId: string): Promise<BudgetCategoryListResponse> {
    const response = await apiClient.get<BudgetCategoryListResponse>(
      `/budgets/${budgetId}/categories`
    )
    return response.data
  },

  /**
   * Add category to budget
   */
  async addCategory(budgetId: string, categoryData: BudgetCategoryCreate): Promise<BudgetCategory> {
    const response = await apiClient.post<BudgetCategory>(
      `/budgets/${budgetId}/categories`,
      categoryData
    )
    return response.data
  },

  /**
   * Update budget category allocation
   */
  async updateCategory(
    budgetId: string,
    budgetCategoryId: string,
    categoryData: BudgetCategoryUpdate
  ): Promise<BudgetCategory> {
    const response = await apiClient.put<BudgetCategory>(
      `/budgets/${budgetId}/categories/${budgetCategoryId}`,
      categoryData
    )
    return response.data
  },

  /**
   * Remove category from budget
   */
  async removeCategory(budgetId: string, budgetCategoryId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/budgets/${budgetId}/categories/${budgetCategoryId}`
    )
    return response.data
  },

  // ===== RECURRING BILLS =====

  /**
   * Get all recurring bills
   */
  async getAllBills(): Promise<RecurringBillListResponse> {
    const response = await apiClient.get<RecurringBillListResponse>('/bills')
    return response.data
  },

  /**
   * Get single bill by ID
   */
  async getBillById(billId: string): Promise<RecurringBill> {
    const response = await apiClient.get<RecurringBill>(`/bills/${billId}`)
    return response.data
  },

  /**
   * Create new recurring bill
   */
  async createBill(billData: RecurringBillCreate): Promise<RecurringBill> {
    const response = await apiClient.post<RecurringBill>('/bills', billData)
    return response.data
  },

  /**
   * Update existing bill
   */
  async updateBill(billId: string, billData: RecurringBillUpdate): Promise<RecurringBill> {
    const response = await apiClient.put<RecurringBill>(`/bills/${billId}`, billData)
    return response.data
  },

  /**
   * Delete bill
   */
  async deleteBill(billId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/bills/${billId}`)
    return response.data
  },

  /**
   * Get upcoming bills (next 30 days)
   */
  async getUpcomingBills(days?: number): Promise<UpcomingBillsResponse> {
    const response = await apiClient.get<UpcomingBillsResponse>('/bills/upcoming', {
      params: { days },
    })
    return response.data
  },

  /**
   * Mark bill as paid
   */
  async markBillPaid(billId: string, paidDate: string): Promise<RecurringBill> {
    const response = await apiClient.post<RecurringBill>(`/bills/${billId}/mark-paid`, {
      paid_date: paidDate,
    })
    return response.data
  },
}
