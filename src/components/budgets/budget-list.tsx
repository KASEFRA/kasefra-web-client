'use client'

/**
 * Budget List Component
 * Displays all budgets with quick stats and actions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Budget } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2,
  MoreVertical 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BudgetListProps {
  budgets: Budget[]
  onEdit?: (budget: Budget) => void
  onDelete?: (budget: Budget) => void
  onView?: (budget: Budget) => void
}

export function BudgetList({ budgets, onEdit, onDelete, onView }: BudgetListProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPeriodName = (period: string) => {
    const periodMap: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return periodMap[period] || period
  }

  const handleView = (budget: Budget) => {
    if (onView) {
      onView(budget)
    } else {
      router.push(`/dashboard/budgets/${budget.id}`)
    }
  }

  const handleEdit = (budget: Budget, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(budget)
    } else {
      router.push(`/dashboard/budgets/${budget.id}/edit`)
    }
  }

  const handleDelete = (budget: Budget, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(budget)
    }
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Create your first budget to start tracking your spending and stay on top of your finances.
          </p>
          <Button onClick={() => router.push('/dashboard/budgets/new')}>
            Create Your First Budget
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <Card 
          key={budget.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleView(budget)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{budget.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(budget.start_date)}</span>
                  {budget.end_date && (
                    <>
                      <span>-</span>
                      <span>{formatDate(budget.end_date)}</span>
                    </>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleView(budget)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleEdit(budget, e)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Budget
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={(e) => handleDelete(budget, e)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Budget
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={budget.is_active ? 'default' : 'secondary'}>
                {budget.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{getPeriodName(budget.period)}</Badge>
            </div>

            {/* Features */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {budget.rollover_enabled && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Rollover enabled
                </span>
              )}
            </div>

            {/* Notes Preview */}
            {budget.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {budget.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
