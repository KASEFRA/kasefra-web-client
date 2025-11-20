'use client'

/**
 * Budget Detail Page
 * Show detailed budget information and category progress
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { Budget, BudgetProgress } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { BudgetProgressCard } from '@/components/budgets/budget-progress-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const budgetId = params.id as string

  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (budgetId) {
      loadBudget()
    }
  }, [budgetId])

  const loadBudget = async () => {
    try {
      setLoading(true)
      setError(null)
      const budgetData = await budgetsApi.getById(budgetId)
      setBudget(budgetData)
    } catch (err: any) {
      console.error('Failed to load budget:', err)
      setError(err.response?.data?.detail || 'Failed to load budget')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/budgets/${budgetId}/edit`)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      await budgetsApi.delete(budgetId)
      toast.success('Budget deleted successfully')
      router.push('/dashboard/budgets')
    } catch (err: any) {
      console.error('Failed to delete budget:', err)
      toast.error(err.response?.data?.detail || 'Failed to delete budget')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getBudgetTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      fixed: 'Fixed Budget',
      flexible: 'Flexible Budget',
      zero_based: 'Zero-Based Budget',
    }
    return typeMap[type] || type
  }

  const getPeriodName = (period: string) => {
    const periodMap: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return periodMap[period] || period
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/budgets')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Budgets
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/budgets')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
            <p className="text-muted-foreground">
              {getBudgetTypeName(budget.budget_type)} • {getPeriodName(budget.period)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Budget Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
          <p className="text-lg font-semibold">{formatDate(budget.start_date)}</p>
        </div>
        {budget.end_date && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
            <p className="text-lg font-semibold">{formatDate(budget.end_date)}</p>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <p className="text-lg font-semibold">{budget.is_active ? 'Active' : 'Inactive'}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Rollover</h3>
          <p className="text-lg font-semibold">{budget.rollover_enabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      {budget.notes && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
          <p className="text-sm">{budget.notes}</p>
        </div>
      )}

      {/* Budget Progress */}
      <BudgetProgressCard budgetId={budgetId} showCategories={true} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{budget.name}</strong>? 
              This action cannot be undone. All budget categories and allocations will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Budget
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
