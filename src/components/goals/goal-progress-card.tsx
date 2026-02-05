'use client'

/**
 * Goal Progress Card Component
 * Displays goal progress with visualization and tracking
 */

import { useEffect, useState } from 'react'
import { goalsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { GoalProgress } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, Calendar, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface GoalProgressCardProps {
  goalId: string
  showDetails?: boolean
  refreshKey?: number
}

export function GoalProgressCard({ goalId, showDetails = true, refreshKey }: GoalProgressCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgress()
  }, [goalId, refreshKey])

  const loadProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await goalsApi.getProgress(goalId)
      setProgress(data)
    } catch (err: any) {
      console.error('Failed to load goal progress:', err)
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
        </CardContent>
      </Card>
    )
  }

  if (error || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
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

  const getStatusColor = (status: GoalProgress['status']) => {
    if (status === 'completed') return 'default'
    if (status === 'cancelled') return 'secondary'
    if (status === 'paused') return 'outline'
    return progress.on_track ? 'default' : 'destructive'
  }

  const getStatusText = (status: GoalProgress['status']) => {
    const statusMap: Record<string, string> = {
      active: progress.on_track ? 'On Track' : 'Behind Schedule',
      completed: 'Completed',
      paused: 'Paused',
      cancelled: 'Cancelled',
    }
    return statusMap[status] || status
  }

  const progressPercentage = Number(progress.progress_percentage) || 0
  const currentAmount = Number(progress.current_amount) || 0
  const targetAmount = Number(progress.target_amount) || 0
  const remainingAmount = Number(progress.remaining_amount) || 0
  const requiredMonthly = Number(progress.required_monthly_contribution) || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {progress.goal_name}
            </CardTitle>
            <CardDescription>
              {progress.goal_type.replace('_', ' ').charAt(0).toUpperCase() +
               progress.goal_type.replace('_', ' ').slice(1)}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(progress.status)}>
            {getStatusText(progress.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className={progressPercentage >= 100 ? 'text-green-600 font-semibold' : ''}>
              {formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}
            </span>
          </div>
          <Progress
            value={Math.min(progressPercentage, 100)}
            className={progressPercentage >= 100 ? '[&>div]:bg-green-600' : ''}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(1)}% complete</span>
            <span className={remainingAmount > 0 ? 'text-muted-foreground' : 'text-green-600'}>
              {formatCurrency(Math.abs(remainingAmount))} {remainingAmount > 0 ? 'remaining' : 'over target'}
            </span>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Days Remaining</span>
                </div>
                <div className={`text-lg font-semibold ${progress.days_remaining < 30 && progressPercentage < 100 ? 'text-orange-600' : ''}`}>
                  {progress.days_remaining > 0 ? progress.days_remaining : 0} days
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Required Monthly</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(requiredMonthly)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Time Elapsed</span>
                </div>
                <div className="text-lg font-semibold">
                  {progress.days_elapsed} days
                </div>
              </div>

              {progress.monthly_contribution && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>Monthly Target</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(Number(progress.monthly_contribution))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(progress.start_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Target Date</p>
                  <p className="font-medium">{formatDate(progress.target_date)}</p>
                </div>
              </div>
            </div>

          </>
        )}
      </CardContent>
    </Card>
  )
}
