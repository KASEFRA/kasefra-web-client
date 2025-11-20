'use client'

/**
 * Transactions Page
 * View and manage all bank transactions with filters and search
 */

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { bankApi, accountsApi, categoriesApi } from '@/lib/api'
import type { BankTransaction, Account, Category, BankTransactionCreate, BankTransactionUpdate } from '@/types'
import { TransactionType, CategoryType } from '@/types'
import { Plus, Search, Edit, Trash2, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { TransactionSummary } from '@/components/dashboard/transaction-summary'
import { Pagination } from '@/components/ui/pagination'

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Summary
  const [summary, setSummary] = useState<{
    total_income: number
    total_expenses: number
    net_income: number
    income_count: number
    expense_count: number
  } | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null)

  // Form state
  const [formData, setFormData] = useState<BankTransactionCreate>({
    account_id: '',
    category_id: null,
    amount: 0,
    transaction_type: TransactionType.DEBIT,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadTransactions()
    loadSummary()
  }, [selectedAccount, selectedCategory, selectedType, dateRange, currentPage, pageSize])

  const loadInitialData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        accountsApi.getAll(),
        categoriesApi.getAll()
      ])
      setAccounts(accountsRes.accounts.filter(a => a.is_active))
      setCategories(categoriesRes.categories)

      // Set default account if available
      if (accountsRes.accounts.length > 0) {
        setFormData(prev => ({ ...prev, account_id: accountsRes.accounts[0].id }))
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const filters: any = {
        skip: currentPage * pageSize,
        limit: pageSize,
      }

      if (selectedAccount !== 'all') filters.account_id = selectedAccount
      if (selectedCategory !== 'all') filters.category_id = selectedCategory
      if (selectedType !== 'all') filters.transaction_type = selectedType
      if (searchQuery) filters.search_term = searchQuery
      if (dateRange?.from) filters.start_date = format(dateRange.from, 'yyyy-MM-dd')
      if (dateRange?.to) filters.end_date = format(dateRange.to, 'yyyy-MM-dd')

      const response = await bankApi.getAll(filters)
      setTransactions(response.transactions || [])
      setTotalCount(response.total_count || 0)
    } catch (error) {
      console.error('Failed to load transactions:', error)
      setTransactions([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      setSummaryLoading(true)
      const filters: any = {}
      
      if (dateRange?.from) filters.start_date = format(dateRange.from, 'yyyy-MM-dd')
      if (dateRange?.to) filters.end_date = format(dateRange.to, 'yyyy-MM-dd')

      const summaryData = await bankApi.getOverallSummary(filters)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load summary:', error)
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setCurrentPage(0) // Reset to first page when changing date range
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await bankApi.create(formData)
      setCreateDialogOpen(false)
      resetForm()
      await loadTransactions()
    } catch (error: any) {
      console.error('Failed to create transaction:', error)
      alert(error.response?.data?.error?.details || 'Failed to create transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return

    try {
      setSubmitting(true)
      const updateData: BankTransactionUpdate = {
        category_id: formData.category_id,
        amount: formData.amount,
        transaction_type: formData.transaction_type,
        description: formData.description,
        transaction_date: formData.transaction_date,
        notes: formData.notes || null,
      }

      await bankApi.update(editingTransaction.id, updateData)
      setEditDialogOpen(false)
      setEditingTransaction(null)
      resetForm()
      await loadTransactions()
    } catch (error: any) {
      console.error('Failed to update transaction:', error)
      alert(error.response?.data?.error?.details || 'Failed to update transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await bankApi.delete(transactionId)
      await loadTransactions()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      alert('Failed to delete transaction')
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  const openEditDialog = (transaction: BankTransaction) => {
    setEditingTransaction(transaction)
    setFormData({
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      notes: transaction.notes || '',
    })
    setEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      account_id: accounts[0]?.id || '',
      category_id: null,
      amount: 0,
      transaction_type: TransactionType.DEBIT,
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => {
    if (!formData.transaction_type) return true
    if (formData.transaction_type === TransactionType.CREDIT) {
      return cat.category_type === CategoryType.INCOME
    } else {
      return cat.category_type === CategoryType.EXPENSE
    }
  })

  const TransactionForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Account */}
        <div className="space-y-2">
          <Label htmlFor="account">Account *</Label>
          <Select
            value={formData.account_id}
            onValueChange={(value) => setFormData({ ...formData, account_id: value })}
            disabled={!!editingTransaction}
          >
            <SelectTrigger id="account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.transaction_type}
            onValueChange={(value) => setFormData({ ...formData, transaction_type: value as TransactionType, category_id: null })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TransactionType.DEBIT}>Debit (Expense)</SelectItem>
              <SelectItem value={TransactionType.CREDIT}>Credit (Income)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (AED) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? null : value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          required
          placeholder="e.g., Grocery shopping"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Transaction Date */}
      <div className="space-y-2">
        <Label htmlFor="txDate">Transaction Date *</Label>
        <Input
          id="txDate"
          type="date"
          required
          value={formData.transaction_date}
          onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes..."
          rows={3}
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your financial transactions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Transaction Summary */}
      <TransactionSummary data={summary} loading={summaryLoading} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Picker */}
          <div>
            <Label className="mb-2 block">Date Range</Label>
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
                className="pl-8"
              />
            </div>

            {/* Account Filter */}
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debit">Debit (Expense)</SelectItem>
                <SelectItem value="credit">Credit (Income)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
              <Button className="mt-4" variant="outline" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.account_id)
                const category = categories.find(c => c.id === transaction.category_id)

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{formatDate(transaction.transaction_date)}</span>
                          {account && (
                            <>
                              <span>•</span>
                              <span>{account.account_name}</span>
                            </>
                          )}
                          {category && (
                            <>
                              <span>•</span>
                              <span>{category.icon} {category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.transaction_type === TransactionType.CREDIT ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.transaction_type === TransactionType.CREDIT ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              pageSize={pageSize}
              totalItems={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Create a new financial transaction
            </DialogDescription>
          </DialogHeader>
          <TransactionForm onSubmit={handleCreate} submitLabel="Create Transaction" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details
            </DialogDescription>
          </DialogHeader>
          <TransactionForm onSubmit={handleUpdate} submitLabel="Update Transaction" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
