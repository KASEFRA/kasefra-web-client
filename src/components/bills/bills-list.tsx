'use client'

/**
 * Bills List Component
 * Display recurring bills with status and actions
 */

import { formatCurrency } from '@/lib/currency'
import type { RecurringBill } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Trash2,
  Clock,
  Wallet
} from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

interface BillsListProps {
  bills: RecurringBill[]
  onMarkPaid?: (bill: RecurringBill) => void
  onEdit?: (bill: RecurringBill) => void
  onDelete?: (bill: RecurringBill) => void
}

export function BillsList({ bills, onMarkPaid, onEdit, onDelete }: BillsListProps) {
  const { user } = useAuth()

  const getFrequencyName = (frequency: string) => {
    const frequencyMap: Record<string, string> = {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return frequencyMap[frequency] || frequency
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getBillStatusColor = (bill: RecurringBill) => {
    if (bill.is_overdue) return 'destructive'
    if (bill.days_until_due !== null && bill.days_until_due <= 3) return 'default'
    return 'secondary'
  }

  const getBillStatusText = (bill: RecurringBill) => {
    if (bill.is_overdue) return 'Overdue'
    if (bill.days_until_due !== null && bill.days_until_due === 0) return 'Due Today'
    if (bill.days_until_due !== null && bill.days_until_due === 1) return 'Due Tomorrow'
    if (bill.days_until_due !== null && bill.days_until_due <= 7) return `Due in ${bill.days_until_due} days`
    return 'Upcoming'
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bills found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            You haven't added any recurring bills yet. Add your bills to track payments and get reminders.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <Card 
          key={bill.id}
          className={`transition-all ${bill.is_overdue ? 'border-red-200 dark:border-red-800' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              {/* Bill Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{bill.bill_name}</h3>
                  <Badge variant={getBillStatusColor(bill)}>
                    {getBillStatusText(bill)}
                  </Badge>
                  {bill.is_autopay && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Auto-pay
                    </Badge>
                  )}
                  {!bill.account_id && user?.default_account_id && (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                      <Wallet className="h-3 w-3" />
                      Default account
                    </Badge>
                  )}
                  {!bill.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">{formatCurrency(bill.amount)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{getFrequencyName(bill.frequency)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(bill.next_due_date)}</span>
                  </div>

                  {bill.category_name && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{bill.category_name}</span>
                    </div>
                  )}
                </div>

                {bill.merchant_name && (
                  <p className="text-sm text-muted-foreground">
                    Merchant: {bill.merchant_name}
                  </p>
                )}

                {bill.last_paid_date && (
                  <p className="text-xs text-muted-foreground">
                    Last paid: {formatDate(bill.last_paid_date)}
                  </p>
                )}

                {bill.reminder_days_before > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Reminder: {bill.reminder_days_before} day{bill.reminder_days_before > 1 ? 's' : ''} before due
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                {onMarkPaid && bill.is_active && (
                  <Button
                    size="sm"
                    variant={bill.is_overdue ? 'default' : 'outline'}
                    onClick={() => onMarkPaid(bill)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(bill)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(bill)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
