'use client'

/**
 * Transactions Page
 * View and manage all bank transactions with filters and search
 */

import { useEffect, useState } from 'react'
import { bankApi, accountsApi } from '@/lib/api'
import type { BankTransaction, Account } from '@/types'
import { AccountType, TransactionType } from '@/types'
import { Plus, Search, Filter, Calendar, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      loadTransactions()
    }
  }, [selectedAccount, typeFilter, accounts])

  const loadAccounts = async () => {
    try {
      const response = await accountsApi.getAll()
      const bankAccounts = response.accounts.filter(acc => 
        acc.account_type === AccountType.CHECKING || 
        acc.account_type === AccountType.SAVINGS || 
        acc.account_type === AccountType.CREDIT_CARD
      )
      setAccounts(bankAccounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      if (selectedAccount === 'all') {
        // Load transactions from all accounts
        const allTransactions: BankTransaction[] = []
        for (const account of accounts) {
          const response = await bankApi.getAll(account.id)
          allTransactions.push(...response.transactions)
        }
        setTransactions(allTransactions)
      } else {
        const response = await bankApi.getAll(selectedAccount)
        setTransactions(response.transactions)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string, transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      await bankApi.delete(accountId, transactionId)
      await loadTransactions()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income':
      case 'deposit':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'expense':
      case 'withdrawal':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'transfer':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(tx => {
      // Search filter
      if (searchQuery && !tx.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Type filter
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      } else {
        return Math.abs(b.amount) - Math.abs(a.amount)
      }
    })

  if (loading && accounts.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'date' | 'amount') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
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
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
              <Button className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.description || 'Untitled Transaction'}</p>
                        <Badge variant="outline" className={getTransactionTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatDate(transaction.transaction_date)}</span>
                        <span>•</span>
                        <span>{accounts.find(a => a.id === transaction.account_id)?.account_name || 'Unknown Account'}</span>
                        {transaction.category_id && (
                          <>
                            <span>•</span>
                            <span>Category: {transaction.category_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.transaction_type === TransactionType.CREDIT ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.transaction_type === TransactionType.CREDIT ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.account_id, transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
