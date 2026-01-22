'use client'

/**
 * Create Budget Page
 * Form to create a new budget with category allocations
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { BudgetCreate } from '@/types'
import { BudgetForm, type BudgetFormValues } from '@/components/budgets/budget-form'
import { CategoryAllocationManager } from '@/components/budgets/category-allocation-manager'
import type { CategoryAllocation } from '@/components/budgets/category-allocation-item'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function CreateBudgetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([])

  const handleBudgetSubmit = async (values: BudgetFormValues) => {
    try {
      setIsSubmitting(true)

      // Create budget
      const payload: BudgetCreate = {
        name: values.name,
        period: values.period,
        start_date: values.start_date,
        end_date: values.end_date || null,
        rollover_enabled: values.rollover_enabled,
        notes: values.notes || null,
      }

      const createdBudget = await budgetsApi.create(payload)

      // Add category allocations (only those with allocated_amount > 0)
      const allocationsToAdd = allocations.filter((a) => a.allocated_amount > 0)

      if (allocationsToAdd.length > 0) {
        await Promise.all(
          allocationsToAdd.map((allocation) =>
            budgetsApi.addCategory(createdBudget.id, {
              category_id: allocation.category_id,
              allocated_amount: allocation.allocated_amount,
              alert_threshold: allocation.alert_threshold,
              alert_enabled: allocation.alert_enabled,
            })
          )
        )
      }

      toast.success('Budget created successfully!')
      router.push(`/dashboard/budgets/${createdBudget.id}`)
    } catch (error: any) {
      console.error('Failed to create budget:', error)
      toast.error(error.response?.data?.detail || 'Failed to create budget')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const categoriesWithBudget = allocations.filter((a) => a.allocated_amount > 0).length

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isSubmitting}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Budget</h1>
          <p className="text-muted-foreground">Set up a new budget to track your spending</p>
        </div>
      </div>

      {/* Budget Form */}
      <div className="max-w-4xl">
        <BudgetForm
          mode="create"
          onSubmit={handleBudgetSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Category Allocations */}
      <div className="max-w-4xl">
        <CategoryAllocationManager
          onChange={setAllocations}
          autoIncludeAll={true}
          disabled={isSubmitting}
        />
      </div>

      {/* Info Alert */}
      {categoriesWithBudget === 0 && (
        <div className="max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't set any budget amounts yet. You can set them now or add them later after
              creating the budget.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Submit Button (sticky bottom) */}
      <div className="max-w-4xl sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {categoriesWithBudget > 0 ? (
              <>
                <strong>{categoriesWithBudget}</strong> {categoriesWithBudget === 1 ? 'category' : 'categories'} with budget allocations
              </>
            ) : (
              'No category allocations yet'
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => handleBudgetSubmit({} as any)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Budget...
                </>
              ) : (
                'Create Budget'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
