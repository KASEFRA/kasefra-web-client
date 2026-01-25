'use client'

/**
 * Budget Analytics Container
 * Displays charts and analytics for budget performance
 */

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryBreakdownChart } from './charts/category-breakdown-chart'
import { SpendingProgressChart } from './charts/spending-progress-chart'
import type { BudgetProgress, Category } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Wallet, Calendar } from 'lucide-react'
import { categoriesApi } from '@/lib/api'

interface BudgetAnalyticsProps {
  budgetProgress: BudgetProgress
}

export function BudgetAnalytics({ budgetProgress }: BudgetAnalyticsProps) {
  const totalAllocated = Number(budgetProgress.total_allocated)
  const totalSpent = Number(budgetProgress.total_spent)
  const totalRemaining = Number(budgetProgress.total_remaining)
  const percentageUsed = Number(budgetProgress.percentage_used)
  const hasLimits = totalAllocated > 0
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())

  useEffect(() => {
    let isMounted = true
    categoriesApi
      .getAll()
      .then((response) => {
        if (!isMounted) return
        const map = new Map<string, Category>()
        response.categories.forEach((category) => map.set(category.id, category))
        setCategories(map)
      })
      .catch(() => null)
    return () => {
      isMounted = false
    }
  }, [])

  const categoriesWithNames = useMemo(() => {
    return budgetProgress.categories.map((category) => ({
      ...category,
      category_name:
        category.category_name ||
        categories.get(category.category_id)?.name ||
        'Uncategorized',
    }))
  }, [budgetProgress.categories, categories])

  // Calculate days in period (simplified)
  const getDaysInPeriod = () => {
    const start = new Date(budgetProgress.start_date)
    const end = budgetProgress.end_date ? new Date(budgetProgress.end_date) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysRemaining = () => {
    if (!budgetProgress.end_date) return null
    const end = new Date(budgetProgress.end_date)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysInPeriod = getDaysInPeriod()
  const daysRemaining = getDaysRemaining()

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  {hasLimits ? formatCurrency(totalAllocated) : 'No limits'}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasLimits ? `${percentageUsed.toFixed(1)}% used` : 'No limits set'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${hasLimits && totalRemaining < 0 ? 'text-destructive' : ''}`}>
                  {hasLimits ? formatCurrency(totalRemaining) : '—'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Period</p>
                <p className="text-2xl font-bold">{daysInPeriod}d</p>
                {daysRemaining !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysRemaining > 0 ? `${daysRemaining}d left` : 'Ended'}
                  </p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CategoryBreakdownChart categories={categoriesWithNames} />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <SpendingProgressChart categories={categoriesWithNames} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
