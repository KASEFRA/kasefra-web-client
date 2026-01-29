'use client'

/**
 * Net Worth Trend Chart
 * Displays net worth changes over time using an area chart.
 */

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { NetWorthTrend } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface NetWorthTrendChartProps {
  trends: NetWorthTrend
}

export function NetWorthTrendChart({ trends }: NetWorthTrendChartProps) {
  const chartData = useMemo(() => {
    return [...trends.trend_data]
      .map((item) => ({
        ...item,
        timestamp: new Date(item.date).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [trends.trend_data])

  const currentPoint = chartData[chartData.length - 1]
  const previousPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null
  const currentValue = currentPoint?.net_worth ?? 0
  const previousValue = previousPoint?.net_worth ?? currentValue
  const change = currentValue - previousValue
  const changePct = previousValue !== 0 ? (change / previousValue) * 100 : 0
  const isPositive = change >= 0

  const dateLabel = (value: string) => {
    const date = new Date(value)
    return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium">
            {new Date(data.date).toLocaleDateString('en-AE', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(Number(data.net_worth))}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Net Worth Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Net worth change over the last 30 days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(currentValue)}
              </p>
            </div>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="gap-1">
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {formatCurrency(Math.abs(change))} ({Math.abs(changePct).toFixed(1)}%)
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No trend data yet. Net worth snapshots will appear as your balances change.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={dateLabel}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(Number(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="net_worth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#netWorthGradient)"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
