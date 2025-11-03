'use client'

/**
 * Accounts Page
 * Manage all financial accounts with CRUD operations
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account, AccountType } from '@/types'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadAccounts()
  }, [filter])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = filter === 'all'
        ? await accountsApi.getAll()
        : await accountsApi.getByType(filter)
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccountTypeLabel = (type: AccountType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getAccountTypeColor = (type: AccountType) => {
    const colors: Record<string, string> = {
      checking: 'bg-blue-100 text-blue-800',
      savings: 'bg-green-100 text-green-800',
      credit_card: 'bg-red-100 text-red-800',
      investment: 'bg-purple-100 text-purple-800',
      crypto: 'bg-orange-100 text-orange-800',
      asset: 'bg-yellow-100 text-yellow-800',
      loan: 'bg-gray-100 text-gray-800',
      mortgage: 'bg-indigo-100 text-indigo-800',
      line_of_credit: 'bg-pink-100 text-pink-800',
      cash: 'bg-emerald-100 text-emerald-800',
      brokerage: 'bg-violet-100 text-violet-800',
      retirement: 'bg-amber-100 text-amber-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your financial accounts
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/accounts/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All Accounts
        </button>
        <button
          onClick={() => setFilter('checking')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'checking'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Checking
        </button>
        <button
          onClick={() => setFilter('savings')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'savings'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Savings
        </button>
        <button
          onClick={() => setFilter('credit_card')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'credit_card'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Credit Cards
        </button>
        <button
          onClick={() => setFilter('investment')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'investment'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Investments
        </button>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No accounts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by adding your first financial account
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.href = '/dashboard/accounts/new'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              {/* Account Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {account.account_name}
                    </h3>
                    {!account.is_active && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getAccountTypeColor(
                      account.account_type
                    )}`}
                  >
                    {getAccountTypeLabel(account.account_type)}
                  </span>
                </div>
              </div>

              {/* Institution Info */}
              {account.institution_name && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {account.institution_name}
                  {account.account_number_masked && ` ${account.account_number_masked}`}
                </p>
              )}

              {/* Balance */}
              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(account.current_balance, account.currency as 'AED' | 'USD')}
                  </p>
                </div>

                {account.available_balance !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(account.available_balance, account.currency as 'AED' | 'USD')}
                    </p>
                  </div>
                )}

                {account.credit_limit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Limit</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(account.credit_limit, account.currency as 'AED' | 'USD')}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.location.href = `/dashboard/accounts/${account.id}`}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/accounts/${account.id}/edit`}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
