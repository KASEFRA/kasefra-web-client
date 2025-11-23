'use client'

/**
 * Checking Accounts Page
 * Manage checking bank accounts with table view
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { Plus, Landmark, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCheckingAccountDialog } from '@/components/accounts/create-checking-account-dialog'
import { AccountsTable } from '@/components/accounts/accounts-table'

export default function CheckingAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckingDialog, setShowCheckingDialog] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      const checkingAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.CHECKING
      )
      setAccounts(checkingAccounts)
    } catch (error) {
      console.error('Failed to load checking accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    try {
      await accountsApi.delete(accountId)
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading checking accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checking Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your checking accounts for day-to-day transactions
          </p>
        </div>
        <Button onClick={() => setShowCheckingDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Checking Account
        </Button>
      </div>

      {/* Checking Account Creation Dialog */}
      <CreateCheckingAccountDialog
        open={showCheckingDialog}
        onOpenChange={setShowCheckingDialog}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Checking accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length > 0 ? formatCurrency(totalBalance / accounts.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No checking accounts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start by adding your first checking account
          </p>
          <Button onClick={() => setShowCheckingDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Checking Account
          </Button>
        </div>
      ) : (
        <AccountsTable
          accounts={accounts}
          onDelete={handleDelete}
          showInstitution={true}
          showType={false}
        />
      )}
    </div>
  )
}
