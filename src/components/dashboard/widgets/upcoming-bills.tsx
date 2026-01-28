'use client'

/**
 * Upcoming Bills Widget
 * Displays upcoming bills for the next 7 days
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { billsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { RecurringBill } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, Calendar, DollarSign, AlertTriangle } from 'lucide-react'

export function UpcomingBillsWidget() {
  const router = useRouter()
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load upcoming bills for next 7 days
      const response = await billsApi.getUpcoming(7)
      setBills(response.bills || [])
      setTotalAmount(response.total_amount || 0)
    } catch (error) {
      console.error('Failed to load upcoming bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const getDaysUntilDue = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBadgeVariant = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return 'destructive'
    if (daysUntilDue <= 2) return 'default'
    return 'outline'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
          <CardDescription>Bills due in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
          <CardDescription>Bills due in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No bills due soon</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add recurring bills to track payment due dates
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/budgets?tab=bills')}
            >
              Manage Bills
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>
              {bills.length} {bills.length === 1 ? 'bill' : 'bills'} due in the next 7 days
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/budgets?tab=bills')}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Amount Due */}
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Due</span>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-3">
          {bills.map((bill) => {
            const daysUntilDue = getDaysUntilDue(bill.next_due_date)
            const isDueToday = daysUntilDue === 0
            const isDueSoon = daysUntilDue <= 2

            return (
              <div
                key={bill.id}
                className={`flex items-center justify-between space-x-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                  isDueToday ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''
                }`}
                onClick={() => router.push('/dashboard/budgets?tab=bills')}
              >
                {/* Icon and Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className={`rounded-full p-2 ${
                      isDueToday
                        ? 'bg-red-100 dark:bg-red-900/20'
                        : isDueSoon
                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}
                  >
                    {isDueToday ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bill.bill_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.next_due_date)}
                      </p>
                      {bill.is_autopay && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            Auto-pay
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                  <Badge
                    variant={getBadgeVariant(daysUntilDue)}
                    className="text-xs mt-1"
                  >
                    {isDueToday
                      ? 'Due Today'
                      : daysUntilDue === 1
                      ? 'Due Tomorrow'
                      : `${daysUntilDue} days`}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* View All Bills */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/budgets?tab=bills')}
        >
          View All Upcoming Bills
        </Button>
      </CardContent>
    </Card>
  )
}
