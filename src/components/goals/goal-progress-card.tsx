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
import { Target, TrendingUp, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface GoalProgressCardProps {
  goalId: string
  showDetails?: boolean
}

export function GoalProgressCard({ goalId, showDetails = true }: GoalProgressCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgress()
  }, [goalId])

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

  const getStatusColor = (goal: GoalProgress['goal']) => {
    if (goal.status === 'completed') return 'default'
    if (goal.status === 'cancelled') return 'secondary'
    if (goal.status === 'paused') return 'outline'
    return progress.on_track ? 'default' : 'destructive'
  }

  const getStatusText = (goal: GoalProgress['goal']) => {
    const statusMap: Record<string, string> = {
      active: progress.on_track ? 'On Track' : 'Behind Schedule',
      completed: 'Completed',
      paused: 'Paused',
      cancelled: 'Cancelled',
    }
    return statusMap[goal.status] || goal.status
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {progress.goal.goal_name}
            </CardTitle>
            <CardDescription>
              {progress.goal.goal_type.replace('_', ' ').charAt(0).toUpperCase() + 
               progress.goal.goal_type.replace('_', ' ').slice(1)}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(progress.goal)}>
            {getStatusText(progress.goal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className={progress.progress_percentage >= 100 ? 'text-green-600 font-semibold' : ''}>
              {formatCurrency(progress.goal.current_amount)} / {formatCurrency(progress.goal.target_amount)}
            </span>
          </div>
          <Progress 
            value={Math.min(progress.progress_percentage, 100)} 
            className={progress.progress_percentage >= 100 ? '[&>div]:bg-green-600' : ''}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{progress.progress_percentage.toFixed(1)}% complete</span>
            <span className={progress.remaining_amount > 0 ? 'text-muted-foreground' : 'text-green-600'}>
              {formatCurrency(Math.abs(progress.remaining_amount))} {progress.remaining_amount > 0 ? 'remaining' : 'over target'}
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
                <div className={`text-lg font-semibold ${progress.days_remaining < 30 && progress.progress_percentage < 100 ? 'text-orange-600' : ''}`}>
                  {progress.days_remaining > 0 ? progress.days_remaining : 0} days
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Required Monthly</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(progress.required_monthly_contribution)}
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

              {progress.goal.monthly_contribution && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>Monthly Target</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(progress.goal.monthly_contribution)}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(progress.goal.start_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Target Date</p>
                  <p className="font-medium">{formatDate(progress.goal.target_date)}</p>
                </div>
              </div>
              
              {progress.projected_completion_date && progress.goal.status === 'active' && (
                <div className="flex items-center gap-2 text-xs">
                  {progress.on_track ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">
                        Projected completion: {formatDate(progress.projected_completion_date)}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600">
                        At current rate, completion by: {formatDate(progress.projected_completion_date)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {progress.goal.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{progress.goal.description}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
