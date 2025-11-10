'use client'

/**
 * Assets Page
 * Manage physical assets (real estate, vehicles, etc.)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsApi, assetsApi } from '@/lib/api'
import type { Account, AssetValuation } from '@/types'
import { AccountType } from '@/types'
import { Plus, Eye, Edit, Trash2, Home, Car, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AssetDetailModal } from '@/components/dashboard/assets/AssetDetailModal'
import { AssetValuationForm } from '@/components/dashboard/assets/AssetValuationForm'
import { toast } from 'sonner'

interface AccountWithValuations extends Account {
  valuations?: AssetValuation[]
  latestValuation?: AssetValuation
}

export default function AssetsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<AccountWithValuations[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [editingValuation, setEditingValuation] = useState<AssetValuation | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsApi.getAll()
      const assetAccounts = response.accounts.filter(acc =>
        acc.account_type === AccountType.REAL_ESTATE ||
        acc.account_type === AccountType.VEHICLE ||
        acc.account_type === AccountType.OTHER_ASSET
      )
      
      // Load valuations for each account
      const accountsWithValuations = await Promise.all(
        assetAccounts.map(async (account) => {
          try {
            const valuationsResponse = await assetsApi.getAll(account.id)
            const valuations = valuationsResponse.valuations || []
            const latestValuation = valuations.length > 0 
              ? valuations.sort((a, b) => 
                  new Date(b.valuation_date).getTime() - new Date(a.valuation_date).getTime()
                )[0]
              : undefined
            
            return {
              ...account,
              valuations,
              latestValuation,
            }
          } catch (error) {
            console.error(`Failed to load valuations for account ${account.id}:`, error)
            return { ...account, valuations: [], latestValuation: undefined }
          }
        })
      )
      
      setAccounts(accountsWithValuations)
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (valuation: AssetValuation) => {
    setSelectedValuationId(valuation.id)
    setDetailModalOpen(true)
  }

  const handleAddValuation = (accountId: string) => {
    setSelectedAccountId(accountId)
    setEditingValuation(null)
    setFormModalOpen(true)
  }

  const handleEditValuation = (valuation: AssetValuation) => {
    setSelectedAccountId(valuation.account_id)
    setEditingValuation(valuation)
    setDetailModalOpen(false)
    setFormModalOpen(true)
  }

  const handleDeleteValuation = async (valuationId: string) => {
    try {
      await assetsApi.delete(valuationId)
      toast.success('Asset valuation deleted successfully')
      setDetailModalOpen(false)
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete valuation:', error)
      toast.error('Failed to delete asset valuation')
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this asset account? This will also delete all associated valuations.')) {
      return
    }

    try {
      await accountsApi.delete(accountId)
      toast.success('Asset account deleted successfully')
      await loadAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete asset account')
    }
  }

  const handleSubmitValuation = async (data: any) => {
    try {
      const payload = {
        ...data,
        purchase_date: data.purchase_date.toISOString().split('T')[0],
        valuation_date: data.valuation_date.toISOString().split('T')[0],
      }

      if (editingValuation) {
        await assetsApi.update(editingValuation.id, payload)
        toast.success('Asset valuation updated successfully')
      } else {
        await assetsApi.create(payload)
        toast.success('Asset valuation created successfully')
      }

      setFormModalOpen(false)
      setEditingValuation(null)
      await loadAccounts()
    } catch (error: any) {
      console.error('Failed to save valuation:', error)
      toast.error(error.response?.data?.detail || 'Failed to save asset valuation')
      throw error
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totalValue = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

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
        <Button onClick={() => router.push('/dashboard/accounts/add?type=asset')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

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
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.account_name.toLowerCase().includes('real estate') || a.account_name.toLowerCase().includes('property')).length}
            </div>
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
            <div className="text-2xl font-bold">
              {accounts.filter(a => !a.account_name.toLowerCase().includes('real estate') && !a.account_name.toLowerCase().includes('property')).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicles, jewelry, etc.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            {accounts.length} asset{accounts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start tracking your physical assets like property, vehicles, and valuables
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Asset
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const latestVal = account.latestValuation
                const hasValuation = !!latestVal
                const gainLoss = hasValuation 
                  ? latestVal.current_value - latestVal.purchase_price 
                  : 0
                const isProfit = gainLoss >= 0

                return (
                  <Card key={account.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Home className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{account.account_name}</CardTitle>
                            <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              {hasValuation ? latestVal.asset_type.replace('_', ' ') : 'Asset'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {hasValuation ? (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(latestVal.current_value)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Purchase Price</p>
                              <p className="text-sm font-medium">{formatCurrency(latestVal.purchase_price)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {isProfit ? (
                                <TrendingUp className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs font-medium ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(Math.abs(gainLoss))}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleViewDetails(latestVal)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleEditValuation(latestVal)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">No valuation data yet</p>
                            <p className="text-sm font-medium mt-1">Add asset details to track value</p>
                          </div>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAddValuation(account.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Valuation
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AssetDetailModal
        valuationId={selectedValuationId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedValuationId(null)
        }}
        onEdit={handleEditValuation}
        onDelete={handleDeleteValuation}
      />

      {selectedAccountId && (
        <AssetValuationForm
          accountId={selectedAccountId}
          valuation={editingValuation}
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingValuation(null)
            setSelectedAccountId(null)
          }}
          onSubmit={handleSubmitValuation}
        />
      )}
    </div>
  )
}
