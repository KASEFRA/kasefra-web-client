'use client'

/**
 * Bills Integration Card
 * Shows upcoming recurring bills and their impact on budget
 */

import { useEffect, useState } from 'react'
import { budgetsApi } from '@/lib/api'
import type { UpcomingBillsResponse, BudgetProgress } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import { Calendar, ExternalLink, Loader2, Receipt } from 'lucide-react'
import Link from 'next/link'

interface BillsIntegrationCardProps {
  budgetProgress: BudgetProgress
}

export function BillsIntegrationCard({ budgetProgress }: BillsIntegrationCardProps) {
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBillsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingBills()
  }, [])

  const loadUpcomingBills = async () => {
    try {
      setLoading(true)
      const bills = await budgetsApi.getUpcomingBills(30)
      setUpcomingBills(bills)
    } catch (err) {
      console.error('Failed to load upcoming bills:', err)
    } finally {
      setLoading(false)
    }
  }

  // Match bills with budget categories
  const budgetCategoryIds = new Set(
    budgetProgress.categories.map((cat) => cat.category_id)
  )

  const billsInBudget = upcomingBills?.bills.filter((bill) =>
    budgetCategoryIds.has(bill.category_id)
  ) || []

  const totalBillsAmount = billsInBudget.reduce(
    (sum, bill) => sum + Number(bill.amount),
    0
  )

  const totalRemaining = Number(budgetProgress.total_remaining)
  const projectedRemaining = totalRemaining - totalBillsAmount

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!upcomingBills || billsInBudget.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Bills</CardTitle>
              <CardDescription>Recurring bills in this budget period</CardDescription>
            </div>
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No upcoming bills match your budget categories</p>
            <Link href="/dashboard/bills">
              <Button variant="link" className="mt-2">
                Manage Recurring Bills <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
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
              {billsInBudget.length} bills due in the next 30 days
            </CardDescription>
          </div>
          <Receipt className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Total Bills</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBillsAmount)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Current Remaining</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">After Bills</p>
            <p
              className={`text-2xl font-bold ${
                projectedRemaining < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(projectedRemaining)}
            </p>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Bills in Budget Categories</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {billsInBudget.slice(0, 10).map((bill) => {
              const daysUntilDue = bill.days_until_due || 0
              const isOverdue = bill.is_overdue

              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{bill.bill_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.category_name || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(bill.amount))}</p>
                    <p
                      className={`text-xs ${
                        isOverdue
                          ? 'text-destructive'
                          : daysUntilDue <= 3
                          ? 'text-warning'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isOverdue
                        ? 'Overdue'
                        : daysUntilDue === 0
                        ? 'Due today'
                        : `${daysUntilDue}d`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {billsInBudget.length > 10 && (
            <p className="text-xs text-center text-muted-foreground">
              +{billsInBudget.length - 10} more bills
            </p>
          )}
        </div>

        {/* Warning if projected remaining is negative */}
        {projectedRemaining < 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              ⚠️ After bills, you'll be {formatCurrency(Math.abs(projectedRemaining))} over budget
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consider adjusting spending or increasing your budget allocation
            </p>
          </div>
        )}

        {/* View All Link */}
        <Link href="/dashboard/bills">
          <Button variant="outline" className="w-full">
            Manage All Bills <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
