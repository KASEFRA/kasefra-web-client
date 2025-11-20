'use client'

/**
 * Create Budget Page
 * Form to create a new budget with category allocations
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { budgetsApi, categoriesApi } from '@/lib/api'
import { BudgetType, BudgetPeriod, CategoryType } from '@/types'
import type { BudgetCreate, Category } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(255),
  budget_type: z.nativeEnum(BudgetType),
  period: z.nativeEnum(BudgetPeriod),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  rollover_enabled: z.boolean(),
  notes: z.string().optional().nullable(),
})

export default function CreateBudgetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      budget_type: BudgetType.FLEXIBLE,
      period: BudgetPeriod.MONTHLY,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      rollover_enabled: false,
      notes: '',
    },
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await categoriesApi.getAll()
      // Filter expense categories only
      const expenseCategories = response.categories.filter(
        cat => cat.category_type === CategoryType.EXPENSE && cat.is_active
      )
      setCategories(expenseCategories)
    } catch (error: any) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)

      // Clean up empty strings to null
      const payload: BudgetCreate = {
        name: values.name,
        budget_type: values.budget_type,
        period: values.period,
        start_date: values.start_date,
        end_date: values.end_date || null,
        rollover_enabled: values.rollover_enabled,
        notes: values.notes || null,
      }

      const createdBudget = await budgetsApi.create(payload)

      toast.success('Budget created successfully!')
      router.push(`/dashboard/budgets/${createdBudget.id}`)
    } catch (error: any) {
      console.error('Failed to create budget:', error)
      toast.error(error.response?.data?.detail || 'Failed to create budget')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Budget</h1>
          <p className="text-muted-foreground">
            Set up a new budget to track your spending
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
          <CardDescription>Fill in the information below to create your budget</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly Budget 2024" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive name for this budget</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budget_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={BudgetType.FIXED}>Fixed Budget</SelectItem>
                            <SelectItem value={BudgetType.FLEXIBLE}>Flexible Budget</SelectItem>
                            <SelectItem value={BudgetType.ZERO_BASED}>Zero-Based Budget</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How you want to structure your budget</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormDescription>Budget tracking period</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                          />
                        </FormControl>
                        <FormDescription>Leave empty for ongoing budget</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rollover_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enable Rollover
                        </FormLabel>
                        <FormDescription>
                          Roll over unused budget amounts to the next period
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Info Box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Step: Add Category Allocations
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  After creating your budget, you'll be able to add category allocations and set spending limits.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Budget'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
