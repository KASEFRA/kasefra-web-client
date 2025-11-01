'use client'

/**
 * Budgets Page
 * Manage budgets and track spending progress
 */

import { useEffect, useState } from 'react'
import { budgetsApi } from '@/lib/api'
import type { Budget, BudgetProgress } from '@/types'
import { Plus, Edit, Trash2, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [currentBudget, setCurrentBudget] = useState<BudgetProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgets()
    loadCurrentBudget()
  }, [])

  const loadBudgets = async () => {
    try {
      const response = await budgetsApi.getAll()
      setBudgets(response.budgets)
    } catch (error) {
      console.error('Failed to load budgets:', error)
    }
  }

  const loadCurrentBudget = async () => {
    try {
      setLoading(true)
      const budget = await budgetsApi.getCurrent()
      const progress = await budgetsApi.getProgress(budget.id)
      setCurrentBudget(progress)
    } catch (error) {
      console.error('Failed to load current budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return
    }

    try {
      await budgetsApi.delete(budgetId)
      await loadBudgets()
      if (currentBudget?.budget_id === budgetId) {
        await loadCurrentBudget()
      }
    } catch (error) {
      console.error('Failed to delete budget:', error)
      alert('Failed to delete budget')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading budgets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <p className="mt-1 text-muted-foreground">
            Track your spending and stay on budget
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/budgets/new'}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Current Budget Progress */}
      {currentBudget ? (
        <div className="space-y-6">
          {/* Budget Overview */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {currentBudget.budget_name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPeriod(currentBudget.period)} Budget
                  {currentBudget.start_date && ` • Started ${new Date(currentBudget.start_date).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = `/dashboard/budgets/${currentBudget.budget_id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>

            {/* Overall Progress */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-background p-4">
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(currentBudget.total_allocated)}
                </p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(currentBudget.total_spent)}
                </p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`mt-1 text-2xl font-bold ${
                  currentBudget.is_over_budget ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(currentBudget.total_remaining)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className={`font-semibold ${
                  currentBudget.percentage_used > 100 ? 'text-red-600' : 'text-foreground'
                }`}>
                  {currentBudget.percentage_used.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(currentBudget.percentage_used, 100)}
                className="mt-2"
              />
            </div>

            {/* Warnings */}
            {(currentBudget.categories_over_budget > 0 || currentBudget.categories_near_limit > 0) && (
              <div className="mt-4 flex gap-4">
                {currentBudget.categories_over_budget > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{currentBudget.categories_over_budget} categories over budget</span>
                  </div>
                )}
                {currentBudget.categories_near_limit > 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{currentBudget.categories_near_limit} categories near limit</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Category Breakdown</h3>
            <div className="mt-4 space-y-4">
              {currentBudget.categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {category.category_name || 'Uncategorized'}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(category.spent_amount)} of {formatCurrency(category.allocated_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        category.is_over_budget ? 'text-red-600' : 'text-foreground'
                      }`}>
                        {formatCurrency(category.remaining_amount || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">remaining</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(category.percentage_used || 0).toFixed(1)}% used</span>
                      {category.is_over_budget && (
                        <span className="text-red-600">Over budget</span>
                      )}
                    </div>
                    <Progress
                      value={Math.min(category.percentage_used || 0, 100)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* No Budget State */
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No active budget</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first budget to start tracking your spending
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.href = '/dashboard/budgets/new'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </div>
      )}

      {/* All Budgets List */}
      {budgets.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">All Budgets</h3>
          <div className="mt-4 space-y-2">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div>
                  <h4 className="font-semibold text-foreground">{budget.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPeriod(budget.period)} • {budget.budget_type}
                    {!budget.is_active && <span className="ml-2 text-gray-500">(Inactive)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/dashboard/budgets/${budget.id}`}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
