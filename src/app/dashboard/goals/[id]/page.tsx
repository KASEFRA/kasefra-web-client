'use client'

/**
 * Goal Detail Page
 * Display detailed information about a specific goal
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { goalsApi } from '@/lib/api/goals'
import type { Goal, GoalProgress } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { GoalProgressCard } from '@/components/goals/goal-progress-card'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2,
  Target,
  Calendar,
  TrendingUp,
  DollarSign,
  Flag,
  FileText,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    loadGoal()
  }, [goalId])

  const loadGoal = async () => {
    try {
      setLoading(true)
      const goalRes = await goalsApi.getById(goalId)
      setGoal(goalRes)
    } catch (error) {
      console.error('Failed to load goal:', error)
      toast.error('Failed to load goal details. Please try again.')
      router.push('/dashboard/goals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await goalsApi.delete(goalId)
      
      toast.success('Goal deleted successfully')
      
      router.push('/dashboard/goals')
    } catch (error) {
      console.error('Failed to delete goal:', error)
      toast.error('Failed to delete goal. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'long',
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'paused':
        return <Pause className="h-5 w-5 text-orange-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Target className="h-5 w-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'paused':
        return 'outline'
      case 'cancelled':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!goal) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/goals')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{goal.goal_name}</h1>
            <p className="text-muted-foreground mt-1">
              {getGoalTypeName(goal.goal_type)} Goal
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/goals/${goalId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <GoalProgressCard goalId={goalId} />

      {/* Goal Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Information */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Information</CardTitle>
            <CardDescription>Details about this goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusColor(goal.status)} className="gap-1">
                {getStatusIcon(goal.status)}
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-sm font-medium">
                {goal.is_active ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Target Amount</span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(goal.target_amount)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Current Amount</span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(goal.current_amount)}
              </span>
            </div>

            {goal.monthly_contribution && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Monthly Contribution</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(goal.monthly_contribution)}
                </span>
              </div>
            )}

            {goal.priority > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  <span>Priority</span>
                </div>
                <span className="text-sm font-medium">{goal.priority}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Important dates for this goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Start Date</span>
              </div>
              <span className="text-sm font-medium">
                {formatDate(goal.start_date)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Target Date</span>
              </div>
              <span className="text-sm font-medium">
                {formatDate(goal.target_date)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">
                {formatDate(goal.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">
                {formatDate(goal.updated_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {goal.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {goal.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{goal.goal_name}&quot;? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
