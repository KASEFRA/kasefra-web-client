'use client'

/**
 * Budget Form Component
 * Reusable form for creating and editing budgets
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { BudgetPeriod } from '@/types'
import type { Budget } from '@/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

// Form validation schema
const budgetFormSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(255),
  period: z.nativeEnum(BudgetPeriod),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  rollover_enabled: z.boolean(),
  notes: z.string().optional().nullable(),
})

export type BudgetFormValues = z.infer<typeof budgetFormSchema>

interface BudgetFormProps {
  /** Form mode: create or edit */
  mode: 'create' | 'edit'
  /** Initial data for edit mode */
  initialData?: Budget
  /** Form submission handler */
  onSubmit: (values: BudgetFormValues) => Promise<void>
  /** Cancel handler */
  onCancel: () => void
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Title override */
  title?: string
  /** Description override */
  description?: string
}

export function BudgetForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
  description,
}: BudgetFormProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      period: initialData?.period || BudgetPeriod.MONTHLY,
      start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
      end_date: initialData?.end_date || '',
      rollover_enabled: initialData?.rollover_enabled || false,
      notes: initialData?.notes || '',
    },
  })

  const handleSubmit = async (values: BudgetFormValues) => {
    await onSubmit(values)
  }

  const defaultTitle = mode === 'create' ? 'Budget Details' : 'Edit Budget Details'
  const defaultDescription =
    mode === 'create'
      ? 'Fill in the information below to create your budget'
      : 'Update the budget information below'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || defaultTitle}</CardTitle>
        <CardDescription>{description || defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Budget Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Monthly Budget 2024"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>A descriptive name for this budget</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || mode === 'edit'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={BudgetPeriod.WEEKLY}>Weekly</SelectItem>
                      <SelectItem value={BudgetPeriod.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={BudgetPeriod.QUARTERLY}>Quarterly</SelectItem>
                      <SelectItem value={BudgetPeriod.YEARLY}>Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Budget tracking period
                    {mode === 'edit' && ' (cannot be changed after creation)'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isSubmitting || mode === 'edit'}
                      />
                    </FormControl>
                    {mode === 'edit' && (
                      <FormDescription>Cannot be changed after creation</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Leave empty for ongoing budget</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rollover */}
            <FormField
              control={form.control}
              name="rollover_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Rollover</FormLabel>
                    <FormDescription>
                      Roll over unused budget amounts to the next period
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this budget..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </>
                ) : mode === 'create' ? (
                  'Create Budget'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
