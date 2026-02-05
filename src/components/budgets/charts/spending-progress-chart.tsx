'use client'

/**
 * Spending Progress Chart
 * Horizontal bar chart showing spent vs allocated per category
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { BudgetCategory } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SpendingProgressChartProps {
  categories: BudgetCategory[]
}

export function SpendingProgressChart({ categories }: SpendingProgressChartProps) {
  const hasAllocations = categories.some((cat) => cat.allocated_amount > 0)

  type ChartItem = {
    name: string
    spent: number
    allocated?: number
    remaining?: number
    percentage?: number
    isOverBudget?: boolean
    isNearLimit?: boolean
  }

  // Prepare data for bar chart
  const chartData: ChartItem[] = hasAllocations
    ? categories
        .filter((cat) => cat.allocated_amount > 0)
        .map((cat) => {
          const allocated = Number(cat.allocated_amount)
          const spent = Number(cat.spent_amount)

          return {
            name: cat.category_name || 'Unknown',
            allocated,
            spent,
            remaining: Math.max(0, Number(cat.remaining_amount ?? 0)),
            percentage: Number(cat.percentage_used ?? 0),
            isOverBudget: Boolean(cat.is_over_budget),
            isNearLimit: Boolean(cat.is_near_limit),
          }
        })
        .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
        .slice(0, 10) // Show top 10 categories
    : categories
        .filter((cat) => cat.spent_amount > 0)
        .map((cat) => ({
          name: cat.category_name || 'Unknown',
          spent: Number(cat.spent_amount),
        }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 10)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Progress</CardTitle>
          <CardDescription>Track spending vs budget by category</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">
            {hasAllocations ? 'No budget allocations yet' : 'No spending yet'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getBarColor = (item: ChartItem) => {
    if (!hasAllocations) return 'hsl(var(--primary))'
    if (item.isOverBudget) return 'hsl(var(--destructive))'
    if (item.isNearLimit) return 'hsl(var(--warning))'
    return 'hsl(var(--primary))'
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Spent:</span>
              <span className="font-medium">{formatCurrency(data.spent)}</span>
            </div>
            {hasAllocations && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(data.allocated)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span
                    className={`font-medium ${
                      data.isOverBudget ? 'text-destructive' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(data.remaining)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t">
                  <span className="text-muted-foreground">Used:</span>
                  <span
                    className={`font-medium ${
                      data.isOverBudget
                        ? 'text-destructive'
                        : data.isNearLimit
                        ? 'text-warning'
                        : 'text-green-600'
                    }`}
                  >
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Progress</CardTitle>
        <CardDescription>
          {hasAllocations
            ? 'Top categories by spending percentage'
            : 'Top categories by spending'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis type="category" dataKey="name" width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
            {hasAllocations && (
              <Bar dataKey="remaining" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        {hasAllocations && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span className="text-muted-foreground">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-warning" />
              <span className="text-muted-foreground">Near Limit (≥80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-destructive" />
              <span className="text-muted-foreground">Over Budget</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
