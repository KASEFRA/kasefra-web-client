'use client'

/**
 * Net Worth Page
 * View and track net worth over time
 */

import { useEffect, useState } from 'react'
import { networthApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { NetWorthCurrent, NetWorthTrend, NetWorthAllocation } from '@/types'
import { TrendingUp, TrendingDown, Wallet, PieChart, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NetWorthTrendChart } from '@/components/networth/networth-trend-chart'

export default function NetWorthPage() {
  const [currentNetWorth, setCurrentNetWorth] = useState<NetWorthCurrent | null>(null)
  const [trends, setTrends] = useState<NetWorthTrend | null>(null)
  const [allocation, setAllocation] = useState<NetWorthAllocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNetWorthData()
  }, [])

  const loadNetWorthData = async () => {
    try {
      setLoading(true)
      const current = await networthApi.getCurrent()
      const [trendsData, allocationData] = await Promise.all([
        networthApi.getTrends(),
        networthApi.getAllocation(),
      ])
      setCurrentNetWorth(current)
      setTrends(trendsData)
      setAllocation(allocationData)
    } catch (error) {
      console.error('Failed to load net worth data:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const formatAccountType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const assetBreakdown = currentNetWorth?.assets_breakdown || []
  const liabilityBreakdown = currentNetWorth?.liabilities_breakdown || []

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading net worth data...</p>
        </div>
      </div>
    )
  }

  if (!currentNetWorth) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">No net worth data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some accounts to start tracking your net worth
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Net Worth</h1>
          <p className="mt-1 text-muted-foreground">
            Track your total wealth over time
          </p>
        </div>
        <Button variant="outline" onClick={loadNetWorthData}>
          Refresh
        </Button>
      </div>

      {/* Current Net Worth Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Net Worth</p>
              <h2 className="text-4xl font-bold text-foreground">
                {formatCurrency(currentNetWorth.net_worth)}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                As of {new Date(currentNetWorth.calculated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Assets vs Liabilities */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
            <p className="text-sm text-green-700 dark:text-green-400">Total Assets</p>
            <p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(currentNetWorth.total_assets)}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-700 dark:text-green-400">Liquid</span>
                <span className="font-medium text-green-900 dark:text-green-300">
                  {formatCurrency(currentNetWorth.liquid_assets)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-700 dark:text-green-400">Investments</span>
                <span className="font-medium text-green-900 dark:text-green-300">
                  {formatCurrency(currentNetWorth.investment_assets)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-400">Total Liabilities</p>
            <p className="mt-1 text-2xl font-bold text-red-900 dark:text-red-300">
              {formatCurrency(currentNetWorth.total_liabilities)}
            </p>
            {currentNetWorth.debt_to_income_ratio !== null && currentNetWorth.debt_to_income_ratio !== undefined && (
              <div className="mt-2">
                <p className="text-xs text-red-700 dark:text-red-400">
                  Debt-to-Income Ratio
                </p>
                <p className="mt-1 text-lg font-semibold text-red-900 dark:text-red-300">
                  {(currentNetWorth.debt_to_income_ratio * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net Worth Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Net Worth Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Net Worth = Total Assets - Total Liabilities
              </p>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formatCurrency(currentNetWorth.total_assets)} -{' '}
              {formatCurrency(currentNetWorth.total_liabilities)} ={' '}
              {formatCurrency(currentNetWorth.net_worth)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Assets</p>
                  <p className="text-xs text-muted-foreground">Sum of all asset accounts</p>
                </div>
                <Badge variant="outline">
                  {formatCurrency(currentNetWorth.total_assets)}
                </Badge>
              </div>
              {assetBreakdown.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  No asset accounts found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetBreakdown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.account_name}</TableCell>
                          <TableCell>{formatAccountType(item.account_type)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatAccountType(item.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">
                            {formatCurrency(item.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Liabilities</p>
                  <p className="text-xs text-muted-foreground">Sum of all liability accounts</p>
                </div>
                <Badge variant="outline">
                  {formatCurrency(currentNetWorth.total_liabilities)}
                </Badge>
              </div>
              {liabilityBreakdown.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  No liability accounts found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liabilityBreakdown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.account_name}</TableCell>
                          <TableCell>{formatAccountType(item.account_type)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatAccountType(item.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-700">
                            {formatCurrency(item.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {trends && <NetWorthTrendChart trends={trends} />}


      {/* Trends */}
      {trends && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Trends & Changes</h3>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {/* Current */}
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(trends.current_net_worth)}
              </p>
            </div>

            {/* Month over Month */}
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm text-muted-foreground">Month over Month</p>
              <div className="mt-1 flex items-center gap-2">
                {trends.month_over_month_change !== null && trends.month_over_month_change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-2xl font-bold ${
                  trends.month_over_month_change !== null && trends.month_over_month_change >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatPercentage(trends.month_over_month_percentage)}
                </p>
              </div>
              {trends.month_over_month_change !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(Math.abs(trends.month_over_month_change))}
                </p>
              )}
            </div>

            {/* Year over Year */}
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm text-muted-foreground">Year over Year</p>
              <div className="mt-1 flex items-center gap-2">
                {trends.year_over_year_change !== null && trends.year_over_year_change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-2xl font-bold ${
                  trends.year_over_year_change !== null && trends.year_over_year_change >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatPercentage(trends.year_over_year_percentage)}
                </p>
              </div>
              {trends.year_over_year_change !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(Math.abs(trends.year_over_year_change))}
                </p>
              )}
            </div>
          </div>

          {/* Historical Chart Placeholder */}
          {trends.trend_data.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Historical Trend</h4>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4 space-y-2">
                {trends.trend_data.slice(-6).map((data) => (
                  <div
                    key={data.date}
                    className="flex items-center justify-between rounded-lg bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(data.date).toLocaleDateString('en-AE', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assets: {formatCurrency(data.total_assets)} • Liabilities: {formatCurrency(data.total_liabilities)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(data.net_worth)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Asset Allocation */}
      {allocation && allocation.allocations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Asset Allocation</h3>
          </div>

          <div className="mt-4 space-y-3">
            {allocation.allocations.map((item) => (
              <div key={item.account_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {formatAccountType(item.account_type)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(item.balance)}
                    </p>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(allocation.total_assets)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
