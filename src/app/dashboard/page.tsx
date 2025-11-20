'use client'

/**
 * Dashboard Home Page
 * Main dashboard overview page with real API data
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { networthApi } from '@/lib/api'
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
} from 'lucide-react'

// Import Dashboard Widgets
import { RecentTransactions } from '@/components/dashboard/widgets/recent-transactions'
import { BudgetProgressWidget } from '@/components/dashboard/widgets/budget-progress'
import { UpcomingBillsWidget } from '@/components/dashboard/widgets/upcoming-bills'
import { ActiveGoalsWidget } from '@/components/dashboard/widgets/active-goals'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    accountsCount: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Fetch current net worth data from backend
      const networth = await networthApi.getCurrent()
      setStats({
        totalBalance: networth.net_worth,
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.full_name || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your financial overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => (window.location.href = '/dashboard/accounts')}
            >
              <Plus className="h-5 w-5 text-primary" />
              <div className="space-y-1 text-left w-full">
                <p className="font-semibold text-sm">Add Account</p>
                <p className="text-xs text-muted-foreground">Connect a bank</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => (window.location.href = '/dashboard/transactions')}
            >
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <div className="space-y-1 text-left w-full">
                <p className="font-semibold text-sm">New Transaction</p>
                <p className="text-xs text-muted-foreground">Add manually</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => (window.location.href = '/dashboard/budgets')}
            >
              <PieChart className="h-5 w-5 text-primary" />
              <div className="space-y-1 text-left w-full">
                <p className="font-semibold text-sm">Create Budget</p>
                <p className="text-xs text-muted-foreground">Set limits</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => (window.location.href = '/dashboard/goals')}
            >
              <Target className="h-5 w-5 text-primary" />
              <div className="space-y-1 text-left w-full">
                <p className="font-semibold text-sm">Set Goal</p>
                <p className="text-xs text-muted-foreground">Track progress</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Widgets - Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentTransactions />
        <BudgetProgressWidget />
      </div>

      {/* Dashboard Widgets - Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingBillsWidget />
        <ActiveGoalsWidget />
      </div>
    </div>
  )
}
