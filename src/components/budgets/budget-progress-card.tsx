'use client'

/**
 * Budget Progress Card Component
 * Displays budget overview with category-wise progress bars
 */

import { useEffect, useState } from 'react'
import { budgetsApi, categoriesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { BudgetProgress, Category, BudgetCategory } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface BudgetProgressCardProps {
  budgetId: string
  showCategories?: boolean
}

export function BudgetProgressCard({ budgetId, showCategories = true }: BudgetProgressCardProps) {
  const [progress, setProgress] = useState<BudgetProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())

  useEffect(() => {
    loadProgress()
  }, [budgetId])

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
  const totalSpent = progress.total_spent

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{progress.budget_name}</CardTitle>
            <CardDescription>
              {formatDate(progress.start_date)} - {progress.end_date ? formatDate(progress.end_date) : 'Ongoing'}
            </CardDescription>
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
            <div className="text-xs text-muted-foreground mb-1">Remaining</div>
            <div
              className={`text-sm font-semibold ${
                hasLimits && progress.total_remaining < 0 ? 'text-red-600' : 'text-green-600'
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
            <h4 className="text-sm font-semibold">Category Breakdown</h4>
            {progress.categories.map((category) => (
              <CategoryProgressItem
                key={category.id}
                category={category}
                displayName={
                category.category_name ||
                  categories.get(category.category_id)?.name ||
                  'Uncategorized'
                }
                totalSpent={totalSpent}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CategoryProgressItemProps {
  category: BudgetCategory
  displayName: string
  totalSpent: number
}

function CategoryProgressItem({
  category,
  displayName,
  totalSpent,
}: CategoryProgressItemProps) {
  const hasAllocation = category.allocated_amount > 0
  const thresholdPct = Number(category.alert_threshold || 0) * 100
  const percentUsed = hasAllocation
    ? Number(category.percentage_used || 0)
    : totalSpent > 0
    ? (category.spent_amount / totalSpent) * 100
    : 0
  const isOverBudget = hasAllocation && (category.is_over_budget || false)
  const isNearLimit = hasAllocation && !isOverBudget && percentUsed >= thresholdPct

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{displayName}</span>
          {isOverBudget && <AlertCircle className="h-4 w-4 text-red-600" />}
          {isNearLimit && <TrendingUp className="h-4 w-4 text-yellow-600" />}
          {!isOverBudget && !isNearLimit && percentUsed > 0 && hasAllocation && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
        {hasAllocation ? (
          <span className={isOverBudget ? 'text-red-600 font-semibold' : ''}>
            {formatCurrency(category.spent_amount)} / {formatCurrency(category.allocated_amount)}
          </span>
        ) : (
          <span className="text-muted-foreground">{formatCurrency(category.spent_amount)} spent</span>
        )}
      </div>
      <Progress 
        value={Math.min(percentUsed, 100)} 
        className={
          isOverBudget
            ? 'bg-red-100 [&>div]:bg-red-600'
            : isNearLimit
            ? 'bg-yellow-100 [&>div]:bg-yellow-600'
            : !hasAllocation
            ? 'bg-muted [&>div]:bg-muted-foreground/30'
            : ''
        }
      />
      <div className="flex justify-between text-xs text-muted-foreground">
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
    </div>
  )
}
