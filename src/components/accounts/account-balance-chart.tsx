'use client'

/**
 * Account Balance Chart Component
 * Displays balance trend over time using a line chart
 */

import { useEffect, useState } from 'react'
import { bankApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { subDays, format } from 'date-fns'

interface AccountBalanceChartProps {
  accountId: string
  days?: number
}

export function AccountBalanceChart({ accountId, days = 30 }: AccountBalanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [accountId, days])

  const loadChartData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = subDays(endDate, days)

      // Fetch transactions for the period
      const response = await bankApi.getAll({
        account_id: accountId,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        limit: 1000,
      })

      // Calculate running balance
      const transactions = response.transactions || []
      transactions.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())

      let runningBalance = 0
      const balanceByDate = new Map<string, number>()

      // Initialize with starting balance (sum of all transactions before start date)
      // For simplicity, we'll start from 0 and calculate forward
      transactions.forEach(txn => {
        const dateKey = format(new Date(txn.transaction_date), 'MMM dd')
        
        if (txn.transaction_type === 'credit') {
          runningBalance += txn.amount
        } else {
          runningBalance -= txn.amount
        }

        balanceByDate.set(dateKey, runningBalance)
      })

      // Convert to chart data format
      const data = Array.from(balanceByDate.entries()).map(([date, balance]) => ({
        date,
        balance: Math.round(balance * 100) / 100,
      }))

      setChartData(data)
    } catch (error) {
      console.error('Failed to load balance chart data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-primary font-semibold">
            Balance: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Trend</CardTitle>
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
          <CardTitle>Balance Trend</CardTitle>
          <CardDescription>Last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No transaction data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add some transactions to see the balance trend
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Trend</CardTitle>
        <CardDescription>Last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="Balance"
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
