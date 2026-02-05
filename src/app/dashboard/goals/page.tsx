'use client'

/**
 * Goals Overview Page
 * Display all financial goals with summary and filtering
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { goalsApi } from '@/lib/api/goals'
import type { Goal, GoalSummary } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { GoalsList } from '@/components/goals/goals-list'
import {
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Loader2,
  AlertCircle,
  Settings2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'

type GoalsSectionId = 'warnings' | 'summary' | 'goals-list'

const GOALS_LAYOUT_KEY = 'kasefra:goals:layout:v1'
const DEFAULT_GOALS_LAYOUT: GoalsSectionId[] = ['warnings', 'summary', 'goals-list']

const isGoalsSectionId = (value: unknown): value is GoalsSectionId =>
  value === 'warnings' || value === 'summary' || value === 'goals-list'

const normalizeGoalsLayout = (layout?: GoalsSectionId[]) => {
  const seen = new Set<GoalsSectionId>()
  const next: GoalsSectionId[] = []

  ;(layout ?? []).forEach((item) => {
    if (isGoalsSectionId(item) && !seen.has(item)) {
      seen.add(item)
      next.push(item)
    }
  })

  DEFAULT_GOALS_LAYOUT.forEach((item) => {
    if (!seen.has(item)) {
      next.push(item)
    }
  })

  return next
}

export default function GoalsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<GoalSummary | null>(null)
  const [allGoals, setAllGoals] = useState<Goal[]>([])
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([])
  const [activeTab, setActiveTab] = useState('active')
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<GoalsSectionId[]>(DEFAULT_GOALS_LAYOUT)
  const [layoutReady, setLayoutReady] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const storedLayout = window.localStorage.getItem(GOALS_LAYOUT_KEY)
    if (!storedLayout) {
      setLayoutReady(true)
      return
    }

    try {
      const parsed = JSON.parse(storedLayout) as GoalsSectionId[]
      setSectionOrder(normalizeGoalsLayout(parsed))
    } catch (error) {
      console.warn('Failed to parse goals layout preference:', error)
    } finally {
      setLayoutReady(true)
    }
  }, [])

  useEffect(() => {
    if (!layoutReady) return
    window.localStorage.setItem(GOALS_LAYOUT_KEY, JSON.stringify(sectionOrder))
  }, [sectionOrder, layoutReady])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [summaryRes, allGoalsRes] = await Promise.all([
        goalsApi.getSummary(),
        goalsApi.getAll()
      ])

      setSummary(summaryRes)
      setAllGoals(allGoalsRes.goals)

      const active = allGoalsRes.goals.filter(g => g.status === 'active')
      const completed = allGoalsRes.goals.filter(g => g.status === 'completed')
      
      setActiveGoals(active)
      setCompletedGoals(completed)
    } catch (error) {
      console.error('Failed to load goals:', error)
      toast.error('Failed to load goals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!goalToDelete) return

    try {
      setDeleting(true)
      await goalsApi.delete(goalToDelete.id)
      
      toast.success('Goal deleted successfully')
      
      setGoalToDelete(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete goal:', error)
      toast.error('Failed to delete goal. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleMoveSection = (sectionId: GoalsSectionId, direction: 'up' | 'down') => {
    setSectionOrder((current) => {
      const layout = normalizeGoalsLayout(current)
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
    setSectionOrder(DEFAULT_GOALS_LAYOUT)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeGoalsWithWarning = activeGoals.filter(g => {
    const daysRemaining = Math.ceil(
      (new Date(g.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysRemaining < 30
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track and achieve your savings goals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => router.push('/dashboard/goals/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
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
        </div>
      </div>

      {(() => {
        const sections: Record<GoalsSectionId, JSX.Element | null> = {
          warnings:
            activeGoalsWithWarning.length > 0 ? (
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900 dark:text-orange-100">
                      {activeGoalsWithWarning.length}{' '}
                      {activeGoalsWithWarning.length === 1 ? 'goal' : 'goals'} approaching
                      deadline
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      {activeGoalsWithWarning.length === 1
                        ? 'One of your goals has less than 30 days remaining.'
                        : `${activeGoalsWithWarning.length} goals have less than 30 days remaining.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : null,
          summary: summary ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_goals}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.active_goals} active, {summary.completed_goals} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Target</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(summary.total_target_amount))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Savings</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(summary.total_saved_amount))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Number(summary.overall_progress_percentage || 0).toFixed(1)}% of target
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Amount Remaining</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(summary.total_remaining))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">To reach all goals</p>
                </CardContent>
              </Card>
            </div>
          ) : null,
          'goals-list': (
            <Card>
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>View and manage your financial goals</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({completedGoals.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">All ({allGoals.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-4">
                    {activeGoals.length > 0 ? (
                      <GoalsList goals={activeGoals} onDelete={(goal) => setGoalToDelete(goal)} />
                    ) : (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No active goals</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Create a new goal to start saving for your financial dreams
                        </p>
                        <Button onClick={() => router.push('/dashboard/goals/new')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Goal
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4">
                    {completedGoals.length > 0 ? (
                      <GoalsList
                        goals={completedGoals}
                        onDelete={(goal) => setGoalToDelete(goal)}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No completed goals yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed goals will appear here
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="space-y-4">
                    <GoalsList goals={allGoals} onDelete={(goal) => setGoalToDelete(goal)} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ),
        }

        const visibleSections = normalizeGoalsLayout(sectionOrder).filter(
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{goalToDelete?.goal_name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
