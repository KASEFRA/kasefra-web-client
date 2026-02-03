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
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/currency'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { TransactionSummary } from '@/components/dashboard/transaction-summary'
import { Pagination } from '@/components/ui/pagination'

const parseAmountInput = (value: string) => {
  const normalized = value.replace(/,/g, '').trim()
  if (!normalized) return Number.NaN
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const formatAmountInput = (amount: number) => (
  Number.isFinite(amount) ? amount.toString() : ''
)

type TransactionFormProps = {
  accounts: Account[]
  filteredCategories: Category[]
  formData: BankTransactionCreate
  setFormData: React.Dispatch<React.SetStateAction<BankTransactionCreate>>
  submitting: boolean
  submitLabel: string
  onSubmit: (e: React.FormEvent) => void
  amountInput: string
  onAmountChange: (value: string) => void
  disableAccountSelect: boolean
}

const TransactionForm = ({
  accounts,
  filteredCategories,
  formData,
  setFormData,
  submitting,
  submitLabel,
  onSubmit,
  amountInput,
  onAmountChange,
  disableAccountSelect,
}: TransactionFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      {/* Account */}
      <div className="space-y-2">
        <Label htmlFor="account">Account *</Label>
        <Select
          value={formData.account_id}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, account_id: value }))}
          disabled={disableAccountSelect}
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
          onValueChange={(value) => setFormData((prev) => ({
            ...prev,
            transaction_type: value as TransactionType,
            category_id: null,
          }))}
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
          placeholder="0.00"
          value={amountInput}
          onChange={(e) => onAmountChange(e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id || 'none'}
          onValueChange={(value) => setFormData((prev) => ({
            ...prev,
            category_id: value === 'none' ? null : value,
          }))}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
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
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
        onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
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
        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
      />
    </div>

    <DialogFooter>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </DialogFooter>
  </form>
)

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
  const [amountInput, setAmountInput] = useState('')

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
      
      if (selectedAccount !== 'all') filters.account_id = selectedAccount
      if (selectedCategory !== 'all') filters.category_id = selectedCategory
      if (selectedType !== 'all') filters.transaction_type = selectedType
      if (searchQuery) filters.search_term = searchQuery
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
    const parsedAmount = parseAmountInput(amountInput)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.')
      return
    }
    try {
      setSubmitting(true)
      const payload: BankTransactionCreate = {
        ...formData,
        amount: parsedAmount,
      }
      await bankApi.create(payload)
      setCreateDialogOpen(false)
      resetForm()
      await loadTransactions()
      await loadSummary()
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
    const parsedAmount = parseAmountInput(amountInput)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.')
      return
    }

    try {
      setSubmitting(true)
      const updateData: BankTransactionUpdate = {
        category_id: formData.category_id,
        amount: parsedAmount,
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
      await loadSummary()
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
      await loadSummary()
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
    setAmountInput(formatAmountInput(transaction.amount))
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
    setAmountInput('')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-muted-foreground">
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

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadTransactions()
                  loadSummary()
                }
              }}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  loadTransactions()
                  loadSummary()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Account Filter */}
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="min-w-[180px]">
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
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto">
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
            <SelectTrigger className="min-w-[170px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="debit">Debit (Expense)</SelectItem>
              <SelectItem value="credit">Credit (Income)</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <div className="min-w-[220px]">
            <Label className="sr-only">Date Range</Label>
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          </div>
        </div>
      </div>

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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No transactions found
                      <div className="mt-4">
                        <Button variant="outline" onClick={openCreateDialog}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Transaction
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const account = accounts.find(a => a.id === transaction.account_id)
                    const category = categories.find(c => c.id === transaction.category_id)

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {transaction.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {account?.account_name || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {category ? `${category.icon} ${category.name}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.transaction_type === TransactionType.CREDIT ? 'secondary' : 'outline'}>
                            {transaction.transaction_type === TransactionType.CREDIT ? 'Credit' : 'Debit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={transaction.transaction_type === TransactionType.CREDIT ? 'text-green-500' : 'text-red-500'}>
                            {transaction.transaction_type === TransactionType.CREDIT ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
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
          <TransactionForm
            accounts={accounts}
            filteredCategories={filteredCategories}
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            submitLabel="Create Transaction"
            onSubmit={handleCreate}
            amountInput={amountInput}
            onAmountChange={setAmountInput}
            disableAccountSelect={false}
          />
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
          <TransactionForm
            accounts={accounts}
            filteredCategories={filteredCategories}
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            submitLabel="Update Transaction"
            onSubmit={handleUpdate}
            amountInput={amountInput}
            onAmountChange={setAmountInput}
            disableAccountSelect
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
