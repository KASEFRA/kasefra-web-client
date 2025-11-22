'use client'

/**
 * AccountsTable Component
 * Reusable table component for displaying accounts with sorting and actions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/currency'
import type { Account, AccountType } from '@/types'
import { Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type SortField = 'account_name' | 'account_type' | 'institution_name' | 'current_balance' | 'currency'
type SortOrder = 'asc' | 'desc'

interface AccountsTableProps {
  accounts: Account[]
  onDelete?: (accountId: string) => void
  showInstitution?: boolean
  showType?: boolean
}

export function AccountsTable({
  accounts,
  onDelete,
  showInstitution = true,
  showType = true,
}: AccountsTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('account_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedAccounts = [...accounts].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase()
    if (typeof bValue === 'string') bValue = bValue.toLowerCase()

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const getAccountTypeLabel = (type: AccountType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getAccountTypeColor = (type: AccountType) => {
    const colors: Record<string, string> = {
      checking: 'bg-blue-100 text-blue-800 border-blue-200',
      savings: 'bg-green-100 text-green-800 border-green-200',
      credit_card: 'bg-red-100 text-red-800 border-red-200',
      investment: 'bg-purple-100 text-purple-800 border-purple-200',
      crypto: 'bg-orange-100 text-orange-800 border-orange-200',
      real_estate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other_asset: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      loan: 'bg-gray-100 text-gray-800 border-gray-200',
      cash: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const handleDelete = async (accountId: string, accountName: string) => {
    if (confirm(`Are you sure you want to delete "${accountName}"?`)) {
      onDelete?.(accountId)
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No accounts found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleSort('account_name')}
              >
                Account Name
                {getSortIcon('account_name')}
              </Button>
            </TableHead>
            {showType && (
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('account_type')}
                >
                  Type
                  {getSortIcon('account_type')}
                </Button>
              </TableHead>
            )}
            {showInstitution && (
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('institution_name')}
                >
                  Institution
                  {getSortIcon('institution_name')}
                </Button>
              </TableHead>
            )}
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleSort('current_balance')}
              >
                Balance
                {getSortIcon('current_balance')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleSort('currency')}
              >
                Currency
                {getSortIcon('currency')}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAccounts.map((account) => (
            <TableRow
              key={account.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
            >
              <TableCell className="font-medium">{account.account_name}</TableCell>
              {showType && (
                <TableCell>
                  <Badge variant="outline" className={getAccountTypeColor(account.account_type)}>
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                </TableCell>
              )}
              {showInstitution && (
                <TableCell className="text-muted-foreground">
                  {account.institution_name || '—'}
                </TableCell>
              )}
              <TableCell className="font-semibold">
                {formatCurrency(account.current_balance)}
              </TableCell>
              <TableCell className="text-muted-foreground">{account.currency}</TableCell>
              <TableCell>
                {account.is_active ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/accounts/${account.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/accounts/${account.id}/edit`)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(account.id, account.account_name)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
