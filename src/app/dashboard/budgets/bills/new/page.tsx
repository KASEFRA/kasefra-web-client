'use client'

/**
 * Create Recurring Bill Page
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { budgetsApi, categoriesApi, accountsApi } from '@/lib/api'
import type { Account, Category } from '@/types'
import { BillFrequency, CategoryType } from '@/types'
import { useAuth } from '@/components/providers/auth-provider'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const billSchema = z.object({
  bill_name: z.string().min(1, 'Bill name is required').max(255),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  frequency: z.nativeEnum(BillFrequency),
  due_date: z.coerce.number().int().min(1, 'Due date must be 1-31').max(31, 'Due date must be 1-31'),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().optional().nullable(),
  merchant_name: z.string().max(255).optional().nullable(),
  is_autopay: z.boolean().default(false),
  reminder_days_before: z.coerce.number().int().min(0).max(30),
})

type BillFormData = z.infer<typeof billSchema>

export default function NewBillPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingLookups, setLoadingLookups] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  const form = useForm<BillFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      frequency: BillFrequency.MONTHLY,
      due_date: new Date().getDate(),
      is_autopay: false,
      reminder_days_before: 3,
    },
  })

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.category_type === CategoryType.EXPENSE),
    [categories]
  )

  useEffect(() => {
    loadLookups()
  }, [])

  const loadLookups = async () => {
    try {
      setLoadingLookups(true)
      const [categoriesRes, accountsRes] = await Promise.all([
        categoriesApi.getAll(),
        accountsApi.getAll().catch(() => ({ accounts: [] })),
      ])
      setCategories(categoriesRes.categories)
      setAccounts(accountsRes.accounts || [])

      // Pre-fill from user's default payment account
      if (user?.default_account_id && accountsRes.accounts?.some((a: Account) => a.id === user.default_account_id)) {
        form.setValue('account_id', user.default_account_id)
        setPrefilled(true)
      }
    } catch (error) {
      console.error('Failed to load categories/accounts:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingLookups(false)
    }
  }

  const onSubmit = async (values: BillFormData) => {
    try {
      setSubmitting(true)

      await budgetsApi.createBill({
        bill_name: values.bill_name,
        category_id: values.category_id,
        amount: values.amount,
        frequency: values.frequency,
        due_date: values.due_date,
        account_id: values.account_id || null,
        merchant_name: values.merchant_name || null,
        is_autopay: values.is_autopay,
        reminder_days_before: values.reminder_days_before,
      })

      toast.success('Bill created successfully')
      router.push('/dashboard/budgets?tab=bills')
    } catch (error: any) {
      console.error('Failed to create bill:', error)
      toast.error(error.response?.data?.detail || 'Failed to create bill')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingLookups) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading bill form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/budgets?tab=bills')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Recurring Bill</h1>
          <p className="text-muted-foreground mt-1">
            Add a recurring payment to track due dates and reminders
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
              <CardDescription>Provide the bill information and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="bill_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DEWA, Netflix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (AED) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BillFrequency).map((value) => (
                            <SelectItem key={value} value={value}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Day *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="1-31"
                          {...field}
                          onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 1)}
                        />
                      </FormControl>
                      <FormDescription>Day of month for the bill due date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminder_days_before"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder (days before)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          {...field}
                          onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Set to 0 to disable reminders</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Account (Optional)</FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No account</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {prefilled && field.value && field.value !== 'none' && field.value === user?.default_account_id && (
                      <FormDescription className="text-xs text-blue-600 dark:text-blue-400">
                        Pre-filled from your default payment account
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="merchant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Etisalat" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_autopay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Auto-pay enabled</FormLabel>
                      <FormDescription>
                        Mark this bill as automatically paid
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/budgets?tab=bills')}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Bill'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
