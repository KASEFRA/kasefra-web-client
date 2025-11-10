'use client'

/**
 * Asset Valuation Form Component
 * Create and edit asset valuations with full details
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { AssetType, ValuationMethod, type AssetValuation } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  account_id: z.string().uuid(),
  asset_name: z.string().min(1, 'Asset name is required').max(255),
  asset_type: z.nativeEnum(AssetType),
  purchase_price: z.number().positive('Purchase price must be positive'),
  purchase_date: z.date(),
  current_value: z.number().positive('Current value must be positive'),
  valuation_date: z.date(),
  valuation_method: z.nativeEnum(ValuationMethod),
  depreciation_rate: z.number().min(0).max(100).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AssetValuationFormProps {
  accountId: string
  valuation?: AssetValuation | null
  open: boolean
  onClose: () => void
  onSubmit: (data: FormValues) => Promise<void>
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

export function AssetValuationForm({
  accountId,
  valuation,
  open,
  onClose,
  onSubmit,
}: AssetValuationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!valuation

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_id: accountId,
      asset_name: valuation?.asset_name || '',
      asset_type: valuation?.asset_type || AssetType.OTHER,
      purchase_price: valuation?.purchase_price || 0,
      purchase_date: valuation ? new Date(valuation.purchase_date) : new Date(),
      current_value: valuation?.current_value || 0,
      valuation_date: valuation ? new Date(valuation.valuation_date) : new Date(),
      valuation_method: valuation?.valuation_method || ValuationMethod.USER_ESTIMATE,
      depreciation_rate: valuation?.depreciation_rate || null,
      location: valuation?.location || null,
      notes: valuation?.notes || null,
    },
  })

  const selectedAssetType = form.watch('asset_type')
  const showDepreciationField = selectedAssetType === AssetType.VEHICLE
  const showLocationField = selectedAssetType === AssetType.REAL_ESTATE

  // Reset form when valuation changes
  useEffect(() => {
    if (valuation) {
      form.reset({
        account_id: accountId,
        asset_name: valuation.asset_name,
        asset_type: valuation.asset_type,
        purchase_price: valuation.purchase_price,
        purchase_date: new Date(valuation.purchase_date),
        current_value: valuation.current_value,
        valuation_date: new Date(valuation.valuation_date),
        valuation_method: valuation.valuation_method,
        depreciation_rate: valuation.depreciation_rate,
        location: valuation.location,
        notes: valuation.notes,
      })
    } else {
      form.reset({
        account_id: accountId,
        asset_name: '',
        asset_type: AssetType.OTHER,
        purchase_price: 0,
        purchase_date: new Date(),
        current_value: 0,
        valuation_date: new Date(),
        valuation_method: ValuationMethod.USER_ESTIMATE,
        depreciation_rate: null,
        location: null,
        notes: null,
      })
    }
  }, [valuation, accountId, form])

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(values)
      onClose()
    } catch (error) {
      console.error('Failed to submit asset valuation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Update Asset Valuation' : 'Add Asset Valuation'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the valuation details for this asset'
              : 'Add detailed information about your asset'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Asset Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Asset Information</h3>

              <FormField
                control={form.control}
                name="asset_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Downtown Condo, Toyota Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showLocationField && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Dubai Marina, Downtown Abu Dhabi"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Location of the property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Purchase Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Purchase Details</h3>

              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (AED) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? 0 : parseFloat(value))
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Original purchase price of the asset
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current Valuation Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Current Valuation</h3>

              <FormField
                control={form.control}
                name="current_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value (AED) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? 0 : parseFloat(value))
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Current estimated value of the asset
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valuation_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valuation Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valuation_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuation Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select valuation method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(VALUATION_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How was the current value determined?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showDepreciationField && (
                <FormField
                  control={form.control}
                  name="depreciation_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Depreciation Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 15.00"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? null : parseFloat(value))
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Annual depreciation percentage for vehicle valuation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Additional Information</h3>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details about this asset..."
                        className="resize-none"
                        rows={3}
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Valuation' : 'Add Valuation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
