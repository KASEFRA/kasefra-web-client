/**
 * API modules index
 * Central export for all API modules
 */

export { authAPI } from './auth'
export { accountsApi } from './accounts'
export { bankApi } from './bank'
export { investmentsApi } from './investments'
export { cryptoApi } from './crypto'
export { assetsApi } from './assets'
export { categoriesApi } from './categories'
export { budgetsApi } from './budgets'
export { goalsApi } from './goals'
export { networthApi } from './networth'
export { apiClient } from './client'

// Account type-specific detail APIs
export { checkingApi } from './checking'
export { savingsApi } from './savings'
export { creditCardApi } from './credit-card'
export { cashApi } from './cash'
export { loanApi } from './loan'

// Bills API - convenience wrapper around budgetsApi
import { budgetsApi } from './budgets'

export const billsApi = {
  getAll: budgetsApi.getAllBills,
  getById: budgetsApi.getBillById,
  create: budgetsApi.createBill,
  update: budgetsApi.updateBill,
  delete: budgetsApi.deleteBill,
  getUpcoming: budgetsApi.getUpcomingBills,
  markPaid: budgetsApi.markBillPaid,
}
