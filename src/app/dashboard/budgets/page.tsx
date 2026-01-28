'use client'

/**
 * Budgets Overview Page
 * Display all budgets with current budget progress
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { Budget } from '@/types'
import { Plus, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetProgressCard } from '@/components/budgets/budget-progress-card'
import { BudgetList } from '@/components/budgets/budget-list'
import { BillsTab } from '@/components/bills/bills-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const searchParams = useSearchParams()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncKey, setSyncKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'budgets' | 'bills'>(
    searchParams.get('tab') === 'bills' ? 'bills' : 'budgets'
  )

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'bills' || tab === 'budgets') {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const handleSync = async () => {
    if (!currentBudget) return

    try {
      setIsSyncing(true)
      await budgetsApi.syncCurrent()
      toast.success('Budget synced successfully')
      setSyncKey((value) => value + 1)
    } catch (error: any) {
      console.error('Failed to sync budget:', error)
      toast.error(error.response?.data?.detail || 'Failed to sync budget')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleTabChange = (value: string) => {
    const nextTab = value === 'bills' ? 'bills' : 'budgets'
    setActiveTab(nextTab)
    router.replace(`/dashboard/budgets?tab=${nextTab}`)
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
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === 'bills' ? 'Bills' : 'Budgets'}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'bills'
              ? 'Track recurring payments and due dates in one place.'
              : 'Monthly budgets are created automatically. Set limits to start tracking.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'budgets' && currentBudget ? (
            <>
              <Button onClick={() => router.push(`/dashboard/budgets/${currentBudget.id}/edit`)}>
                Edit Budget
              </Button>
              <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                  </>
                )}
              </Button>
            
            </>
          ) : null}
          {activeTab === 'budgets' && !currentBudget ? (
            <Button onClick={() => router.push('/dashboard/budgets/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-6">
          {/* Current Budget Progress */}
          {currentBudget && (
            <div className="space-y-4">
              <BudgetProgressCard
                budgetId={currentBudget.id}
                showCategories={true}
                refreshKey={syncKey}
              />
            </div>
          )}

          {/* Budgets History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Budgets History</h2>
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
        </TabsContent>

        <TabsContent value="bills">
          <BillsTab />
        </TabsContent>
      </Tabs>

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
