'use client'

/**
 * Crypto Account Creation Dialog
 * Single-step form for crypto accounts (no type-specific details)
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Bitcoin } from 'lucide-react'
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
import { AccountType } from '@/types'

const formSchema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(100),
  institution_name: z.string().max(100).optional(),
  currency: z.string().min(1, 'Currency is required'),
  current_balance: z.number().min(0, 'Balance must be positive'),
})

type FormData = z.infer<typeof formSchema>

interface CreateCryptoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCryptoDialog({
  open,
  onOpenChange,
}: CreateCryptoDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_name: '',
      institution_name: '',
      currency: 'AED',
      current_balance: 0,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const accountPayload = {
        account_type: AccountType.CRYPTO,
        account_name: data.account_name,
        institution_name: data.institution_name || undefined,
        currency: data.currency,
        current_balance: data.current_balance,
      }

      await accountsApi.create(accountPayload)

      toast.success('Crypto account created successfully!')
      onOpenChange(false)
      form.reset()

      router.push('/dashboard/accounts/crypto')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating crypto account:', error)
      toast.error(
        error.response?.data?.detail || 'Failed to create crypto account'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open)
      if (!open) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Bitcoin className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Crypto Account</DialogTitle>
              <DialogDescription>
                Add a new cryptocurrency account or wallet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="account_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bitcoin Wallet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange/Wallet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Coinbase, Binance"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                  <FormDescription>Current value in AED</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
