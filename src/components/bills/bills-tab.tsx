'use client'

/**
 * Bills Tab
 * Displays recurring bills inside the budgets page tabs.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RecurringBill } from '@/types'
import { budgetsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BillsList } from '@/components/bills/bills-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, Calendar, DollarSign, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {Button} from '@/components/ui/button'

export function BillsTab() {
  const router = useRouter()
  const [allBills, setAllBills] = useState<RecurringBill[]>([])
  const [upcomingBills, setUpcomingBills] = useState<RecurringBill[]>([])
  const [overdueBills, setOverdueBills] = useState<RecurringBill[]>([])
  const [upcomingTotal, setUpcomingTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [billToDelete, setBillToDelete] = useState<RecurringBill | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [allBillsRes, upcomingRes] = await Promise.all([
        budgetsApi.getAllBills(),
        budgetsApi.getUpcomingBills(30),
      ])

      setAllBills(allBillsRes.bills)
      setUpcomingBills(upcomingRes.bills)
      setUpcomingTotal(upcomingRes.total_amount)

      const overdue = allBillsRes.bills.filter((bill) => bill.is_overdue === true)
      setOverdueBills(overdue)
    } catch (error: any) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (bill: RecurringBill) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await budgetsApi.markBillPaid(bill.id, today)
      toast.success(`${bill.bill_name} marked as paid`)
      loadData()
    } catch (error: any) {
      console.error('Failed to mark bill as paid:', error)
      toast.error(error.response?.data?.detail || 'Failed to mark bill as paid')
    }
  }

  const handleEdit = (bill: RecurringBill) => {
    router.push(`/dashboard/budgets/bills/${bill.id}/edit`)
  }

  const handleDelete = (bill: RecurringBill) => {
    setBillToDelete(bill)
  }

  const confirmDelete = async () => {
    if (!billToDelete) return

    try {
      setIsDeleting(true)
      await budgetsApi.deleteBill(billToDelete.id)
      toast.success('Bill deleted successfully')
      setBillToDelete(null)
      loadData()
    } catch (error: any) {
      console.error('Failed to delete bill:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete bill')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">
            Track recurring payments and due dates
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/budgets/bills/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBills.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {allBills.filter((bill) => bill.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(upcomingTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingBills.length} bills due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueBills.length > 0 ? 'text-red-600' : ''}`}>
              {overdueBills.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueBills.length > 0 ? 'Requires attention' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Bills ({allBills.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingBills.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <BillsList
            bills={allBills}
            onMarkPaid={handleMarkPaid}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBills.length > 0 ? (
            <>
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      You have <strong>{upcomingBills.length} bills</strong> due in the next 30 days,
                      totaling <strong>{formatCurrency(upcomingTotal)}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
              <BillsList
                bills={upcomingBills}
                onMarkPaid={handleMarkPaid}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming bills</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You don't have any bills due in the next 30 days.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueBills.length > 0 ? (
            <>
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-900 dark:text-red-100">
                      You have <strong>{overdueBills.length} overdue bills</strong> that need attention.
                      Please review and mark them as paid.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <BillsList
                bills={overdueBills}
                onMarkPaid={handleMarkPaid}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You don't have any overdue bills. Keep up the good work!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!billToDelete} onOpenChange={(open) => !open && setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{billToDelete?.bill_name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Bill'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
