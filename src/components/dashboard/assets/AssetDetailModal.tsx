'use client'

/**
 * Asset Detail Modal Component
 * View full details of an asset valuation
 */

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { assetsApi } from '@/lib/api'
import type { AssetValuation } from '@/types'
import { AssetType, ValuationMethod } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface AssetDetailModalProps {
  valuationId: string | null
  open: boolean
  onClose: () => void
  onEdit: (valuation: AssetValuation) => void
  onDelete: (valuationId: string) => void
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.REAL_ESTATE]: 'Real Estate',
  [AssetType.VEHICLE]: 'Vehicle',
  [AssetType.JEWELRY]: 'Jewelry',
  [AssetType.ART]: 'Art',
  [AssetType.COLLECTIBLES]: 'Collectibles',
  [AssetType.ELECTRONICS]: 'Electronics',
  [AssetType.FURNITURE]: 'Furniture',
  [AssetType.OTHER]: 'Other',
}

const VALUATION_METHOD_LABELS: Record<ValuationMethod, string> = {
  [ValuationMethod.APPRAISAL]: 'Professional Appraisal',
  [ValuationMethod.MARKET_ESTIMATE]: 'Market Estimate',
  [ValuationMethod.USER_ESTIMATE]: 'User Estimate',
  [ValuationMethod.PURCHASE_PRICE]: 'Purchase Price',
  [ValuationMethod.DEPRECIATION_CALC]: 'Depreciation Calculation',
}

export function AssetDetailModal({
  valuationId,
  open,
  onClose,
  onEdit,
  onDelete,
}: AssetDetailModalProps) {
  const [valuation, setValuation] = useState<AssetValuation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (valuationId && open) {
      loadValuation()
    }
  }, [valuationId, open])

  const loadValuation = async () => {
    if (!valuationId) return

    try {
      setLoading(true)
      const data = await assetsApi.getById(valuationId)
      setValuation(data)
    } catch (error) {
      console.error('Failed to load asset valuation:', error)
      toast.error('Failed to load asset details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch {
      return dateString
    }
  }

  const calculateGainLoss = () => {
    if (!valuation) return { amount: 0, percentage: 0 }
    const gainLoss = valuation.current_value - valuation.purchase_price
    const percentage = (gainLoss / valuation.purchase_price) * 100
    return { amount: gainLoss, percentage }
  }

  const { amount: gainLossAmount, percentage: gainLossPercentage } = calculateGainLoss()
  const isProfit = gainLossAmount >= 0

  if (loading || !valuation) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">{valuation.asset_name}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="mt-1">
                  {ASSET_TYPE_LABELS[valuation.asset_type]}
                </Badge>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(valuation)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this asset valuation?')) {
                    onDelete(valuation.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Value Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="text-2xl font-bold">{formatCurrency(valuation.purchase_price)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(valuation.purchase_date)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">{formatCurrency(valuation.current_value)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(valuation.valuation_date)}
              </p>
            </div>
          </div>

          {/* Gain/Loss Card */}
          <div
            className={`rounded-lg border p-4 ${
              isProfit
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isProfit ? 'Total Gain' : 'Total Loss'}
                </p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {isProfit ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  {formatCurrency(Math.abs(gainLossAmount))}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={isProfit ? 'default' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {isProfit ? '+' : ''}
                  {gainLossPercentage.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="font-medium">{ASSET_TYPE_LABELS[valuation.asset_type]}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valuation Method</p>
                <p className="font-medium">
                  {VALUATION_METHOD_LABELS[valuation.valuation_method]}
                </p>
              </div>

              {valuation.location && (
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{valuation.location}</p>
                </div>
              )}

              {valuation.depreciation_rate !== null && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Annual Depreciation Rate</p>
                  <p className="font-medium">{valuation.depreciation_rate}%</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(valuation.created_at)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(valuation.updated_at)}</p>
              </div>
            </div>

            {valuation.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{valuation.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
