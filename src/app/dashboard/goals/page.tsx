'use client'

/**
 * Goals Page
 * Manage financial goals and track progress
 */

import { useEffect, useState } from 'react'
import { goalsApi } from '@/lib/api'
import type { Goal, GoalProgress, GoalSummary, GoalType, GoalStatus } from '@/types'
import { Plus, Edit, Trash2, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [summary, setSummary] = useState<GoalSummary | null>(null)
  const [goalProgresses, setGoalProgresses] = useState<Record<string, GoalProgress>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | GoalType | GoalStatus>('all')

  useEffect(() => {
    loadGoals()
    loadSummary()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await goalsApi.getAll()
      setGoals(response.goals)

      // Load progress for each goal
      const progresses: Record<string, GoalProgress> = {}
      for (const goal of response.goals) {
        try {
          const progress = await goalsApi.getProgress(goal.id)
          progresses[goal.id] = progress
        } catch (error) {
          console.error(`Failed to load progress for goal ${goal.id}:`, error)
        }
      }
      setGoalProgresses(progresses)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const summaryData = await goalsApi.getSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load goals summary:', error)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return
    }

    try {
      await goalsApi.delete(goalId)
      await loadGoals()
      await loadSummary()
    } catch (error) {
      console.error('Failed to delete goal:', error)
      alert('Failed to delete goal')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatGoalType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'savings':
      case 'emergency_fund':
        return '💰'
      case 'purchase':
        return '🛍️'
      case 'debt_payoff':
        return '💳'
      case 'investment':
        return '📈'
      case 'hajj':
        return '🕋'
      case 'education':
        return '🎓'
      case 'retirement':
        return '🏖️'
      default:
        return '🎯'
    }
  }

  const filteredGoals = filter === 'all'
    ? goals
    : goals.filter(goal => goal.goal_type === filter || goal.status === filter)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="mt-1 text-muted-foreground">
            Track your financial goals and stay motivated
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/goals/new'}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Goals</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{summary.total_goals}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.active_goals} active • {summary.completed_goals} completed
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Target</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatCurrency(summary.total_target_amount)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {summary.overall_progress_percentage.toFixed(1)}%
            </p>
            <Progress value={summary.overall_progress_percentage} className="mt-2" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Goal Status</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {summary.goals_on_track}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              On track • {summary.goals_behind_schedule} behind
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Goals
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Goals List */}
      {filteredGoals.length > 0 ? (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const progress = goalProgresses[goal.id]
            return (
              <div
                key={goal.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getGoalTypeIcon(goal.goal_type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {goal.goal_name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatGoalType(goal.goal_type)}
                          {goal.status === 'completed' && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                          {goal.status === 'paused' && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                              Paused
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {goal.description && (
                      <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
                    )}

                    {/* Progress Info */}
                    {progress && (
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {formatCurrency(goal.current_amount, goal.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Target</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {formatCurrency(goal.target_amount, goal.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {formatCurrency(progress.remaining_amount, goal.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Days Left</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {progress.days_remaining}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {progress.progress_percentage.toFixed(1)}%
                              </span>
                              {progress.on_track ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  On track
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                  <AlertCircle className="h-3 w-3" />
                                  Behind
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={Math.min(progress.progress_percentage, 100)}
                            className="mt-2"
                          />
                        </div>

                        {/* Required Contribution */}
                        {progress.required_monthly_contribution > 0 && (
                          <div className="rounded-lg bg-background p-3">
                            <p className="text-xs text-muted-foreground">
                              Required monthly contribution to reach goal
                            </p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {formatCurrency(progress.required_monthly_contribution, goal.currency)}/month
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/goals/${goal.id}/edit`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* No Goals State */
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'all'
              ? 'Create your first goal to start tracking your financial progress'
              : `You don't have any ${filter} goals at the moment`
            }
          </p>
          {filter === 'all' && (
            <Button
              className="mt-4"
              onClick={() => window.location.href = '/dashboard/goals/new'}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
