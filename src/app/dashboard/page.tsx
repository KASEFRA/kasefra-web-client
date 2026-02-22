'use client'

/**
 * Dashboard Home Page
 * Main dashboard overview page with real API data
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { networthApi, healthScoreApi } from '@/lib/api'
import type { HealthScoreResponse } from '@/lib/api/health-score'
import { HealthScoreCard } from '@/components/health-score/health-score-card'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRightLeft,
  PieChart,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Settings2,
  RotateCcw,
} from 'lucide-react'

// Import Dashboard Widgets
// The below imports are called named imports
import { RecentTransactions } from '@/components/dashboard/widgets/recent-transactions'
import BudgetProgressSummary from '@/components/dashboard/widgets/budget-progress'
// if a module have only one funciton to export use default and export it, no named: so can use any name
// then import isdirectly; No curly brackets needed
// but if you export not using defaut, means you are exporting multiple functions together, you should import them using 
// import { function1, function2 } from 'location' these are named
import { UpcomingBillsWidget } from '@/components/dashboard/widgets/upcoming-bills'
import { ActiveGoalsWidget } from '@/components/dashboard/widgets/active-goals'

type DashboardWidgetId =
  | 'recent-transactions'
  | 'budget-progress'
  | 'upcoming-bills'
  | 'active-goals'

type DashboardWidgetLayout = {
  left: DashboardWidgetId[]
  right: DashboardWidgetId[]
}

const DASHBOARD_LAYOUT_KEY = 'kasefra:dashboard:layout:v1'

const dashboardWidgets: Record<
  DashboardWidgetId,
  { label: string; Component: () => JSX.Element }
> = {
  'recent-transactions': {
    label: 'Recent Transactions',
    Component: RecentTransactions, // when we use another name, it fails as it is named imports as it is not default export, 
    // export function name() {...}
  },
  'budget-progress': {
    label: 'Budget Progress',
    Component: BudgetProgressSummary,
  },
  'upcoming-bills': {
    label: 'Upcoming Bills',
    Component: UpcomingBillsWidget,
  },
  'active-goals': {
    label: 'Active Goals',
    Component: ActiveGoalsWidget,
  },
}

const DEFAULT_LAYOUT: DashboardWidgetLayout = {
  left: ['recent-transactions', 'upcoming-bills'],
  right: ['budget-progress', 'active-goals'],
}

const isWidgetId = (value: unknown): value is DashboardWidgetId => {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(dashboardWidgets, value as PropertyKey)
}

const dedupeWidgets = (list: DashboardWidgetId[]) => {
  const seen = new Set<DashboardWidgetId>()
  return list.filter((item) => {
    if (seen.has(item)) return false
    seen.add(item)
    return true
  })
}

const normalizeLayout = (layout?: Partial<DashboardWidgetLayout>): DashboardWidgetLayout => {
  const left = dedupeWidgets((layout?.left ?? []).filter(isWidgetId))
  const right = dedupeWidgets((layout?.right ?? []).filter(isWidgetId))
  const used = new Set([...left, ...right])
  const missing = (Object.keys(dashboardWidgets) as DashboardWidgetId[]).filter(
    (id) => !used.has(id)
  )

  const nextLeft = [...left]
  const nextRight = [...right]
  missing.forEach((id) => {
    if (nextLeft.length <= nextRight.length) {
      nextLeft.push(id)
    } else {
      nextRight.push(id)
    }
  })

  return { left: nextLeft, right: nextRight }
}

const moveItem = (list: DashboardWidgetId[], fromIndex: number, toIndex: number) => {
  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    liquidAssets: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    accountsCount: 0,
  })
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null)
  const [widgetLayout, setWidgetLayout] = useState<DashboardWidgetLayout>(DEFAULT_LAYOUT)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [layoutReady, setLayoutReady] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    const storedLayout = window.localStorage.getItem(DASHBOARD_LAYOUT_KEY)
    if (!storedLayout) {
      setLayoutReady(true)
      return
    }

    try {
      const parsed = JSON.parse(storedLayout) as DashboardWidgetLayout
      setWidgetLayout(normalizeLayout(parsed))
    } catch (error) {
      console.warn('Failed to parse dashboard layout preference:', error)
    } finally {
      setLayoutReady(true)
    }
  }, [])

  useEffect(() => {
    if (!layoutReady) return
    window.localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(widgetLayout))
  }, [widgetLayout, layoutReady])

  const loadDashboardData = async () => {
    try {
      // Fetch net worth and health score in parallel
      const [networth, score] = await Promise.all([
        networthApi.getCurrent(),
        healthScoreApi.get().catch(() => null),
      ])
      setHealthScore(score)
      setStats({
        liquidAssets: networth.liquid_assets,
        totalAssets: networth.total_assets,
        totalLiabilities: networth.total_liabilities,
        netWorth: networth.net_worth,
        accountsCount: networth.total_accounts,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMoveWidget = (widgetId: DashboardWidgetId, direction: 'up' | 'down' | 'left' | 'right') => {
    setWidgetLayout((current) => {
      const layout = normalizeLayout(current)
      const isOnLeft = layout.left.includes(widgetId)
      const columnKey = isOnLeft ? 'left' : 'right'
      const column = isOnLeft ? layout.left : layout.right
      const index = column.indexOf(widgetId)

      if (index === -1) return layout

      if (direction === 'up' && index > 0) {
        const nextColumn = moveItem(column, index, index - 1)
        return isOnLeft ? { ...layout, left: nextColumn } : { ...layout, right: nextColumn }
      }

      if (direction === 'down' && index < column.length - 1) {
        const nextColumn = moveItem(column, index, index + 1)
        return isOnLeft ? { ...layout, left: nextColumn } : { ...layout, right: nextColumn }
      }

      if (direction === 'left' && !isOnLeft) {
        const nextRight = [...layout.right]
        nextRight.splice(index, 1)
        const targetIndex = Math.min(index, layout.left.length)
        const nextLeft = [...layout.left]
        nextLeft.splice(targetIndex, 0, widgetId)
        return { left: nextLeft, right: nextRight }
      }

      if (direction === 'right' && isOnLeft) {
        const nextLeft = [...layout.left]
        nextLeft.splice(index, 1)
        const targetIndex = Math.min(index, layout.right.length)
        const nextRight = [...layout.right]
        nextRight.splice(targetIndex, 0, widgetId)
        return { left: nextLeft, right: nextRight }
      }

      return layout
    })
  }

  const handleResetLayout = () => {
    setWidgetLayout(DEFAULT_LAYOUT)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's your financial overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Liquid Assets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquid Assets
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.liquidAssets)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.accountsCount} {stats.accountsCount === 1 ? 'account' : 'accounts'} connected
            </p>
          </CardContent>
        </Card>

        {/* Total Assets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAssets)}</div>
            <p className="text-xs text-green-600 mt-1">
              Asset holdings
            </p>
          </CardContent>
        </Card>

        {/* Total Liabilities Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Liabilities
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalLiabilities)}</div>
            <p className="text-xs text-red-600 mt-1">
              Outstanding debts
            </p>
          </CardContent>
        </Card>

        {/* Net Worth Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Worth
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.netWorth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score */}
      <HealthScoreCard data={healthScore} loading={loading} />

      {/* Quick Actions */}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="h-11 justify-start gap-2"
          onClick={() => (window.location.href = '/dashboard/accounts')}
        >
          <Plus className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Add Account</span>
        </Button>

        <Button
          variant="outline"
          className="h-11 justify-start gap-2"
          onClick={() => (window.location.href = '/dashboard/transactions')}
        >
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">New Transaction</span>
        </Button>

        <Button
          variant="outline"
          className="h-11 justify-start gap-2"
          onClick={() => (window.location.href = '/dashboard/budgets')}
        >
          <PieChart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Create Budget</span>
        </Button>

        <Button
          variant="outline"
          className="h-11 justify-start gap-2"
          onClick={() => (window.location.href = '/dashboard/goals')}
        >
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Set Goal</span>
        </Button>
      </div>



      {/* Dashboard Widgets */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        {(['left', 'right'] as const).map((columnKey) => {
          const widgets = widgetLayout[columnKey]
          return (
            <div key={columnKey} className="space-y-6">
              {widgets.map((widgetId, index) => {
                const isLeftColumn = columnKey === 'left'
                const canMoveUp = index > 0
                const canMoveDown = index < widgets.length - 1
                const canMoveLeft = !isLeftColumn
                const canMoveRight = isLeftColumn

                return (
                  <div key={widgetId} className="relative">
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
                          onClick={() => handleMoveWidget(widgetId, 'up')}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={!canMoveDown}
                          onClick={() => handleMoveWidget(widgetId, 'down')}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={!canMoveLeft}
                          onClick={() => handleMoveWidget(widgetId, 'left')}
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={!canMoveRight}
                          onClick={() => handleMoveWidget(widgetId, 'right')}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className={isCustomizing ? 'ring-1 ring-border/60 rounded-lg' : undefined}>
                      {(() => {
                        const WidgetComponent = dashboardWidgets[widgetId].Component
                        return <WidgetComponent />
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
