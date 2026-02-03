'use client'

/**
 * Budgets Overview Page
 * Display all budgets with current budget progress
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { budgetsApi } from '@/lib/api'
import type { Budget } from '@/types'
import {
  Plus,
  Loader2,
  RefreshCw,
  Settings2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetProgressCard } from '@/components/budgets/budget-progress-card'
import { BudgetList } from '@/components/budgets/budget-list'
import { BillsTab } from '@/components/bills/bills-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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

type BudgetsSectionId = 'current-budget' | 'budget-history'

const BUDGETS_LAYOUT_KEY = 'kasefra:budgets:layout:v1'
const DEFAULT_BUDGETS_LAYOUT: BudgetsSectionId[] = ['current-budget', 'budget-history']

const isBudgetsSectionId = (value: unknown): value is BudgetsSectionId =>
  value === 'current-budget' || value === 'budget-history'

const normalizeBudgetsLayout = (layout?: BudgetsSectionId[]) => {
  const seen = new Set<BudgetsSectionId>()
  const next: BudgetsSectionId[] = []

  ;(layout ?? []).forEach((item) => {
    if (isBudgetsSectionId(item) && !seen.has(item)) {
      seen.add(item)
      next.push(item)
    }
  })

  DEFAULT_BUDGETS_LAYOUT.forEach((item) => {
    if (!seen.has(item)) {
      next.push(item)
    }
  })

  return next
}

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
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<BudgetsSectionId[]>(DEFAULT_BUDGETS_LAYOUT)
  const [layoutReady, setLayoutReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'budgets' | 'bills'>(
    searchParams.get('tab') === 'bills' ? 'bills' : 'budgets'
  )

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const storedLayout = window.localStorage.getItem(BUDGETS_LAYOUT_KEY)
    if (!storedLayout) {
      setLayoutReady(true)
      return
    }

    try {
      const parsed = JSON.parse(storedLayout) as BudgetsSectionId[]
      setSectionOrder(normalizeBudgetsLayout(parsed))
    } catch (error) {
      console.warn('Failed to parse budgets layout preference:', error)
    } finally {
      setLayoutReady(true)
    }
  }, [])

  useEffect(() => {
    if (!layoutReady) return
    window.localStorage.setItem(BUDGETS_LAYOUT_KEY, JSON.stringify(sectionOrder))
  }, [sectionOrder, layoutReady])

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

  const handleMoveSection = (sectionId: BudgetsSectionId, direction: 'up' | 'down') => {
    setSectionOrder((current) => {
      const layout = normalizeBudgetsLayout(current)
      const index = layout.indexOf(sectionId)

      if (index === -1) return layout

      if (direction === 'up' && index > 0) {
        const next = [...layout]
        const [item] = next.splice(index, 1)
        next.splice(index - 1, 0, item)
        return next
      }

      if (direction === 'down' && index < layout.length - 1) {
        const next = [...layout]
        const [item] = next.splice(index, 1)
        next.splice(index + 1, 0, item)
        return next
      }

      return layout
    })
  }

  const handleResetLayout = () => {
    setSectionOrder(DEFAULT_BUDGETS_LAYOUT)
  }

  const formatPeriodLabel = (period?: string) => {
    if (!period) return 'Monthly'
    const map: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return map[period] || period
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>{activeTab === 'bills' ? 'Recurring payments' : 'Spending guardrails'}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === 'bills' ? 'Bills' : 'Budgets'}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'bills'
              ? 'Track recurring payments and due dates in one place.'
              : 'Budgets are created automatically each period. Set limits to stay on track.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          {activeTab === 'budgets' && (
            <>
              <Button
                variant={isCustomizing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCustomizing((value) => !value)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                {isCustomizing ? 'Finish layout' : 'Customize layout'}
              </Button>
              {isCustomizing && (
                <Button variant="ghost" size="sm" onClick={handleResetLayout}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="rounded-full border border-border/60 bg-card/70 p-1">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-6">
          {(() => {
            const sections: Record<BudgetsSectionId, JSX.Element | null> = {
              'current-budget': currentBudget ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Active {formatPeriodLabel(currentBudget.period)} budget overview.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatPeriodLabel(currentBudget.period)}</Badge>
                      <Badge>Active</Badge>
                    </div>
                  </div>
                  <BudgetProgressCard
                    budgetId={currentBudget.id}
                    showCategories={true}
                    refreshKey={syncKey}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-6 text-center">
                  <p className="text-lg font-semibold">No active budget</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a budget to start tracking spending by category.
                  </p>
                  <Button className="mt-4" onClick={() => router.push('/dashboard/budgets/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Budget
                  </Button>
                </div>
              ),
              'budget-history': (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Budget History</h2>
                    {budgets.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'}
                      </p>
                    )}
                  </div>
                  <BudgetList budgets={budgets} onDelete={handleDelete} />
                </div>
              ),
            }

            const visibleSections = normalizeBudgetsLayout(sectionOrder).filter(
              (sectionId) => sections[sectionId]
            )

            return visibleSections.map((sectionId, index) => {
              const canMoveUp = index > 0
              const canMoveDown = index < visibleSections.length - 1
              const section = sections[sectionId]

              if (!section) return null

              return (
                <div key={sectionId} className="relative">
                  {isCustomizing && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm">
                      <span className="flex h-7 w-7 items-center justify-center text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canMoveUp}
                        onClick={() => handleMoveSection(sectionId, 'up')}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canMoveDown}
                        onClick={() => handleMoveSection(sectionId, 'down')}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <div className={isCustomizing ? 'ring-1 ring-border/60 rounded-lg' : undefined}>
                    {section}
                  </div>
                </div>
              )
            })
          })()}
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
