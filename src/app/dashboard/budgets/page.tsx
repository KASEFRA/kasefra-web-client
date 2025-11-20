'use client'

/**
 * Budgets Overview Page
 * Display all budgets with current budget progress
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { Budget } from '@/types'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetProgressCard } from '@/components/budgets/budget-progress-card'
import { BudgetList } from '@/components/budgets/budget-list'
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

export default function BudgetsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [budgetsResponse] = await Promise.all([
        budgetsApi.getAll(),
      ])
      
      setBudgets(budgetsResponse.budgets)
      
      // Try to load current budget
      try {
        const current = await budgetsApi.getCurrent()
        setCurrentBudget(current)
      } catch (error) {
        // No current budget is fine
        setCurrentBudget(null)
      }
    } catch (error: any) {
      console.error('Failed to load budgets:', error)
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (budget: Budget) => {
    setBudgetToDelete(budget)
  }

  const confirmDelete = async () => {
    if (!budgetToDelete) return

    try {
      setIsDeleting(true)
      await budgetsApi.delete(budgetToDelete.id)
      toast.success('Budget deleted successfully')
      setBudgetToDelete(null)
      loadData()
    } catch (error: any) {
      console.error('Failed to delete budget:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete budget')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading budgets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Track your spending and stay on budget
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/budgets/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Current Budget Progress */}
      {currentBudget && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Budget</h2>
          <BudgetProgressCard budgetId={currentBudget.id} showCategories={true} />
        </div>
      )}

      {/* All Budgets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Budgets</h2>
          {budgets.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'}
            </p>
          )}
        </div>
        <BudgetList 
          budgets={budgets}
          onDelete={handleDelete}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{budgetToDelete?.name}</strong>? 
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
                'Delete Budget'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
