'use client'

/**
 * Savings Accounts Page
 * Manage savings bank accounts with table view
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { Plus, PiggyBank, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountsTable } from '@/components/accounts/accounts-table'
import { CreateSavingsAccountDialog } from '@/components/accounts/create-savings-account-dialog'

export default function SavingsAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      const savingsAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.SAVINGS
      )
      setAccounts(savingsAccounts)
    } catch (error) {
      console.error('Failed to load savings accounts:', error)
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

  const totalSavings = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading savings accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Track your savings and interest-earning accounts
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Savings Account
        </Button>
      </div>

      {/* Savings Account Creation Dialog */}
      <CreateSavingsAccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Savings accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length > 0 ? formatCurrency(totalSavings / accounts.length) : formatCurrency(0)}
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
          <PiggyBank className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No savings accounts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start saving by adding your first savings account
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Savings Account
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
