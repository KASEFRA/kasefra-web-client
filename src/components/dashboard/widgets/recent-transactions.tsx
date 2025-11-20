'use client'

/**
 * Recent Transactions Widget
 * Displays the last 10 transactions on the dashboard
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bankApi, accountsApi, categoriesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { BankTransaction, Account, Category } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

export function RecentTransactions() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [accounts, setAccounts] = useState<Map<string, Account>>(new Map())
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load transactions, accounts, and categories in parallel
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        bankApi.getAll({ limit: 10, skip: 0 }),
        accountsApi.getAll(),
        categoriesApi.getAll(),
      ])

      setTransactions(transactionsRes.transactions || [])
      
      // Create maps for quick lookup
      const accountsMap = new Map<string, Account>()
      accountsRes.accounts.forEach((acc) => accountsMap.set(acc.id, acc))
      setAccounts(accountsMap)

      const categoriesMap = new Map<string, Category>()
      categoriesRes.categories.forEach((cat) => categoriesMap.set(cat.id, cat))
      setCategories(categoriesMap)
    } catch (error) {
      console.error('Failed to load recent transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    ) : (
      <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/transactions')}
            >
              Add Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/transactions')}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const account = accounts.get(transaction.account_id)
            const category = transaction.category_id
              ? categories.get(transaction.category_id)
              : null

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between space-x-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push('/dashboard/transactions')}
              >
                {/* Icon and Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {account?.account_name || 'Unknown Account'}
                      </p>
                      {category && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            {category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.transaction_type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.transaction_type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(transaction.transaction_date)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
