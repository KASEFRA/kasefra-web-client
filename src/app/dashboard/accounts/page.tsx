'use client'

/**
 * Accounts Page
 * Manage all financial accounts with table view, search, and filtering
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import type { Account } from '@/types'
import { Plus, Landmark, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CreateCheckingAccountDialog } from '@/components/accounts/create-checking-account-dialog'
import { AccountsTable } from '@/components/accounts/accounts-table'

// Available account types for filtering (must match backend enum values)
const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Cards' },
  { value: 'cash', label: 'Cash' },
  { value: 'loan', label: 'Loans' },
  { value: 'investment', label: 'Investments' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other_asset', label: 'Other Assets' },
]

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showCheckingDialog, setShowCheckingDialog] = useState(false)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [searchTerm, selectedTypes, accounts])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    // Filter by search term (account name or institution name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        account =>
          account.account_name.toLowerCase().includes(searchLower) ||
          account.institution_name?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by account types
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(account =>
        selectedTypes.includes(account.account_type)
      )
    }

    setFilteredAccounts(filtered)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSearchTerm('')
  }

  const removeTypeFilter = (type: string) => {
    setSelectedTypes(prev => prev.filter(t => t !== type))
  }

  const handleDelete = async (accountId: string) => {
    try {
      await accountsApi.delete(accountId)
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCheckingDialog(true)}
          >
            <Landmark className="mr-2 h-4 w-4" />
            New Checking
          </Button>
          <Button onClick={() => router.push('/dashboard/accounts/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Checking Account Creation Dialog */}
      <CreateCheckingAccountDialog
        open={showCheckingDialog}
        onOpenChange={setShowCheckingDialog}
      />

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by account or institution name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                Filter by Type
                {selectedTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-2">
                    {selectedTypes.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Account Types</h4>
                  {selectedTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {ACCOUNT_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={selectedTypes.includes(type.value)}
                        onCheckedChange={() => toggleType(type.value)}
                      />
                      <label
                        htmlFor={type.value}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedTypes.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1 pr-1">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTypes.map((type) => {
              const typeConfig = ACCOUNT_TYPES.find(t => t.value === type)
              return (
                <Badge key={type} variant="secondary" className="gap-1 pr-1">
                  {typeConfig?.label || type}
                  <button
                    onClick={() => removeTypeFilter(type)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Accounts Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </p>
        </div>

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
              onClick={() => router.push('/dashboard/accounts/add')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>
        ) : (
          <AccountsTable
            accounts={filteredAccounts}
            onDelete={handleDelete}
            showInstitution={true}
            showType={true}
          />
        )}
      </div>
    </div>
  )
}
