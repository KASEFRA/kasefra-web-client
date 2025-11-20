'use client'

/**
 * Goals List Component
 * Display all goals with progress and actions
 */

import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/currency'
import type { Goal } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GoalsListProps {
  goals: Goal[]
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  onView?: (goal: Goal) => void
}

export function GoalsList({ goals, onEdit, onDelete, onView }: GoalsListProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getGoalTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      savings: 'Savings',
      purchase: 'Purchase',
      debt_payoff: 'Debt Payoff',
      investment: 'Investment',
      hajj: 'Hajj',
      emergency_fund: 'Emergency Fund',
      education: 'Education',
      retirement: 'Retirement',
      other: 'Other',
    }
    return typeMap[type] || type
  }

  const getStatusColor = (status: string, progressPercentage: number) => {
    if (status === 'completed') return 'default'
    if (status === 'cancelled') return 'secondary'
    if (status === 'paused') return 'outline'
    return progressPercentage >= 75 ? 'default' : progressPercentage >= 50 ? 'outline' : 'destructive'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const calculateProgress = (goal: Goal) => {
    return (goal.current_amount / goal.target_amount) * 100
  }

  const calculateDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleView = (goal: Goal) => {
    if (onView) {
      onView(goal)
    } else {
      router.push(`/dashboard/goals/${goal.id}`)
    }
  }

  const handleEdit = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(goal)
    } else {
      router.push(`/dashboard/goals/${goal.id}/edit`)
    }
  }

  const handleDelete = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(goal)
    }
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Create your first goal to start tracking your savings and achieving your financial dreams.
          </p>
          <Button onClick={() => router.push('/dashboard/goals/new')}>
            Create Your First Goal
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const progressPercentage = calculateProgress(goal)
        const daysRemaining = calculateDaysRemaining(goal.target_date)
        
        return (
          <Card 
            key={goal.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleView(goal)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-1">{goal.goal_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{getGoalTypeName(goal.goal_type)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(goal)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleEdit(goal, e)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Goal
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={(e) => handleDelete(goal, e)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Goal
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status Badge */}
              <div className="flex gap-2">
                <Badge variant={getStatusColor(goal.status, progressPercentage)} className="gap-1">
                  {getStatusIcon(goal.status)}
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </Badge>
                {!goal.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>

              {/* Amount Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(progressPercentage, 100)} 
                  className={progressPercentage >= 100 ? '[&>div]:bg-green-600' : ''}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressPercentage.toFixed(1)}%</span>
                  <span>{formatCurrency(goal.target_amount - goal.current_amount)} left</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(goal.target_date)}</span>
                </div>
                <span className={daysRemaining < 30 && goal.status === 'active' ? 'text-orange-600 font-medium' : ''}>
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                </span>
              </div>

              {/* Monthly Contribution */}
              {goal.monthly_contribution && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Monthly: {formatCurrency(goal.monthly_contribution)}</span>
                </div>
              )}

              {/* Priority */}
              {goal.priority > 0 && (
                <Badge variant="outline" className="text-xs">
                  Priority: {goal.priority}
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
