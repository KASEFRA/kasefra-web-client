'use client'

/**
 * Active Goals Widget
 * Displays top 3 active financial goals on the dashboard
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { goalsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Goal } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, ArrowRight, TrendingUp, Calendar, Plus } from 'lucide-react'

export function ActiveGoalsWidget() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load active goals
      const response = await goalsApi.getActive()
      // Take top 3 goals by priority
      const topGoals = (response.goals || [])
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)
      setGoals(topGoals)
    } catch (error) {
      console.error('Failed to load active goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGoalTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      savings: '💰',
      purchase: '🛒',
      debt_payoff: '💳',
      investment: '📈',
      hajj: '🕋',
      emergency_fund: '🚨',
      education: '🎓',
      retirement: '🏖️',
      other: '🎯',
    }
    return icons[type] || '🎯'
  }

  const getGoalTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Goals</CardTitle>
          <CardDescription>Your financial targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Goals</CardTitle>
          <CardDescription>Your financial targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No active goals</p>
            <p className="text-xs text-muted-foreground mb-4">
              Set financial goals to track your progress
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/goals')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
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
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your financial targets</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/goals')}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target_amount > 0
            ? (goal.current_amount / goal.target_amount) * 100
            : 0
          const remaining = goal.target_amount - goal.current_amount
          const daysRemaining = getDaysRemaining(goal.target_date)
          const isNearDeadline = daysRemaining < 30 && daysRemaining > 0
          const isPastDeadline = daysRemaining < 0

          return (
            <div
              key={goal.id}
              className="space-y-2.5 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/goals/${goal.id}`)}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getGoalTypeIcon(goal.goal_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{goal.goal_name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getGoalTypeLabel(goal.goal_type)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    progress >= 100
                      ? 'default'
                      : progress >= 75
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {progress.toFixed(0)}%
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {formatCurrency(goal.current_amount)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(goal.target_amount)}
                  </span>
                </div>
              </div>

              {/* Goal Details */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{formatCurrency(remaining)} to go</span>
                </div>
                <div className="flex items-center gap-2">
                  {isPastDeadline ? (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  ) : isNearDeadline ? (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {daysRemaining} days left
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(goal.target_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Contribution */}
              {goal.monthly_contribution && goal.monthly_contribution > 0 && (
                <div className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Monthly Target</span>
                  <span className="font-medium">
                    {formatCurrency(goal.monthly_contribution)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
