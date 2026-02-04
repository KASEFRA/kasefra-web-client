'use client'

/**
 * Account Category Breakdown Component
 * Displays spending by category using a pie chart
 */

import { useEffect, useState } from 'react'
import { bankApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { subDays, format } from 'date-fns'
import type { AccountCategoryBreakdownItem } from '@/types'

interface AccountCategoryBreakdownProps {
  accountId: string
  days?: number
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#a4de6c',
]

export function AccountCategoryBreakdown({ accountId, days = 30 }: AccountCategoryBreakdownProps) {
  const [chartData, setChartData] = useState<Array<{
    name: string
    amount: number
    percentage: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [totalExpenses, setTotalExpenses] = useState(0)

  useEffect(() => {
    loadChartData()
  }, [accountId, days])

  const loadChartData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = subDays(endDate, days)

      const breakdown = await bankApi.getAccountCategoryBreakdown(accountId, {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        transaction_type: 'debit',
        limit: 10,
      })

      const data = breakdown.categories.map((item: AccountCategoryBreakdownItem) => {
        const name = item.category_icon
          ? `${item.category_icon} ${item.category_name}`
          : item.category_name
        return {
          name,
          amount: Number(item.amount),
          percentage: Number(item.percentage),
        }
      })

      setChartData(data)
      setTotalExpenses(Number(breakdown.total_amount))
    } catch (error) {
      console.error('Failed to load category breakdown:', error)
      setChartData([])
      setTotalExpenses(0)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-primary font-semibold">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (entry: any) => {
    return `${Number(entry.percentage).toFixed(1)}%`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Spending by category (Last {days} days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No expense data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add some expense transactions to see the breakdown
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Spending by category (Last {days} days) • Total: {formatCurrency(totalExpenses)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs">{entry.payload.name}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Category List */}
        <div className="mt-6 space-y-2">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(item.amount)}</span>
                <span className="text-muted-foreground">({Number(item.percentage).toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
