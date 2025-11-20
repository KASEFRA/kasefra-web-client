'use client'

/**
 * Account Detail Page
 * Shows comprehensive information about a specific account
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import type { Account } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { AccountOverview } from '@/components/accounts/account-overview'
import { AccountTransactions } from '@/components/accounts/account-transactions'
import { AccountBalanceChart } from '@/components/accounts/account-balance-chart'
import { AccountCategoryBreakdown } from '@/components/accounts/account-category-breakdown'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (accountId) {
      loadAccount()
    }
  }, [accountId])

  const loadAccount = async () => {
    try {
      setLoading(true)
      setError(null)
      const accountData = await accountsApi.getById(accountId)
      setAccount(accountData)
    } catch (err: any) {
      console.error('Failed to load account:', err)
      setError(err.response?.data?.error?.message || 'Failed to load account')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/accounts/${accountId}/edit`)
  }

  const handleArchive = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await accountsApi.delete(accountId)
      toast.success('Account deleted successfully')
      router.push('/dashboard/accounts')
    } catch (err: any) {
      console.error('Failed to delete account:', err)
      toast.error(err.response?.data?.detail || 'Failed to delete account')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/accounts')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Accounts
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading account...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/accounts')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Accounts
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Account not found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'The account you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/dashboard/accounts')}>
              View All Accounts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/dashboard/accounts')}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Accounts
      </Button>

      {/* Account Overview */}
      <AccountOverview 
        account={account} 
        onEdit={handleEdit}
        onArchive={handleArchive}
      />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AccountBalanceChart accountId={accountId} days={30} />
        <AccountCategoryBreakdown accountId={accountId} days={30} />
      </div>

      {/* Account Transactions */}
      <AccountTransactions 
        accountId={accountId} 
        limit={20}
        showPagination={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{account.account_name}</strong>? 
              This action cannot be undone. All transactions associated with this account will remain in the system but will be orphaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
