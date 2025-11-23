'use client'

/**
 * Crypto Accounts Page
 * Manage cryptocurrency wallets and holdings with table view
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { Plus, Bitcoin, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountsTable } from '@/components/accounts/accounts-table'
import { CreateCryptoDialog } from '@/components/accounts/create-crypto-dialog'

export default function CryptoAccountsPage() {
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
      const cryptoAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.CRYPTO
      )
      setAccounts(cryptoAccounts)
    } catch (error) {
      console.error('Failed to load crypto accounts:', error)
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

  const totalValue = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading crypto holdings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cryptocurrency</h1>
          <p className="text-muted-foreground mt-2">
            Track your cryptocurrency portfolio and holdings
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Crypto Account
        </Button>
      </div>

      {/* Crypto Account Creation Dialog */}
      <CreateCryptoDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} wallet{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+0.00%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Crypto wallets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Bitcoin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No crypto wallets yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start tracking your cryptocurrency by adding a wallet
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Crypto Wallet
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
