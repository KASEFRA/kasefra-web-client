'use client'

/**
 * Category Allocation Manager Component
 * Manages category allocations for a budget (create/edit modes)
 */

import { useState, useEffect, useMemo } from 'react'
import { categoriesApi } from '@/lib/api'
import { CategoryType } from '@/types'
import type { Category, BudgetCategory } from '@/types'
import { CategoryAllocationItem, type CategoryAllocation } from './category-allocation-item'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/currency'

interface CategoryAllocationManagerProps {
  /** Current allocations (for edit mode) */
  existingAllocations?: BudgetCategory[]
  /** Callback when allocations change */
  onChange: (allocations: CategoryAllocation[]) => void
  /** Whether to auto-include all expense categories */
  autoIncludeAll?: boolean
  /** Disabled state */
  disabled?: boolean
}

export function CategoryAllocationManager({
  existingAllocations = [],
  onChange,
  autoIncludeAll = true,
  disabled = false,
}: CategoryAllocationManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load expense categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Initialize allocations when categories or existing allocations change
  useEffect(() => {
    if (categories.length > 0) {
      initializeAllocations()
    }
  }, [categories, existingAllocations])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await categoriesApi.getAll()
      // Filter expense categories only
      const expenseCategories = response.categories.filter(
        (cat) => cat.category_type === CategoryType.EXPENSE && cat.is_active
      )
      setCategories(expenseCategories)
    } catch (err: any) {
      console.error('Failed to load categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const initializeAllocations = () => {
    if (existingAllocations.length > 0) {
      // Edit mode: Use existing allocations
      const allocs: CategoryAllocation[] = existingAllocations.map((bc) => {
        const category = categories.find((c) => c.id === bc.category_id)
        return {
          category_id: bc.category_id,
          category_name: bc.category_name || category?.name || 'Unknown',
          category_icon: category?.icon || null,
          category_color: category?.color || null,
          allocated_amount: bc.allocated_amount,
          alert_threshold: bc.alert_threshold,
          alert_enabled: bc.alert_enabled,
        }
      })
      setAllocations(allocs)
      onChange(allocs)
    } else if (autoIncludeAll) {
      // Create mode: Auto-include all categories with $0
      const allocs: CategoryAllocation[] = categories.map((cat) => ({
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        allocated_amount: 0,
        alert_threshold: 0.8,
        alert_enabled: true,
      }))
      setAllocations(allocs)
      onChange(allocs)
    }
  }

  const handleAllocationChange = (index: number, updated: CategoryAllocation) => {
    const newAllocations = [...allocations]
    newAllocations[index] = updated
    setAllocations(newAllocations)
    onChange(newAllocations)
  }

  const handleRemoveAllocation = (index: number) => {
    const newAllocations = allocations.filter((_, i) => i !== index)
    setAllocations(newAllocations)
    onChange(newAllocations)
  }

  // Filter allocations by search query
  const filteredAllocations = useMemo(() => {
    if (!searchQuery.trim()) return allocations
    return allocations.filter((alloc) =>
      alloc.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allocations, searchQuery])

  // Calculate totals
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, alloc) => sum + (alloc.allocated_amount || 0), 0)
  }, [allocations])

  const categoriesWithBudget = useMemo(() => {
    return allocations.filter((alloc) => alloc.allocated_amount > 0).length
  }, [allocations])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Category Allocations</CardTitle>
            <CardDescription>
              Set budget amounts for each spending category
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
            <p className="text-sm text-muted-foreground">
              {categoriesWithBudget} of {allocations.length} categories
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Allocations List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filteredAllocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No categories match your search' : 'No categories available'}
            </div>
          ) : (
            filteredAllocations.map((allocation, index) => {
              // Find actual index in full allocations array for proper updates
              const actualIndex = allocations.findIndex(
                (a) => a.category_id === allocation.category_id
              )
              return (
                <CategoryAllocationItem
                  key={allocation.category_id}
                  allocation={allocation}
                  onChange={(updated) => handleAllocationChange(actualIndex, updated)}
                  onRemove={() => handleRemoveAllocation(actualIndex)}
                  showRemoveButton={!autoIncludeAll}
                  disabled={disabled}
                />
              )
            })
          )}
        </div>

        {/* Summary Info */}
        {allocations.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-medium">{formatCurrency(totalAllocated)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Categories with budget</span>
              <span className="font-medium">{categoriesWithBudget}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Categories with no budget</span>
              <span className="font-medium">{allocations.length - categoriesWithBudget}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
