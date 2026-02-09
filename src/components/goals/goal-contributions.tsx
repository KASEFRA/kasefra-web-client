'use client'

/**
 * Goal Contributions Component
 * Add and manage manual contributions for a goal.
 */

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { goalsApi, accountsApi } from '@/lib/api'
import type { Account, GoalContribution } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'

interface GoalContributionsProps {
  goalId: string
  onContributionChange?: () => void
}

export function GoalContributions({ goalId, onContributionChange }: GoalContributionsProps) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [contributions, setContributions] = useState<GoalContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [contributionToDelete, setContributionToDelete] = useState<GoalContribution | null>(null)

  const [amount, setAmount] = useState('')
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [goalId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [accountsRes, contributionsRes] = await Promise.all([
        accountsApi.getAll(),
        goalsApi.listContributions(goalId),
      ])
      setAccounts(accountsRes.accounts)
      setContributions(contributionsRes.contributions)

      // Pre-fill from user's default payment account
      if (user?.default_account_id && accountsRes.accounts.some((a: Account) => a.id === user.default_account_id)) {
        setAccountId(user.default_account_id)
      }
    } catch (error) {
      console.error('Failed to load contributions:', error)
      toast.error('Failed to load contributions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const accountMap = useMemo(() => {
    return new Map(accounts.map((account) => [account.id, account.account_name]))
  }, [accounts])

  const totalContributions = useMemo(() => {
    return contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [contributions])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid contribution amount.')
      return
    }

    try {
      setSubmitting(true)
      await goalsApi.addContribution(goalId, {
        amount: numericAmount,
        contribution_date: contributionDate,
        account_id: accountId || null,
        notes: notes || null,
      })

      setAmount('')
      setNotes('')
      setAccountId('')
      await loadData()
      onContributionChange?.()
      toast.success('Contribution added successfully.')
    } catch (error: any) {
      console.error('Failed to add contribution:', error)
      toast.error(error.response?.data?.detail || 'Failed to add contribution.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!contributionToDelete) return

    try {
      setDeleting(true)
      await goalsApi.deleteContribution(goalId, contributionToDelete.id)
      setContributionToDelete(null)
      await loadData()
      onContributionChange?.()
      toast.success('Contribution deleted successfully.')
    } catch (error: any) {
      console.error('Failed to delete contribution:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete contribution.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Goal Contributions</CardTitle>
            <CardDescription>
              Add manual contributions from any account. This does not change account balances.
            </CardDescription>
          </div>
          <Badge variant="outline">
            Total: {formatCurrency(totalContributions)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-1 space-y-2">
            <Label htmlFor="contribution-amount">Amount (AED)</Label>
            <Input
              id="contribution-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="lg:col-span-1 space-y-2">
            <Label htmlFor="contribution-date">Date</Label>
            <Input
              id="contribution-date"
              type="date"
              value={contributionDate}
              onChange={(event) => setContributionDate(event.target.value)}
            />
          </div>
          <div className="lg:col-span-1 space-y-2">
            <Label htmlFor="contribution-account">Account (optional)</Label>
            <Select
              value={accountId || 'none'}
              onValueChange={(value) => setAccountId(value === 'none' ? '' : value)}
            >
              <SelectTrigger id="contribution-account">
                <SelectValue placeholder="No account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="contribution-notes">Notes</Label>
            <Textarea
              id="contribution-notes"
              rows={1}
              placeholder="Optional note"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="lg:col-span-5 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contribution
                </>
              )}
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : contributions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
            No contributions yet. Add your first manual contribution above.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>
                      {format(new Date(contribution.contribution_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(contribution.amount))}
                    </TableCell>
                    <TableCell>
                      {contribution.account_id
                        ? accountMap.get(contribution.account_id) || 'Account'
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contribution.notes || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setContributionToDelete(contribution)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!contributionToDelete}
        onOpenChange={(open) => !open && setContributionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contribution? This will reduce the goal's
              current amount.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
