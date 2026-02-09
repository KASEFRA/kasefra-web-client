'use client'

/**
 * Create Goal Page
 * Form for creating a new financial goal
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { goalsApi } from '@/lib/api/goals'
import { accountsApi } from '@/lib/api/accounts'
import { GoalType } from '@/types'
import type { Account } from '@/types'
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
import { useAuth } from '@/components/providers/auth-provider'

const goalSchema = z.object({
  goal_name: z.string().min(1, 'Goal name is required').max(100, 'Goal name is too long'),
  goal_type: z.nativeEnum(GoalType),
  target_amount: z.number().min(0.01, 'Target amount must be greater than 0'),
  start_date: z.string().min(1, 'Start date is required'),
  target_date: z.string().min(1, 'Target date is required'),
  monthly_contribution: z.number().min(0, 'Monthly contribution cannot be negative').optional(),
  account_id: z.string().optional(),
  priority: z.number().min(1).max(3).optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
}).refine((data) => {
  const start = new Date(data.start_date)
  const target = new Date(data.target_date)
  return target > start
}, {
  message: 'Target date must be after start date',
  path: ['target_date'],
})

type GoalFormData = z.infer<typeof goalSchema>

export default function NewGoalPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: GoalType.SAVINGS,
      priority: 1,
      start_date: new Date().toISOString().split('T')[0],
    },
  })

  const goalType = watch('goal_type')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await accountsApi.getAll()
      setAccounts(response.accounts)

      // Pre-fill from user's default payment account
      if (user?.default_account_id && response.accounts.some((a: Account) => a.id === user.default_account_id)) {
        setValue('account_id', user.default_account_id)
      }
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
      const goalData = {
        ...data,
        priority: data.priority || 1,
        account_id: data.account_id || null,
      }

      await goalsApi.create(goalData)
      
      toast.success('Goal created successfully!')
      router.push('/dashboard/goals')
    } catch (error: any) {
      console.error('Failed to create goal:', error)
      toast.error(error.response?.data?.detail || 'Failed to create goal. Please try again.')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/goals')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Goal</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new financial goal to track your progress
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
                    value={watch('account_id') || 'none'}
                    onValueChange={(value) =>
                      setValue('account_id', value === 'none' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No account</SelectItem>
                      {loadingAccounts ? (
                        <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
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
                  <Label htmlFor="priority">Priority (1-3)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="3"
                    placeholder="1"
                    {...register('priority', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 = High, 2 = Medium, 3 = Low
                  </p>
                  {errors.priority && (
                    <p className="text-sm text-red-600">{errors.priority.message}</p>
                  )}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Goal
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/goals')}
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
                <p>• Set realistic target amounts based on your income</p>
                <p>• Choose a timeline that gives you flexibility</p>
                <p>• Review and adjust your goals regularly</p>
                <p>• Link goals to dedicated savings accounts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
