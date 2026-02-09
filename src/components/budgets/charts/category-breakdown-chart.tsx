'use client'

/**
 * Category Breakdown Chart
 * Pie/Donut chart showing allocated amounts per category
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { BudgetCategory } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CategoryBreakdownChartProps {
  categories: BudgetCategory[]
}

// Color palette for chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#a28bf4',
]

export function CategoryBreakdownChart({ categories }: CategoryBreakdownChartProps) {
  const hasAllocations = categories.some((cat) => cat.allocated_amount > 0)
  const hasSpending = categories.some((cat) => cat.spent_amount > 0)

  // Prepare data for pie chart
  const chartData = hasAllocations
    ? categories
        .filter((cat) => cat.allocated_amount > 0)
        .map((cat) => ({
          name: cat.category_name || 'Unknown',
          value: Number(cat.allocated_amount),
          allocated: Number(cat.allocated_amount),
          spent: Number(cat.spent_amount),
          share: Number(cat.allocated_share) || 0,
        }))
        .sort((a, b) => b.value - a.value) // Sort by allocated amount descending
    : categories
        .filter((cat) => cat.spent_amount > 0)
        .map((cat) => ({
          name: cat.category_name || 'Unknown',
          value: Number(cat.spent_amount),
          allocated: Number(cat.allocated_amount),
          spent: Number(cat.spent_amount),
          share: Number(cat.spent_share) || 0,
        }))
        .sort((a, b) => b.value - a.value) // Sort by spent amount descending

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            {hasSpending ? 'Spending by category' : 'Budget allocation by category'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">
            {hasSpending ? 'No spending yet' : 'No budget allocations yet'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = Number(data.share || 0).toFixed(1)

      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <div className="space-y-1 text-xs">
            {hasAllocations ? (
              <>
                <p className="text-muted-foreground">
                  Allocated:{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(data.allocated)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Spent:{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(data.spent)}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Spent:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(data.spent)}
                </span>
              </p>
            )}
            <p className="text-muted-foreground">
              Share: <span className="font-medium text-foreground">{percentage}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          {hasAllocations ? 'Budget allocation by category' : 'Spending by category'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with totals */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.slice(0, 6).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="ml-auto font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
          {chartData.length > 6 && (
            <div className="col-span-2 text-center text-muted-foreground text-xs mt-2">
              +{chartData.length - 6} more categories
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
