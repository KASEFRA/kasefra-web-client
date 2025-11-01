'use client'

/**
 * Recurring Bills Page
 * Manage recurring bills and upcoming payments
 */

import { useEffect, useState } from 'react'
import { budgetsApi } from '@/lib/api'
import type { RecurringBill, UpcomingBillsResponse } from '@/types'
import { Plus, Edit, Trash2, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BillsPage() {
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBillsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBills()
    loadUpcomingBills()
  }, [])

  const loadBills = async () => {
    try {
      const response = await budgetsApi.getAllBills()
      setBills(response.bills)
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingBills = async () => {
    try {
      const upcoming = await budgetsApi.getUpcomingBills(30)
      setUpcomingBills(upcoming)
    } catch (error) {
      console.error('Failed to load upcoming bills:', error)
    }
  }

  const handleDelete = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return
    }

    try {
      await budgetsApi.deleteBill(billId)
      await loadBills()
      await loadUpcomingBills()
    } catch (error) {
      console.error('Failed to delete bill:', error)
      alert('Failed to delete bill')
    }
  }

  const handleMarkPaid = async (billId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await budgetsApi.markBillPaid(billId, today)
      await loadBills()
      await loadUpcomingBills()
    } catch (error) {
      console.error('Failed to mark bill as paid:', error)
      alert('Failed to mark bill as paid')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1).replace('_', ' ')
  }

  const getDaysUntilDueColor = (daysUntil: number | null) => {
    if (daysUntil === null) return 'text-muted-foreground'
    if (daysUntil < 0) return 'text-red-600'
    if (daysUntil <= 3) return 'text-orange-600'
    if (daysUntil <= 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDaysUntilDueText = (daysUntil: number | null, isOverdue: boolean | null) => {
    if (daysUntil === null) return ''
    if (isOverdue) return 'Overdue'
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return 'Due tomorrow'
    return `Due in ${daysUntil} days`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recurring Bills</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your recurring payments and bills
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/bills/new'}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {/* Upcoming Bills Summary */}
      {upcomingBills && upcomingBills.count > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">
                Upcoming Bills (Next 30 Days)
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                {upcomingBills.count} {upcomingBills.count === 1 ? 'bill' : 'bills'} due •{' '}
                Total: {formatCurrency(upcomingBills.total_amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No recurring bills yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first recurring bill to track upcoming payments
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.href = '/dashboard/bills/new'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`rounded-lg border bg-card p-6 ${
                bill.is_overdue
                  ? 'border-red-200 bg-red-50'
                  : bill.days_until_due !== null && bill.days_until_due <= 3
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {bill.bill_name}
                        </h3>
                        {bill.is_autopay && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            Auto-pay
                          </span>
                        )}
                        {!bill.is_active && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {bill.merchant_name || 'No merchant'}
                        {bill.category_name && ` • ${bill.category_name}`}
                      </p>
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {formatCurrency(bill.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatFrequency(bill.frequency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Due Date</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {new Date(bill.next_due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className={`mt-1 font-semibold ${getDaysUntilDueColor(bill.days_until_due)}`}>
                        {getDaysUntilDueText(bill.days_until_due, bill.is_overdue)}
                      </p>
                    </div>
                  </div>

                  {bill.last_paid_date && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Last paid: {new Date(bill.last_paid_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkPaid(bill.id)}
                  >
                    Mark Paid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/dashboard/bills/${bill.id}/edit`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(bill.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
