'use client'

/**
 * Budget Progress Widget
 * Displays current budget progress on the dashboard
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { budgetsApi, categoriesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Budget, BudgetProgress, Category } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function BudgetProgressWidget() {
  const router = useRouter()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [progress, setProgress] = useState<BudgetProgress | null>(null)
  const [categories, setCategories] = useState<Map<string, Category>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load current budget and categories
      const [budgetRes, categoriesRes] = await Promise.all([
        budgetsApi.getCurrent().catch(() => null),
        categoriesApi.getAll(),
      ])

      if (budgetRes) {
        setBudget(budgetRes)

        // Load budget progress
        const progressRes = await budgetsApi.getProgress(budgetRes.id)
        setProgress(progressRes)
      }

      // Create categories map
      const categoriesMap = new Map<string, Category>()
      categoriesRes.categories.forEach((cat) => categoriesMap.set(cat.id, cat))
      setCategories(categoriesMap)
    } catch (error) {
      console.error('Failed to load budget progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressTextColor = (percentUsed: number, alertThreshold: number) => {
    if (percentUsed >= 100) return 'text-red-600 dark:text-red-400'
    if (percentUsed >= alertThreshold) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!budget || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No active budget</p>
            <p className="text-xs text-muted-foreground mb-4">
              Create a budget to start tracking your spending
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/budgets')}
            >
              Create Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate overall budget stats
  const totalAllocated = progress.categories.reduce(
    (sum, cat) => sum + cat.allocated_amount,
    0
  )
  const totalSpent = progress.categories.reduce((sum, cat) => sum + cat.spent_amount, 0)
  const hasLimits = totalAllocated > 0
  const overallPercent = hasLimits ? (totalSpent / totalAllocated) * 100 : 0
  const remaining = totalAllocated - totalSpent
  const totalSpentAmount = totalSpent

  // Get top 3 categories by spending
  const topCategories = [...progress.categories]
    .sort((a, b) => b.spent_amount - a.spent_amount)
    .slice(0, 3)

  // Check for over-budget categories
  const overBudgetCount = progress.categories.filter(
    (cat) => cat.allocated_amount > 0 && cat.spent_amount > cat.allocated_amount
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>{budget.name}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/budgets/${budget.id}`)}
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            {hasLimits ? (
              <span className={`text-sm font-semibold ${getProgressTextColor(overallPercent, 80)}`}>
                {overallPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No limits set</span>
            )}
          </div>
          <Progress
            value={hasLimits ? Math.min(overallPercent, 100) : 100}
            className={hasLimits ? 'h-2' : 'h-2 bg-muted [&>div]:bg-muted-foreground/30'}
          />
          <div className="flex justify-between items-center mt-2">
            {hasLimits ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(totalSpent)} spent
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(remaining)} remaining
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(totalSpent)} spent
                </span>
                <span className="text-xs text-muted-foreground">No limits yet</span>
              </>
            )}
          </div>
        </div>

        {/* Alert for over-budget */}
        {overBudgetCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {overBudgetCount} {overBudgetCount === 1 ? 'category is' : 'categories are'} over
              budget
            </AlertDescription>
          </Alert>
        )}

        {/* Top Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Top Spending Categories</h4>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          {topCategories.map((cat) => {
            const category = categories.get(cat.category_id)
            const hasAllocation = cat.allocated_amount > 0
            const percentUsed = hasAllocation
              ? (cat.spent_amount / cat.allocated_amount) * 100
              : totalSpentAmount > 0
              ? (cat.spent_amount / totalSpentAmount) * 100
              : 0
            const isOverBudget = hasAllocation && percentUsed >= 100
            const isNearLimit =
              hasAllocation && percentUsed >= cat.alert_threshold * 100

            return (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {category?.name || 'Unknown Category'}
                    </span>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        Over Budget
                      </Badge>
                    )}
                    {!isOverBudget && isNearLimit && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                        Near Limit
                      </Badge>
                    )}
                    {!hasAllocation && (
                      <Badge variant="outline" className="text-xs">
                        No Limit
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      hasAllocation
                        ? getProgressTextColor(percentUsed, cat.alert_threshold * 100)
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(cat.spent_amount)}
                  </span>
                </div>
                <Progress
                  value={Math.min(percentUsed, 100)}
                  className={`h-1.5 ${
                    isOverBudget
                      ? '[&>div]:bg-red-500'
                      : isNearLimit
                      ? '[&>div]:bg-yellow-500'
                      : !hasAllocation
                      ? 'bg-muted [&>div]:bg-muted-foreground/30'
                      : '[&>div]:bg-green-500'
                  }`}
                />
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    {hasAllocation ? `${formatCurrency(cat.allocated_amount)} budgeted` : 'No limit'}
                  </span>
                  <span className="text-xs text-muted-foreground">{percentUsed.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* View All Button */}
        {progress.categories.length > 3 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/dashboard/budgets/${budget.id}`)}
          >
            View All {progress.categories.length} Categories
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
