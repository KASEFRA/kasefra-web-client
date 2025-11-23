'use client'

/**
 * Assets Page
 * Manage physical assets (real estate, vehicles, etc.) with table view
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { Plus, Home, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountsTable } from '@/components/accounts/accounts-table'
import { toast } from 'sonner'
import { CreateRealEstateDialog } from '@/components/accounts/create-real-estate-dialog'
import { CreateOtherAssetDialog } from '@/components/accounts/create-other-asset-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type AssetDialogType = 'real-estate' | 'other-asset' | null

export default function AssetsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState<AssetDialogType>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      const assetAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.REAL_ESTATE ||
        acc.account_type === AccountType.OTHER_ASSET
      )
      setAccounts(assetAccounts)
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    try {
      await accountsApi.delete(accountId)
      toast.success('Asset account deleted successfully')
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete asset account')
    }
  }

  const totalValue = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)
  const realEstateCount = accounts.filter(a =>
    a.account_type === AccountType.REAL_ESTATE
  ).length
  const otherAssetsCount = accounts.filter(a =>
    a.account_type === AccountType.OTHER_ASSET
  ).length

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Physical Assets</h1>
          <p className="text-muted-foreground mt-2">
            Track real estate, vehicles, and other valuable assets
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpenDialog('real-estate')}>
              <Home className="mr-2 h-4 w-4" />
              Real Estate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenDialog('other-asset')}>
              <Package className="mr-2 h-4 w-4" />
              Other Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Asset Creation Dialogs */}
      <CreateRealEstateDialog
        open={openDialog === 'real-estate'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateOtherAssetDialog
        open={openDialog === 'other-asset'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {accounts.length} asset{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real Estate</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realEstateCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherAssetsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicles, jewelry, etc.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Home className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start tracking your physical assets like property, vehicles, and valuables
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Asset
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpenDialog('real-estate')}>
                <Home className="mr-2 h-4 w-4" />
                Real Estate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenDialog('other-asset')}>
                <Package className="mr-2 h-4 w-4" />
                Other Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <AccountsTable
          accounts={accounts}
          onDelete={handleDelete}
          showInstitution={false}
          showType={true}
        />
      )}
    </div>
  )
}
