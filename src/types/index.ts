/**
 * TypeScript type definitions matching backend schemas
 */

// Re-export auth types
export * from './auth'

// ===== ENUMS =====

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CRYPTO = 'crypto',
  ASSET = 'asset',
  LOAN = 'loan',
  MORTGAGE = 'mortgage',
  LINE_OF_CREDIT = 'line_of_credit',
  CASH = 'cash',
  BROKERAGE = 'brokerage',
  RETIREMENT = 'retirement',
}

export enum AccountSubtype {
  BANK = 'bank',
  INVESTMENT = 'investment',
  CRYPTO = 'crypto',
  ASSET = 'asset',
}

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum AssetType {
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  JEWELRY = 'jewelry',
  ELECTRONICS = 'electronics',
  COLLECTIBLES = 'collectibles',
  OTHER = 'other',
}

export enum BudgetType {
  FIXED = 'fixed',
  FLEXIBLE = 'flexible',
  ZERO_BASED = 'zero_based',
}

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum BillFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// ===== ACCOUNT TYPES =====

export interface Account {
  id: string
  user_id: string
  account_name: string
  account_type: AccountType
  account_subtype: AccountSubtype | null
  currency: string
  current_balance: number
  available_balance: number | null
  credit_limit: number | null
  is_active: boolean
  institution_name: string | null
  account_number_last4: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AccountCreate {
  account_name: string
  account_type: AccountType
  account_subtype?: AccountSubtype | null
  currency?: string
  current_balance?: number
  available_balance?: number | null
  credit_limit?: number | null
  institution_name?: string | null
  account_number_last4?: string | null
  notes?: string | null
}

export interface AccountUpdate {
  account_name?: string
  current_balance?: number
  available_balance?: number | null
  credit_limit?: number | null
  is_active?: boolean
  institution_name?: string | null
  notes?: string | null
}

export interface AccountListResponse {
  accounts: Account[]
  total_count: number
}

// ===== BANK TRANSACTION TYPES =====

export interface BankTransaction {
  id: string
  account_id: string
  transaction_date: string
  description: string
  amount: number
  transaction_type: TransactionType
  category_id: string | null
  category_name: string | null
  merchant_name: string | null
  running_balance: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BankTransactionCreate {
  transaction_date: string
  description: string
  amount: number
  transaction_type: TransactionType
  category_id?: string | null
  merchant_name?: string | null
  notes?: string | null
}

export interface BankTransactionUpdate {
  transaction_date?: string
  description?: string
  amount?: number
  transaction_type?: TransactionType
  category_id?: string | null
  merchant_name?: string | null
  notes?: string | null
}

export interface BankTransactionListResponse {
  transactions: BankTransaction[]
  total_count: number
}

// ===== INVESTMENT TYPES =====

export interface InvestmentHolding {
  id: string
  account_id: string
  symbol: string
  asset_name: string
  quantity: number
  purchase_price: number
  current_price: number | null
  purchase_date: string
  market_value: number | null
  gain_loss: number | null
  gain_loss_percentage: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvestmentHoldingCreate {
  symbol: string
  asset_name: string
  quantity: number
  purchase_price: number
  current_price?: number | null
  purchase_date: string
  notes?: string | null
}

export interface InvestmentHoldingUpdate {
  symbol?: string
  asset_name?: string
  quantity?: number
  purchase_price?: number
  current_price?: number | null
  purchase_date?: string
  notes?: string | null
}

export interface InvestmentHoldingListResponse {
  holdings: InvestmentHolding[]
  total_count: number
}

// ===== CRYPTO TYPES =====

export interface CryptoHolding {
  id: string
  account_id: string
  symbol: string
  crypto_name: string
  quantity: number
  purchase_price: number
  current_price: number | null
  purchase_date: string
  market_value: number | null
  gain_loss: number | null
  gain_loss_percentage: number | null
  wallet_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CryptoHoldingCreate {
  symbol: string
  crypto_name: string
  quantity: number
  purchase_price: number
  current_price?: number | null
  purchase_date: string
  wallet_address?: string | null
  notes?: string | null
}

export interface CryptoHoldingUpdate {
  symbol?: string
  crypto_name?: string
  quantity?: number
  purchase_price?: number
  current_price?: number | null
  purchase_date?: string
  wallet_address?: string | null
  notes?: string | null
}

export interface CryptoHoldingListResponse {
  holdings: CryptoHolding[]
  total_count: number
}

// ===== ASSET TYPES =====

export interface AssetValuation {
  id: string
  account_id: string
  asset_name: string
  asset_type: AssetType
  purchase_price: number
  current_value: number
  purchase_date: string
  valuation_date: string
  appreciation: number | null
  appreciation_percentage: number | null
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssetValuationCreate {
  asset_name: string
  asset_type: AssetType
  purchase_price: number
  current_value: number
  purchase_date: string
  valuation_date: string
  location?: string | null
  notes?: string | null
}

export interface AssetValuationUpdate {
  asset_name?: string
  asset_type?: AssetType
  purchase_price?: number
  current_value?: number
  purchase_date?: string
  valuation_date?: string
  location?: string | null
  notes?: string | null
}

export interface AssetValuationListResponse {
  assets: AssetValuation[]
  total_count: number
}

// ===== CATEGORY TYPES =====

export interface Category {
  id: string
  user_id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string | null
  icon: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface CategoryCreate {
  name: string
  description?: string | null
  parent_id?: string | null
  color?: string | null
  icon?: string | null
}

export interface CategoryUpdate {
  name?: string
  description?: string | null
  parent_id?: string | null
  color?: string | null
  icon?: string | null
}

export interface CategoryListResponse {
  categories: Category[]
  total_count: number
}

// ===== BUDGET TYPES =====

export interface Budget {
  id: string
  user_id: string
  name: string
  budget_type: BudgetType
  period: BudgetPeriod
  start_date: string
  end_date: string | null
  is_active: boolean
  rollover_enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BudgetCreate {
  name: string
  budget_type: BudgetType
  period: BudgetPeriod
  start_date: string
  end_date?: string | null
  rollover_enabled?: boolean
  notes?: string | null
}

export interface BudgetUpdate {
  name?: string
  end_date?: string | null
  rollover_enabled?: boolean
  is_active?: boolean
  notes?: string | null
}

export interface BudgetCategory {
  id: string
  budget_id: string
  category_id: string
  category_name: string | null
  allocated_amount: number
  spent_amount: number
  rollover_amount: number
  remaining_amount: number | null
  percentage_used: number | null
  alert_threshold: number
  alert_enabled: boolean
  is_over_budget: boolean | null
  created_at: string
  updated_at: string
}

export interface BudgetCategoryCreate {
  category_id: string
  allocated_amount: number
  alert_threshold?: number
  alert_enabled?: boolean
}

export interface BudgetCategoryUpdate {
  allocated_amount?: number
  alert_threshold?: number
  alert_enabled?: boolean
}

export interface BudgetProgress {
  budget_id: string
  budget_name: string
  period: BudgetPeriod
  start_date: string
  end_date: string | null
  total_allocated: number
  total_spent: number
  total_remaining: number
  total_rollover: number
  percentage_used: number
  is_over_budget: boolean
  categories: BudgetCategory[]
  categories_over_budget: number
  categories_near_limit: number
}

export interface BudgetListResponse {
  budgets: Budget[]
  total_count: number
}

export interface BudgetCategoryListResponse {
  categories: BudgetCategory[]
  total_count: number
}

// ===== RECURRING BILL TYPES =====

export interface RecurringBill {
  id: string
  user_id: string
  bill_name: string
  category_id: string
  category_name: string | null
  amount: number
  frequency: BillFrequency
  due_date: number
  account_id: string | null
  merchant_name: string | null
  is_autopay: boolean
  reminder_days_before: number
  last_paid_date: string | null
  next_due_date: string
  is_active: boolean
  days_until_due: number | null
  is_overdue: boolean | null
  created_at: string
  updated_at: string
}

export interface RecurringBillCreate {
  bill_name: string
  category_id: string
  amount: number
  frequency: BillFrequency
  due_date: number
  account_id?: string | null
  merchant_name?: string | null
  is_autopay?: boolean
  reminder_days_before?: number
}

export interface RecurringBillUpdate {
  bill_name?: string
  category_id?: string
  amount?: number
  frequency?: BillFrequency
  due_date?: number
  account_id?: string | null
  merchant_name?: string | null
  is_autopay?: boolean
  reminder_days_before?: number
  is_active?: boolean
}

export interface RecurringBillListResponse {
  bills: RecurringBill[]
  total_count: number
}

export interface UpcomingBillsResponse {
  bills: RecurringBill[]
  total_amount: number
  count: number
}

// ===== COMMON TYPES =====

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  detail: string | { msg: string; type: string }[]
}
