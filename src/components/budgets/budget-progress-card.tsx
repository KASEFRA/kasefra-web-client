'use client'

/**
 * Budget Progress Card Component
 * Displays budget overview with category-wise progress bars
 */

import { useEffect, useState } from 'react'
import { budgetsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { BudgetProgress } from '@/types'
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

  useEffect(() => {
    loadProgress()
  }, [budgetId])

  const loadProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await budgetsApi.getProgress(budgetId)
      setProgress(data)
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
            <span className={progress.is_over_budget ? 'text-red-600 font-semibold' : ''}>
              {formatCurrency(progress.total_spent)} / {formatCurrency(progress.total_allocated)}
            </span>
          </div>
          <Progress
            value={Math.min(Number(progress.percentage_used || 0), 100)}
            className={progress.is_over_budget ? 'bg-red-100 [&>div]:bg-red-600' : ''}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{Number(progress.percentage_used || 0).toFixed(1)}% used</span>
            <span className={progress.total_remaining < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
              {formatCurrency(Math.abs(progress.total_remaining))} {progress.total_remaining < 0 ? 'over' : 'remaining'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Allocated</div>
            <div className="text-sm font-semibold">{formatCurrency(progress.total_allocated)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Spent</div>
            <div className="text-sm font-semibold">{formatCurrency(progress.total_spent)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Remaining</div>
            <div className={`text-sm font-semibold ${progress.total_remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(progress.total_remaining))}
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
              <CategoryProgressItem key={category.id} category={category} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CategoryProgressItemProps {
  category: {
    category_name: string | null
    allocated_amount: number
    spent_amount: number
    remaining_amount: number | null
    percentage_used: number | null
    is_over_budget: boolean | null
    alert_threshold: number
  }
}

function CategoryProgressItem({ category }: CategoryProgressItemProps) {
  const percentUsed = Number(category.percentage_used || 0)
  const isOverBudget = category.is_over_budget || false
  const isNearLimit = !isOverBudget && percentUsed >= Number(category.alert_threshold || 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{category.category_name || 'Uncategorized'}</span>
          {isOverBudget && <AlertCircle className="h-4 w-4 text-red-600" />}
          {isNearLimit && <TrendingUp className="h-4 w-4 text-yellow-600" />}
          {!isOverBudget && !isNearLimit && percentUsed > 0 && <CheckCircle className="h-4 w-4 text-green-600" />}
        </div>
        <span className={isOverBudget ? 'text-red-600 font-semibold' : ''}>
          {formatCurrency(category.spent_amount)} / {formatCurrency(category.allocated_amount)}
        </span>
      </div>
      <Progress 
        value={Math.min(percentUsed, 100)} 
        className={
          isOverBudget 
            ? 'bg-red-100 [&>div]:bg-red-600' 
            : isNearLimit 
            ? 'bg-yellow-100 [&>div]:bg-yellow-600' 
            : ''
        }
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{percentUsed.toFixed(1)}% used</span>
        <span className={category.remaining_amount && category.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'}>
          {formatCurrency(Math.abs(category.remaining_amount || 0))} {category.remaining_amount && category.remaining_amount < 0 ? 'over' : 'left'}
        </span>
      </div>
    </div>
  )
}
