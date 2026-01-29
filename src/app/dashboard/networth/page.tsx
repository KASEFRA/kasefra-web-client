'use client'

/**
 * Net Worth Page
 * View and track net worth over time
 */

import { useEffect, useState } from 'react'
import { networthApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { NetWorthCurrent, NetWorthTrend, NetWorthAllocation } from '@/types'
import { TrendingUp, TrendingDown, Wallet, PieChart, RefreshCcw, Minus } from 'lucide-react'
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
    if (value === null || value === undefined) return 'N/A'
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
  const monthChange = trends?.month_over_month_change ?? null
  const monthPct = trends?.month_over_month_percentage ?? null
  const yearChange = trends?.year_over_year_change ?? null
  const yearPct = trends?.year_over_year_percentage ?? null

  const changeTone = (value: number | null) => {
    if (value === null || value === undefined) return 'text-muted-foreground'
    return value < 0 ? 'text-red-600' : 'text-emerald-600'
  }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Net Worth</h1>
          <p className="mt-1 text-muted-foreground">
            Track your total wealth over time
          </p>
        </div>
        <Button variant="outline" onClick={loadNetWorthData}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Total Net Worth</CardTitle>
                <p className="text-sm text-muted-foreground">
                  As of {new Date(currentNetWorth.calculated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-foreground">
              {formatCurrency(currentNetWorth.net_worth)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Month over month</p>
                <div className="mt-1 flex items-center gap-2">
                  {monthChange === null || monthChange === undefined ? (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  ) : monthChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${changeTone(monthChange)}`}>
                    {formatPercentage(monthPct)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {monthChange === null ? 'N/A' : formatCurrency(Math.abs(monthChange))}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Year over year</p>
                <div className="mt-1 flex items-center gap-2">
                  {yearChange === null || yearChange === undefined ? (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  ) : yearChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${changeTone(yearChange)}`}>
                    {formatPercentage(yearPct)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {yearChange === null ? 'N/A' : formatCurrency(Math.abs(yearChange))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Assets</CardTitle>
            <p className="text-sm text-muted-foreground">Cash + investments + tangible</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(currentNetWorth.total_assets)}
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Liquid</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(currentNetWorth.liquid_assets)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Investments</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(currentNetWorth.investment_assets)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tangible</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(currentNetWorth.tangible_assets)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Liabilities</CardTitle>
            <p className="text-sm text-muted-foreground">Loans + credit cards</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(currentNetWorth.total_liabilities)}
            </p>
            {currentNetWorth.debt_to_income_ratio !== null &&
              currentNetWorth.debt_to_income_ratio !== undefined && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Debt-to-Income Ratio</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {(currentNetWorth.debt_to_income_ratio * 100).toFixed(1)}%
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
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
            <div className="grid gap-6 xl:grid-cols-2">
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
                            <TableCell className="text-right font-semibold text-emerald-600">
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
                            <TableCell className="text-right font-semibold text-red-600">
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

      </div>


      {allocation && allocation.allocations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Asset Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {allocation.allocations.map((item) => (
                <div key={item.account_type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {formatAccountType(item.account_type)}
                    </span>
                    <span className="text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.balance)}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(allocation.total_assets)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {trends && <NetWorthTrendChart trends={trends} />}
    </div>
  )
}
