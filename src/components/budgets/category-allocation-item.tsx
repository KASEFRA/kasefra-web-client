'use client'

/**
 * Category Allocation Item Component
 * Single row for a category allocation within a budget
 */

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import type { Category } from '@/types'

export interface CategoryAllocation {
  category_id: string
  category_name: string
  category_icon: string | null
  category_color: string | null
  allocated_amount: number
  alert_threshold: number
  alert_enabled: boolean
}

interface CategoryAllocationItemProps {
  allocation: CategoryAllocation
  onChange: (updated: CategoryAllocation) => void
  onRemove?: () => void
  showRemoveButton?: boolean
  disabled?: boolean
}

export function CategoryAllocationItem({
  allocation,
  onChange,
  onRemove,
  showRemoveButton = true,
  disabled = false,
}: CategoryAllocationItemProps) {
  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0
    onChange({ ...allocation, allocated_amount: amount })
  }

  const handleThresholdChange = (value: number[]) => {
    onChange({ ...allocation, alert_threshold: value[0] / 100 })
  }

  const handleAlertEnabledChange = (checked: boolean) => {
    onChange({ ...allocation, alert_enabled: checked })
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      {/* Category Info */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="text-xl">{allocation.category_icon || '📁'}</span>
        <span className="font-medium truncate">{allocation.category_name}</span>
      </div>

      {/* Amount Input */}
      <div className="flex-1 max-w-[180px]">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            AED
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={allocation.allocated_amount || ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="pl-12 text-right"
            placeholder="0.00"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Alert Threshold */}
      <div className="flex-1 max-w-[200px] space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Alert at</span>
          <span className="font-medium">{Math.round(allocation.alert_threshold * 100)}%</span>
        </div>
        <Slider
          value={[allocation.alert_threshold * 100]}
          onValueChange={handleThresholdChange}
          min={50}
          max={100}
          step={5}
          disabled={disabled || !allocation.alert_enabled}
          className="w-full"
        />
      </div>

      {/* Alert Enabled */}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`alert-${allocation.category_id}`}
          checked={allocation.alert_enabled}
          onCheckedChange={handleAlertEnabledChange}
          disabled={disabled}
        />
        <Label
          htmlFor={`alert-${allocation.category_id}`}
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Alert
        </Label>
      </div>

      {/* Remove Button */}
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
