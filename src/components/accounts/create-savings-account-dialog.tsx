'use client'

/**
 * Two-Step Savings Account Creation Dialog
 * Step 1: General account information
 * Step 2: Savings-specific details
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { accountsApi } from '@/lib/api/accounts'
import { savingsApi } from '@/lib/api/savings'
import { AccountType } from '@/types'

// Step 1: General Account Info
const step1Schema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(100),
  institution_name: z.string().max(100).optional(),
  currency: z.string().min(1, 'Currency is required'),
  current_balance: z.number().min(0, 'Balance must be positive'),
})

// Step 2: Savings-Specific Info
const step2Schema = z.object({
  interest_rate: z.number().min(0).max(100).optional(),
  goal_name: z.string().max(200).optional().or(z.literal('')),
  goal_target_amount: z.number().min(0).optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

interface CreateSavingsAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSavingsAccountDialog({
  open,
  onOpenChange,
}: CreateSavingsAccountDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  // Form for Step 1
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      account_name: '',
      institution_name: '',
      currency: 'AED',
      current_balance: 0,
    },
  })

  // Form for Step 2
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      interest_rate: undefined,
      goal_name: '',
      goal_target_amount: undefined,
    },
  })

  // Handle Step 1 submission - just move to Step 2
  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setStep(2)
  }

  // Handle final submission from Step 2
  const onStep2Submit = async (step2DataForm: Step2Data) => {
    if (!step1Data) {
      toast.error('General account information is missing')
      setStep(1)
      return
    }

    setIsSubmitting(true)

    try {
      // API Call 1: Create general account
      const accountPayload = {
        account_type: AccountType.SAVINGS,
        account_name: step1Data.account_name,
        institution_name: step1Data.institution_name || undefined,
        currency: step1Data.currency,
        current_balance: step1Data.current_balance,
      }

      const account = await accountsApi.create(accountPayload)

      // API Call 2: Create savings-specific details
      const savingsPayload = {
        account_id: account.id,
        interest_rate: step2DataForm.interest_rate || undefined,
        goal_name: step2DataForm.goal_name || undefined,
        goal_target_amount: step2DataForm.goal_target_amount || undefined,
      }

      await savingsApi.createDetails(account.id, savingsPayload)

      // Success!
      toast.success('Savings account created successfully!')
      onOpenChange(false)

      // Reset forms
      step1Form.reset()
      step2Form.reset()
      setStep(1)
      setStep1Data(null)

      // Redirect to savings accounts page
      router.push('/dashboard/accounts/savings')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating savings account:', error)
      toast.error(
        error.response?.data?.detail || 'Failed to create savings account'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle back button from Step 2 to Step 1
  const handleBack = () => {
    setStep(1)
  }

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open)
      if (!open) {
        // Reset everything when closing
        step1Form.reset()
        step2Form.reset()
        setStep(1)
        setStep1Data(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <PiggyBank className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Savings Account</DialogTitle>
              <DialogDescription>
                Step {step} of 2 - {step === 1 ? 'Account Information' : 'Savings Details'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: General Account Info */}
        {step === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
              <FormField
                control={step1Form.control}
                name="account_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Emergency Fund" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step1Form.control}
                name="institution_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank/Institution</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Emirates NBD"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step1Form.control}
                name="current_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Balance *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          AED
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Current balance in the account</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Next
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Step 2: Savings-Specific Details */}
        {step === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
              <FormField
                control={step2Form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Annual interest rate (APY)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="goal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Goal Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Emergency Fund, Vacation"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      What are you saving for?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="goal_target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Goal Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          AED
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Target amount you want to save
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
