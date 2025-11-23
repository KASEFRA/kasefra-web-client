'use client'

/**
 * Two-Step Loan Account Creation Dialog
 * Step 1: General account information
 * Step 2: Loan-specific details
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, FileText } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { accountsApi } from '@/lib/api/accounts'
import { loanApi, LoanType } from '@/lib/api/loan'
import { AccountType } from '@/types'

// Step 1: General Account Info
const step1Schema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(100),
  institution_name: z.string().max(100).optional(),
  currency: z.string().min(1, 'Currency is required'),
  current_balance: z.number(),
})

// Step 2: Loan-Specific Info
const step2Schema = z.object({
  loan_type: z.nativeEnum(LoanType),
  principal_amount: z.number().min(0.01, 'Principal amount must be greater than 0'),
  interest_rate: z.number().min(0).max(100),
  term_months: z.number().min(1, 'Term must be at least 1 month'),
  start_date: z.string().min(1, 'Start date is required'),
  monthly_payment: z.number().min(0.01, 'Monthly payment must be greater than 0'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

interface CreateLoanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLoanDialog({
  open,
  onOpenChange,
}: CreateLoanDialogProps) {
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
      loan_type: LoanType.PERSONAL,
      principal_amount: 0,
      interest_rate: 0,
      term_months: 12,
      start_date: new Date().toISOString().split('T')[0],
      monthly_payment: 0,
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
        account_type: AccountType.LOAN,
        account_name: step1Data.account_name,
        institution_name: step1Data.institution_name || undefined,
        currency: step1Data.currency,
        current_balance: step1Data.current_balance,
      }

      const account = await accountsApi.create(accountPayload)

      // API Call 2: Create loan-specific details
      const loanPayload = {
        account_id: account.id,
        loan_type: step2DataForm.loan_type,
        principal_amount: step2DataForm.principal_amount,
        interest_rate: step2DataForm.interest_rate,
        term_months: step2DataForm.term_months,
        start_date: step2DataForm.start_date,
        monthly_payment: step2DataForm.monthly_payment,
      }

      await loanApi.createDetails(account.id, loanPayload)

      // Success!
      toast.success('Loan account created successfully!')
      onOpenChange(false)

      // Reset forms
      step1Form.reset()
      step2Form.reset()
      setStep(1)
      setStep1Data(null)

      // Redirect to loans page
      router.push('/dashboard/accounts/loans')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating loan account:', error)
      toast.error(
        error.response?.data?.detail || 'Failed to create loan account'
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
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Loan Account</DialogTitle>
              <DialogDescription>
                Step {step} of 2 - {step === 1 ? 'Account Information' : 'Loan Details'}
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
                      <Input placeholder="e.g., Car Loan" {...field} />
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
                    <FormLabel>Lender/Institution</FormLabel>
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
                    <FormLabel>Current Balance *</FormLabel>
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
                    <FormDescription>Current outstanding balance</FormDescription>
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

        {/* Step 2: Loan-Specific Details */}
        {step === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
              <FormField
                control={step2Form.control}
                name="loan_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LoanType.MORTGAGE}>Mortgage</SelectItem>
                        <SelectItem value={LoanType.AUTO}>Auto Loan</SelectItem>
                        <SelectItem value={LoanType.PERSONAL}>Personal Loan</SelectItem>
                        <SelectItem value={LoanType.STUDENT}>Student Loan</SelectItem>
                        <SelectItem value={LoanType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="principal_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount *</FormLabel>
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
                    <FormDescription>Original loan amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate *</FormLabel>
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
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Annual interest rate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="term_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Term *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="12"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          months
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Total loan term in months</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>When did the loan start?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="monthly_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Payment *</FormLabel>
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
                    <FormDescription>Required monthly payment amount</FormDescription>
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
