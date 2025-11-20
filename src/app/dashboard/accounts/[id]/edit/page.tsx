'use client'

/**
 * Edit Account Page
 * Update existing account details (only editable fields per backend schema)
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import type { Account, AccountUpdate } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Form validation schema - only editable fields per AccountUpdate schema
const formSchema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(255),
  institution_name: z.string().max(255).optional().nullable(),
  currency: z.string().length(3).toUpperCase(),
  is_active: z.boolean(),
})

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_name: '',
      institution_name: '',
      currency: 'AED',
      is_active: true,
    },
  })

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      try {
        setIsLoading(true)
        const data = await accountsApi.getById(accountId)
        setAccount(data)

        // Pre-fill form with existing data
        form.reset({
          account_name: data.account_name,
          institution_name: data.institution_name || '',
          currency: data.currency,
          is_active: data.is_active,
        })
      } catch (error: any) {
        console.error('Failed to load account:', error)
        toast.error('Failed to load account')
        router.push('/dashboard/accounts')
      } finally {
        setIsLoading(false)
      }
    }

    loadAccount()
  }, [accountId, router, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)

      // Clean up empty strings to null
      const payload: AccountUpdate = {
        account_name: values.account_name,
        institution_name: values.institution_name || null,
        currency: values.currency,
        is_active: values.is_active,
      }

      await accountsApi.update(accountId, payload)

      toast.success('Account updated successfully!')

      // Redirect back to account detail page
      router.push(`/dashboard/accounts/${accountId}`)
    } catch (error: any) {
      console.error('Failed to update account:', error)
      toast.error(error.response?.data?.detail || 'Failed to update account')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Account not found</p>
          <Button onClick={() => router.push('/dashboard/accounts')}>
            Back to Accounts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/accounts/${accountId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Account</h1>
          <p className="text-muted-foreground">
            Update the details for {account.account_name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Update the information below to modify your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Account Type - Read Only */}
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm">
                  {account.account_type}
                </div>
                <p className="text-xs text-muted-foreground">Account type cannot be changed after creation</p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="My Checking Account" {...field} />
                      </FormControl>
                      <FormDescription>A nickname to identify this account</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="institution_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chase Bank" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Bank, broker, or institution name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Set this account as active or inactive
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Balance Info - Read Only */}
              <div className="space-y-2">
                <Label>Current Balance</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                  {account.currency} {account.current_balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Balance is auto-calculated from transactions and cannot be edited directly
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/accounts/${accountId}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
