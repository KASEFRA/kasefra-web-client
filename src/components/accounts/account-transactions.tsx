'use client'

/**
 * Account Transactions Component  
 * Displays filtered transaction list for a specific account
 */

import { useState, useEffect } from 'react'
import { bankApi, categoriesApi } from '@/lib/api'
import type { BankTransaction, Category } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccountTransactionsProps {
  accountId: string
  limit?: number
  showPagination?: boolean
}

export function AccountTransactions({ 
  accountId, 
  limit = 10,
  showPagination = false 
}: AccountTransactionsProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    loadData()
  }, [accountId, searchQuery, currentPage])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [txnsResponse, catsResponse] = await Promise.all([
        bankApi.getAll({
          account_id: accountId,
          search_term: searchQuery || undefined,
          skip: currentPage * limit,
          limit,
        }),
        categoriesApi.getAll(),
      ])

      setTransactions(txnsResponse.transactions || [])
      setCategories(catsResponse.categories || [])
    } catch (error) {
      console.error('Failed to load transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/transactions')}
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(0)
            }}
            className="pl-8"
          />
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const category = getCategoryById(transaction.category_id)
              const isIncome = transaction.transaction_type === 'credit'

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/transactions`)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(transaction.transaction_date)}</span>
                        {category && (
                          <>
                            <span>•</span>
                            <span>{category.icon} {category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Simple Pagination */}
        {showPagination && transactions.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={transactions.length < limit}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
