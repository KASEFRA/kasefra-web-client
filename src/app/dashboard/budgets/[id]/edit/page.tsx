'use client'

/**
 * Budget Edit Page
 * Edit existing budget details and category allocations
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { Budget, BudgetCategory } from '@/types'
import { BudgetForm, type BudgetFormValues } from '@/components/budgets/budget-form'
import { CategoryAllocationManager } from '@/components/budgets/category-allocation-manager'
import type { CategoryAllocation } from '@/components/budgets/category-allocation-item'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BudgetEditPage() {
  const params = useParams()
  const router = useRouter()
  const budgetId = params.id as string

  const [budget, setBudget] = useState<Budget | null>(null)
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [allocations, setAllocations] = useState<CategoryAllocation[]>([])

  useEffect(() => {
    if (budgetId) {
      loadData()
    }
  }, [budgetId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load budget and categories in parallel
      const [budgetData, categoriesResponse] = await Promise.all([
        budgetsApi.getById(budgetId),
        budgetsApi.getCategories(budgetId),
      ])

      setBudget(budgetData)
      setBudgetCategories(categoriesResponse.categories)
    } catch (err: any) {
      console.error('Failed to load budget:', err)
      setError(err.response?.data?.detail || 'Failed to load budget')
      toast.error('Failed to load budget')
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetSubmit = async (values: BudgetFormValues) => {
    try {
      setIsSubmitting(true)

      // Update budget basic info
      await budgetsApi.update(budgetId, {
        name: values.name,
        end_date: values.end_date || null,
        rollover_enabled: values.rollover_enabled,
        notes: values.notes || null,
      })

      // Update category allocations
      await updateCategoryAllocations()

      toast.success('Budget updated successfully')
      router.push(`/dashboard/budgets/${budgetId}`)
    } catch (err: any) {
      console.error('Failed to update budget:', err)
      toast.error(err.response?.data?.detail || 'Failed to update budget')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateCategoryAllocations = async () => {
    // Get existing budget category IDs
    const existingCategoryMap = new Map(
      budgetCategories.map((bc) => [bc.category_id, bc.id])
    )

    // Track which categories are still in allocations
    const currentCategoryIds = new Set(allocations.map((a) => a.category_id))

    // Remove categories that are no longer in allocations
    const removePromises = budgetCategories
      .filter((bc) => !currentCategoryIds.has(bc.category_id))
      .map((bc) => budgetsApi.removeCategory(budgetId, bc.id))

    // Add or update categories
    const updatePromises = allocations.map((allocation) => {
      const existingBudgetCategoryId = existingCategoryMap.get(allocation.category_id)

      if (existingBudgetCategoryId) {
        // Update existing
        return budgetsApi.updateCategory(budgetId, existingBudgetCategoryId, {
          allocated_amount: allocation.allocated_amount,
          alert_threshold: allocation.alert_threshold,
          alert_enabled: allocation.alert_enabled,
        })
      } else {
        // Add new
        return budgetsApi.addCategory(budgetId, {
          category_id: allocation.category_id,
          allocated_amount: allocation.allocated_amount,
          alert_threshold: allocation.alert_threshold,
          alert_enabled: allocation.alert_enabled,
        })
      }
    })

    // Execute all updates in parallel
    await Promise.all([...removePromises, ...updatePromises])
  }

  const handleCancel = () => {
    router.push(`/dashboard/budgets/${budgetId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/budgets/${budgetId}`)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Budget
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading budget...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/budgets')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Budgets
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Budget not found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'The budget you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/dashboard/budgets')}>
              View All Budgets
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/budgets/${budgetId}`)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Budget</h1>
          <p className="text-muted-foreground">Update your budget details and allocations</p>
        </div>
      </div>

      {/* Budget Form */}
      <BudgetForm
        mode="edit"
        initialData={budget}
        onSubmit={handleBudgetSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />

      {/* Category Allocations */}
      <CategoryAllocationManager
        existingAllocations={budgetCategories}
        onChange={setAllocations}
        autoIncludeAll={true}
        disabled={isSubmitting}
      />

      {/* Save Button (bottom) */}
      <div className="flex justify-end gap-4 sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => handleBudgetSubmit(budget as any)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
