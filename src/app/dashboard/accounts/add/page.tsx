'use client'

/**
 * Add Account Page
 * Create new accounts with dynamic fields based on account type
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { AccountType } from '@/types'
import type { AccountCreate } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { 
  Landmark, Wallet, TrendingUp, Bitcoin, Home, Car, 
  CreditCard, PiggyBank, Building, ArrowLeft 
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Account type options with icons and descriptions
const ACCOUNT_TYPES = [
  { value: AccountType.CHECKING, label: 'Checking', icon: Landmark, description: 'Day-to-day spending' },
  { value: AccountType.SAVINGS, label: 'Savings', icon: PiggyBank, description: 'Save for goals' },
  { value: AccountType.CREDIT_CARD, label: 'Credit Card', icon: CreditCard, description: 'Credit account' },
  { value: AccountType.CASH, label: 'Cash', icon: Wallet, description: 'Physical cash' },
  { value: AccountType.INVESTMENT, label: 'Investment', icon: TrendingUp, description: 'Stocks & bonds' },
  { value: AccountType.RETIREMENT, label: 'Retirement', icon: Building, description: '401k, IRA' },
  { value: AccountType.CRYPTO, label: 'Crypto', icon: Bitcoin, description: 'Digital assets' },
  { value: AccountType.REAL_ESTATE, label: 'Real Estate', icon: Home, description: 'Property' },
  { value: AccountType.VEHICLE, label: 'Vehicle', icon: Car, description: 'Cars, boats' },
]

// Bank account types (show banking fields)
const BANK_TYPES = [AccountType.CHECKING, AccountType.SAVINGS, AccountType.CREDIT_CARD]

// Color presets
const COLOR_PRESETS = [
  { name: 'Purple', value: '#6E4993' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
]

// Form validation schema
const formSchema = z.object({
  account_type: z.nativeEnum(AccountType),
  account_name: z.string().min(1, 'Account name is required').max(255),
  institution_name: z.string().max(255).optional().nullable(),
  currency: z.string().length(3).toUpperCase(),
  // Balance fields - critical for net worth calculation
  current_balance: z.number().min(0, 'Balance must be positive or zero'),
  available_balance: z.number().min(0).optional().nullable(),
  credit_limit: z.number().min(0).optional().nullable(),
  // Bank-specific fields
  bank_identifier: z.string().max(100).optional().nullable(),
  account_number_masked: z.string().max(50).optional().nullable(),
  routing_number: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  icon_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
})

export default function AddAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-select account type from URL query param
  const preselectedType = searchParams.get('type')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_type: preselectedType as AccountType || undefined,
      account_name: '',
      institution_name: '',
      currency: 'AED',
      current_balance: 0,
      available_balance: undefined,
      credit_limit: undefined,
      bank_identifier: '',
      account_number_masked: '',
      routing_number: '',
      notes: '',
      icon_color: COLOR_PRESETS[0].value,
    },
  })

  const selectedType = form.watch('account_type')
  const showBankingFields = selectedType && BANK_TYPES.includes(selectedType)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      
      // Clean up empty strings to null
      const payload: AccountCreate = {
        account_type: values.account_type,
        account_name: values.account_name,
        institution_name: values.institution_name || null,
        currency: values.currency || 'AED',
        current_balance: values.current_balance ?? 0,
        available_balance: values.available_balance ?? null,
        credit_limit: values.credit_limit ?? null,
        bank_identifier: values.bank_identifier || null,
        account_number_masked: values.account_number_masked || null,
        routing_number: values.routing_number || null,
        notes: values.notes || null,
        icon_color: values.icon_color || null,
      }

      await accountsApi.create(payload)
      
      toast.success('Account created successfully!')
      
      // Redirect to appropriate list page
      if (BANK_TYPES.includes(values.account_type)) {
        router.push('/dashboard/accounts/bank')
      } else if ([AccountType.INVESTMENT, AccountType.RETIREMENT].includes(values.account_type)) {
        router.push('/dashboard/accounts/investments')
      } else if (values.account_type === AccountType.CRYPTO) {
        router.push('/dashboard/accounts/crypto')
      } else if ([AccountType.REAL_ESTATE, AccountType.VEHICLE, AccountType.OTHER_ASSET].includes(values.account_type)) {
        router.push('/dashboard/accounts/assets')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Failed to create account:', error)
      toast.error(error.response?.data?.detail || 'Failed to create account')
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Account</h1>
          <p className="text-muted-foreground">
            Create a new account to track your finances
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Fill in the information below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Account Type Selection */}
              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Account Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                      >
                        {ACCOUNT_TYPES.map((type) => {
                          const Icon = type.icon
                          return (
                            <FormItem key={type.value}>
                              <FormControl>
                                <RadioGroupItem value={type.value} id={type.value} className="sr-only peer" />
                              </FormControl>
                              <FormLabel
                                htmlFor={type.value}
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                              >
                                <Icon className="mb-2 h-6 w-6" />
                                <span className="font-medium">{type.label}</span>
                                <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                              </FormLabel>
                            </FormItem>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Balance / Value *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? 0 : parseFloat(value))
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormDescription>Enter the current balance or value of this account</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Banking Details - Conditional */}
              {showBankingFields && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Banking Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="bank_identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Identifier</FormLabel>
                        <FormControl>
                          <Input placeholder="SWIFT/BIC code" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>SWIFT code, BIC, or routing identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_number_masked"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="****1234" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Last 4 digits or masked format (e.g., ****1234)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="routing_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Bank routing number (if applicable)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Customization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customization</h3>
                
                <FormField
                  control={form.control}
                  name="icon_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {COLOR_PRESETS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => field.onChange(color.value)}
                              className={`w-10 h-10 rounded-md border-2 transition-all ${
                                field.value === color.value ? 'border-primary scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>Choose a color to identify this account</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this account..." 
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
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
