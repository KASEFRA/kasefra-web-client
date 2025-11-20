'use client'

/**
 * Edit Goal Page
 * Form for editing an existing financial goal
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { goalsApi } from '@/lib/api/goals'
import { accountsApi } from '@/lib/api/accounts'
import { GoalType, GoalStatus } from '@/types'
import type { Account, Goal } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, Target } from 'lucide-react'
import { toast } from 'sonner'

const goalSchema = z.object({
  goal_name: z.string().min(1, 'Goal name is required').max(100, 'Goal name is too long'),
  goal_type: z.nativeEnum(GoalType),
  target_amount: z.number().min(0.01, 'Target amount must be greater than 0'),
  current_amount: z.number().min(0, 'Current amount cannot be negative').optional(),
  start_date: z.string().min(1, 'Start date is required'),
  target_date: z.string().min(1, 'Target date is required'),
  monthly_contribution: z.number().min(0, 'Monthly contribution cannot be negative').optional(),
  account_id: z.string().optional(),
  priority: z.number().min(0).max(10).optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  status: z.nativeEnum(GoalStatus).optional(),
}).refine((data) => {
  const start = new Date(data.start_date)
  const target = new Date(data.target_date)
  return target > start
}, {
  message: 'Target date must be after start date',
  path: ['target_date'],
})

type GoalFormData = z.infer<typeof goalSchema>

export default function EditGoalPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [goal, setGoal] = useState<Goal | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  })

  const goalType = watch('goal_type')

  useEffect(() => {
    loadGoal()
    loadAccounts()
  }, [goalId])

  const loadGoal = async () => {
    try {
      setLoading(true)
      const goalRes = await goalsApi.getById(goalId)
      setGoal(goalRes)
      
      // Populate form with existing data
      reset({
        goal_name: goalRes.goal_name,
        goal_type: goalRes.goal_type,
        target_amount: goalRes.target_amount,
        current_amount: goalRes.current_amount,
        start_date: goalRes.start_date,
        target_date: goalRes.target_date,
        monthly_contribution: goalRes.monthly_contribution || undefined,
        account_id: goalRes.account_id || undefined,
        priority: goalRes.priority,
        notes: goalRes.notes || undefined,
        status: goalRes.status,
      })
    } catch (error) {
      console.error('Failed to load goal:', error)
      toast.error('Failed to load goal details. Please try again.')
      router.push('/dashboard/goals')
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await accountsApi.getAll()
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const onSubmit = async (data: GoalFormData) => {
    try {
      setSubmitting(true)
      
      // Prepare the data for API
      const goalData: any = {
        goal_name: data.goal_name,
        target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        start_date: data.start_date,
        target_date: data.target_date,
        monthly_contribution: data.monthly_contribution || null,
        priority: data.priority || 0,
        notes: data.notes || null,
        status: data.status as GoalStatus,
      }

      if (data.account_id) {
        goalData.account_id = data.account_id
      }

      await goalsApi.update(goalId, goalData)
      
      toast.success('Goal updated successfully!')
      router.push(`/dashboard/goals/${goalId}`)
    } catch (error: any) {
      console.error('Failed to update goal:', error)
      toast.error(error.response?.data?.detail || 'Failed to update goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const goalTypes: { value: GoalType; label: string; description: string }[] = [
    { value: GoalType.SAVINGS, label: 'Savings', description: 'General savings goal' },
    { value: GoalType.PURCHASE, label: 'Purchase', description: 'Save for a specific purchase' },
    { value: GoalType.DEBT_PAYOFF, label: 'Debt Payoff', description: 'Pay off loans or debts' },
    { value: GoalType.INVESTMENT, label: 'Investment', description: 'Build investment portfolio' },
    { value: GoalType.HAJJ, label: 'Hajj', description: 'Save for pilgrimage' },
    { value: GoalType.EMERGENCY_FUND, label: 'Emergency Fund', description: '3-6 months expenses' },
    { value: GoalType.EDUCATION, label: 'Education', description: 'Save for education expenses' },
    { value: GoalType.RETIREMENT, label: 'Retirement', description: 'Long-term retirement savings' },
    { value: GoalType.OTHER, label: 'Other', description: 'Other financial goal' },
  ]

  const selectedGoalType = goalTypes.find(t => t.value === goalType)

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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/goals/${goalId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Goal</h1>
          <p className="text-muted-foreground mt-1">
            Update the details of {goal.goal_name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the details of your financial goal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Goal Name */}
                <div className="space-y-2">
                  <Label htmlFor="goal_name">Goal Name *</Label>
                  <Input
                    id="goal_name"
                    placeholder="e.g., Emergency Fund, New Car, Hajj Fund"
                    {...register('goal_name')}
                  />
                  {errors.goal_name && (
                    <p className="text-sm text-red-600">{errors.goal_name.message}</p>
                  )}
                </div>

                {/* Goal Type */}
                <div className="space-y-2">
                  <Label htmlFor="goal_type">Goal Type *</Label>
                  <Select
                    value={goalType}
                    onValueChange={(value) => setValue('goal_type', value as GoalType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.goal_type && (
                    <p className="text-sm text-red-600">{errors.goal_type.message}</p>
                  )}
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount (AED) *</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...register('target_amount', { valueAsNumber: true })}
                  />
                  {errors.target_amount && (
                    <p className="text-sm text-red-600">{errors.target_amount.message}</p>
                  )}
                </div>

                {/* Current Amount */}
                <div className="space-y-2">
                  <Label htmlFor="current_amount">Current Amount (AED)</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('current_amount', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Update the current saved amount
                  </p>
                  {errors.current_amount && (
                    <p className="text-sm text-red-600">{errors.current_amount.message}</p>
                  )}
                </div>

                {/* Monthly Contribution */}
                <div className="space-y-2">
                  <Label htmlFor="monthly_contribution">Monthly Contribution (AED)</Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('monthly_contribution', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How much you plan to contribute each month
                  </p>
                  {errors.monthly_contribution && (
                    <p className="text-sm text-red-600">{errors.monthly_contribution.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>
                  Set the timeline for achieving your goal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-600">{errors.start_date.message}</p>
                  )}
                </div>

                {/* Target Date */}
                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date *</Label>
                  <Input
                    id="target_date"
                    type="date"
                    {...register('target_date')}
                  />
                  {errors.target_date && (
                    <p className="text-sm text-red-600">{errors.target_date.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Optional information about your goal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account */}
                <div className="space-y-2">
                  <Label htmlFor="account_id">Link to Account (Optional)</Label>
                  <Select
                    value={watch('account_id') || ''}
                    onValueChange={(value) => setValue('account_id', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No account</SelectItem>
                      {loadingAccounts ? (
                        <SelectItem value="" disabled>Loading accounts...</SelectItem>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} - {account.account_type}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this goal to a specific account for tracking
                  </p>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    {...register('priority', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher number = higher priority (0 = lowest, 10 = highest)
                  </p>
                  {errors.priority && (
                    <p className="text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status') || GoalStatus.ACTIVE}
                    onValueChange={(value) => setValue('status', value as GoalStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GoalStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={GoalStatus.PAUSED}>Paused</SelectItem>
                      <SelectItem value={GoalStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={GoalStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this goal..."
                    rows={4}
                    {...register('notes')}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Type Info */}
            {selectedGoalType && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {selectedGoalType.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedGoalType.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/goals/${goalId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Update your progress regularly</p>
                <p>• Adjust targets if circumstances change</p>
                <p>• Pause goals temporarily if needed</p>
                <p>• Mark goals as completed when achieved</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
