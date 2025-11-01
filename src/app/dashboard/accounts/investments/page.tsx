'use client'

/**
 * Investments Page
 * Manage investment accounts and portfolio
 */

import { useEffect, useState } from 'react'
import { accountsApi, investmentsApi } from '@/lib/api'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { Plus, Eye, Edit, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function InvestmentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      const investmentAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.INVESTMENT ||
        acc.account_type === AccountType.BROKERAGE ||
        acc.account_type === AccountType.RETIREMENT
      )
      setAccounts(investmentAccounts)
    } catch (error) {
      console.error('Failed to load investment accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this investment account?')) {
      return
    }

    try {
      await accountsApi.delete(accountId)
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getAccountTypeLabel = (type: AccountType) => {
    return type
      .toString()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const totalValue = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading investments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your investment portfolio and track performance
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Investment Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Investment accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Accounts</CardTitle>
          <CardDescription>
            {accounts.length} investment account{accounts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No investment accounts yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start building your investment portfolio by adding an account
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Investment Account
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{account.account_name}</CardTitle>
                          <Badge variant="outline" className="mt-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
                            {getAccountTypeLabel(account.account_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(account.current_balance)}</p>
                    </div>

                    {account.institution_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="text-sm font-medium">{account.institution_name}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
