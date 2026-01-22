'use client'

/**
 * Budget Alerts Panel
 * Displays budget alerts and warnings
 */

import type { BudgetProgress } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface BudgetAlertsPanelProps {
  budgetProgress: BudgetProgress
}

export function BudgetAlertsPanel({ budgetProgress }: BudgetAlertsPanelProps) {
  const overBudgetCategories = budgetProgress.categories.filter(
    (cat) => cat.is_over_budget
  )

  const nearLimitCategories = budgetProgress.categories.filter(
    (cat) =>
      !cat.is_over_budget &&
      cat.alert_enabled &&
      Number(cat.percentage_used) >= cat.alert_threshold * 100
  )

  const hasAlerts = overBudgetCategories.length > 0 || nearLimitCategories.length > 0
  const totalRemaining = Number(budgetProgress.total_remaining)
  const isOverallOverBudget = budgetProgress.is_over_budget

  if (!hasAlerts && !isOverallOverBudget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>Monitor your spending alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              All on Track!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              You're staying within your budget limits across all categories.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Alerts</CardTitle>
        <CardDescription>
          {budgetProgress.categories_over_budget} over budget, {budgetProgress.categories_near_limit} near limit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Budget Alert */}
        {isOverallOverBudget && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Overall Budget Exceeded</AlertTitle>
            <AlertDescription>
              You've exceeded your total budget by{' '}
              <strong>{formatCurrency(Math.abs(totalRemaining))}</strong>. Review your spending in
              over-budget categories.
            </AlertDescription>
          </Alert>
        )}

        {/* Over Budget Categories */}
        {overBudgetCategories.map((category) => {
          const overspent = Number(category.spent_amount) - Number(category.allocated_amount)
          const percentOver = ((overspent / Number(category.allocated_amount)) * 100).toFixed(1)

          return (
            <Alert key={category.id} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{category.category_name}</AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    Spent <strong>{formatCurrency(Number(category.spent_amount))}</strong> of{' '}
                    <strong>{formatCurrency(Number(category.allocated_amount))}</strong> budget
                  </p>
                  <p className="text-sm">
                    Over budget by <strong>{formatCurrency(overspent)}</strong> ({percentOver}% over limit)
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    💡 Consider reducing spending in this category or adjusting your budget.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )
        })}

        {/* Near Limit Categories */}
        {nearLimitCategories.map((category) => {
          const remaining = Number(category.remaining_amount) || 0
          const percentageUsed = Number(category.percentage_used)

          return (
            <Alert
              key={category.id}
              className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-900 dark:text-yellow-100">
                {category.category_name}
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <div className="space-y-1">
                  <p>
                    Spent <strong>{formatCurrency(Number(category.spent_amount))}</strong> of{' '}
                    <strong>{formatCurrency(Number(category.allocated_amount))}</strong> budget
                  </p>
                  <p className="text-sm">
                    {percentageUsed.toFixed(1)}% used, <strong>{formatCurrency(remaining)}</strong> remaining
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    ⚠️ You're approaching your limit. Monitor spending in this category.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )
        })}
      </CardContent>
    </Card>
  )
}
