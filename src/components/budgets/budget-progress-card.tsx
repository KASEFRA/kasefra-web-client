'use client'

/**
 * Budget Progress Card Component
 * Displays budget overview with category-wise progress bars
 */

import { useEffect, useState } from 'react'
import { budgetsApi, categoriesApi, bankApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { BudgetProgress, Category, BudgetCategory, BankTransaction } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Loader2, ChevronRight, Receipt, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface BudgetProgressCardProps {
  budgetId: string
  showCategories?: boolean
  refreshKey?: number
}

export function BudgetProgressCard({
  budgetId,
  showCategories = true,
  refreshKey,
}: BudgetProgressCardProps) {
  const [progress, setProgress] = useState<BudgetProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())

  useEffect(() => {
    loadProgress()
  }, [budgetId, refreshKey])

  const loadProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const [progressData, categoriesRes] = await Promise.all([
        budgetsApi.getProgress(budgetId),
        categoriesApi.getAll().catch(() => null),
      ])
      setProgress(progressData)
      if (categoriesRes) {
        const categoriesMap = new Map<string, Category>()
        categoriesRes.categories.forEach((category) => categoriesMap.set(category.id, category))
        setCategories(categoriesMap)
      }
    } catch (err: any) {
      console.error('Failed to load budget progress:', err)
      setError(err.response?.data?.detail || 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const hasLimits = progress.total_allocated > 0
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{progress.budget_name}</CardTitle>
            {/* <CardDescription>
              {formatDate(progress.start_date)} - {progress.end_date ? formatDate(progress.end_date) : 'Ongoing'}
            </CardDescription> */}
          </div>
          <Badge variant={progress.is_over_budget ? 'destructive' : 'default'}>
            {progress.period}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Budget</span>
            {hasLimits ? (
              <span className={progress.is_over_budget ? 'text-red-600 font-semibold' : ''}>
                {formatCurrency(progress.total_spent)} / {formatCurrency(progress.total_allocated)}
              </span>
            ) : (
              <span className="text-muted-foreground">No limits set</span>
            )}
          </div>
          <Progress
            value={hasLimits ? Math.min(Number(progress.percentage_used || 0), 100) : 100}
            className={
              hasLimits
                ? progress.is_over_budget
                  ? 'bg-red-100 [&>div]:bg-red-600'
                  : ''
                : 'bg-muted [&>div]:bg-muted-foreground/30'
            }
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            {hasLimits ? (
              <>
                <span>{Number(progress.percentage_used || 0).toFixed(1)}% used</span>
                <span
                  className={
                    progress.total_remaining < 0
                      ? 'text-red-600 font-semibold'
                      : 'text-green-600'
                  }
                >
                  {formatCurrency(Math.abs(progress.total_remaining))}{' '}
                  {progress.total_remaining < 0 ? 'over' : 'remaining'}
                </span>
              </>
            ) : (
              <>
                <span>{formatCurrency(progress.total_spent)} spent</span>
                <span className="text-muted-foreground">No limits yet</span>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Allocated</div>
            <div className="text-sm font-semibold">
              {hasLimits ? formatCurrency(progress.total_allocated) : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Spent</div>
            <div className="text-sm font-semibold">{formatCurrency(progress.total_spent)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{
              hasLimits && progress.total_remaining < 0 ? 'Over' : 'Remaining'
            }</div>
            <div
              className={`text-sm font-semibold ${hasLimits && progress.total_remaining < 0 ? 'text-red-600' : 'text-green-600'
                }`}
            >
              {hasLimits ? formatCurrency(Math.abs(progress.total_remaining)) : 'No limit'}
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        {(progress.categories_over_budget > 0 || progress.categories_near_limit > 0) && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {progress.categories_over_budget > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {progress.categories_over_budget} over budget
              </Badge>
            )}
            {progress.categories_near_limit > 0 && (
              <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                <TrendingUp className="h-3 w-3" />
                {progress.categories_near_limit} near limit
              </Badge>
            )}
          </div>
        )}

        {/* Category Progress */}
        {showCategories && progress.categories.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="text-sm font-semibold">Category Breakdown</h4>
              <p className="text-xs text-muted-foreground">
                Track spending against each category allocation.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {progress.categories.map((category) => (
                <CategoryProgressItem
                  key={category.id}
                  category={category}
                  displayName={
                    category.category_name ||
                    categories.get(category.category_id)?.name ||
                    'Uncategorized'
                  }
                  startDate={progress.start_date}
                  endDate={progress.end_date}
                  allCategories={categories}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CategoryProgressItemProps {
  category: BudgetCategory
  displayName: string
  startDate: string
  endDate: string | null
  allCategories: Map<string, Category>
}

function CategoryProgressItem({
  category,
  displayName,
  startDate,
  endDate,
  allCategories,
}: CategoryProgressItemProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loadingTxns, setLoadingTxns] = useState(false)

  const hasAllocation = category.allocated_amount > 0
  const percentUsed = Number(category.progress_percent || 0)
  const isOverBudget = Boolean(category.is_over_budget)
  const isNearLimit = Boolean(category.is_near_limit)
  const status = isOverBudget
    ? {
        label: 'Over budget',
        variant: 'destructive' as const,
        className: '',
      }
    : isNearLimit
      ? {
          label: 'Near limit',
          variant: 'outline' as const,
          className: 'border-yellow-300 bg-yellow-50 text-yellow-700',
        }
      : hasAllocation
        ? {
            label: 'On track',
            variant: 'outline' as const,
            className: 'border-green-300 bg-green-50 text-green-700',
          }
        : {
            label: 'No limit',
            variant: 'secondary' as const,
            className: '',
          }

  const loadTransactions = async () => {
    try {
      setLoadingTxns(true)

      // Gather the root category + all its subcategories (budget spending scope)
      const categoryIds = [category.category_id]
      allCategories.forEach((cat) => {
        if (cat.parent_category_id === category.category_id) {
          categoryIds.push(cat.id)
        }
      })

      // Fetch transactions for each category in the scope and merge
      const results = await Promise.all(
        categoryIds.map((catId) =>
          bankApi
            .getAll({
              category_id: catId,
              start_date: startDate,
              end_date: endDate || undefined,
              limit: 200,
            })
            .catch(() => ({ transactions: [], total_count: 0 }))
        )
      )

      const allTxns = results.flatMap((r) => r.transactions)
      // Sort by date descending
      allTxns.sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      )
      setTransactions(allTxns)
    } catch {
      setTransactions([])
    } finally {
      setLoadingTxns(false)
    }
  }

  const handleClick = () => {
    setSheetOpen(true)
    loadTransactions()
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
    })

  return (
    <>
      <div
        className="rounded-lg border bg-background p-3 shadow-sm cursor-pointer transition-colors hover:bg-muted/50 group"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>{displayName}</span>
              {isOverBudget && <AlertCircle className="h-4 w-4 text-red-600" />}
              {isNearLimit && <TrendingUp className="h-4 w-4 text-yellow-600" />}
              {!isOverBudget && !isNearLimit && percentUsed > 0 && hasAllocation && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasAllocation ? 'Budgeted category' : 'Tracking spend only'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {percentUsed.toFixed(1)}% {hasAllocation ? 'used' : 'of spend'}
            </span>
            {hasAllocation ? (
              <span
                className={
                  category.remaining_amount && category.remaining_amount < 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }
              >
                {formatCurrency(Math.abs(category.remaining_amount || 0))}{' '}
                {category.remaining_amount && category.remaining_amount < 0 ? 'over' : 'left'}
              </span>
            ) : (
              <span className="text-muted-foreground">No limit</span>
            )}
          </div>
          <Progress
            value={Math.min(percentUsed, 100)}
            className={
              isOverBudget
                ? 'h-2 bg-red-100 [&>div]:bg-red-600'
                : isNearLimit
                  ? 'h-2 bg-yellow-100 [&>div]:bg-yellow-600'
                  : !hasAllocation
                    ? 'h-2 bg-muted [&>div]:bg-muted-foreground/30'
                    : 'h-2'
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-muted-foreground">Spent</div>
            <div className="text-sm font-semibold">{formatCurrency(category.spent_amount)}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2">
            <div className="text-muted-foreground">{hasAllocation ? 'Allocated' : 'Limit'}</div>
            <div className="text-sm font-semibold">
              {hasAllocation ? formatCurrency(category.allocated_amount) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {/* Header with branded accent */}
          <div className="bg-primary/5 border-b px-6 pt-6 pb-5">
            <SheetHeader className="p-0">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-full bg-primary/10 p-2.5">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-lg">{displayName}</SheetTitle>
                  <SheetDescription className="mt-0.5">
                    {startDate && (
                      <>
                        {new Date(startDate).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}
                        {endDate && ` — ${new Date(endDate).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}`}
                      </>
                    )}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs text-muted-foreground mb-1">Spent</div>
                <div className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : ''}`}>
                  {formatCurrency(category.spent_amount)}
                </div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs text-muted-foreground mb-1">Allocated</div>
                <div className="text-lg font-bold">
                  {hasAllocation ? formatCurrency(category.allocated_amount) : '—'}
                </div>
              </div>
            </div>

            {/* Progress bar in header */}
            {hasAllocation && (
              <div className="mt-4 space-y-1.5">
                <Progress
                  value={Math.min(percentUsed, 100)}
                  className={`h-2 ${
                    isOverBudget
                      ? 'bg-red-100 [&>div]:bg-red-600'
                      : isNearLimit
                        ? 'bg-yellow-100 [&>div]:bg-yellow-600'
                        : ''
                  }`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentUsed.toFixed(1)}% used</span>
                  <span className={category.remaining_amount && category.remaining_amount < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {formatCurrency(Math.abs(category.remaining_amount || 0))}{' '}
                    {category.remaining_amount && category.remaining_amount < 0 ? 'over' : 'left'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction List */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">
                Transactions
              </h4>
              <Badge variant="secondary" className="text-xs font-medium">
                {loadingTxns ? '...' : transactions.length}
              </Badge>
            </div>

            {loadingTxns ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No transactions</p>
                <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                  No transactions found for this category in this budget period.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => {
                  const isIncome = txn.transaction_type === 'credit'
                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 rounded-full p-2 ${
                            isIncome
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {isIncome ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {txn.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDate(txn.transaction_date)}</span>
                            {txn.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate">{txn.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold flex-shrink-0 ml-3 ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                      </p>
                    </div>
                  )
                })}

                {/* Total summary */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Total from {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(category.spent_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
