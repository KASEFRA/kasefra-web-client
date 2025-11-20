'use client'

/**
 * Account Overview Component
 * Displays account balance, details, and type-specific information
 */

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  Edit,
  Archive,
  Percent,
  DollarSign,
  Shield,
  Banknote
} from 'lucide-react'
import type { Account } from '@/types'
import { checkingApi, type CheckingDetail } from '@/lib/api/checking'

interface AccountOverviewProps {
  account: Account
  onEdit?: () => void
  onArchive?: () => void
}

export function AccountOverview({ account, onEdit, onArchive }: AccountOverviewProps) {
  const [checkingDetails, setCheckingDetails] = useState<CheckingDetail | null>(null)
  const [loadingCheckingDetails, setLoadingCheckingDetails] = useState(false)

  // Fetch checking details if this is a checking account
  useEffect(() => {
    const fetchCheckingDetails = async () => {
      if (account.account_type.toLowerCase() === 'checking') {
        try {
          setLoadingCheckingDetails(true)
          const details = await checkingApi.getDetails(account.id)
          setCheckingDetails(details)
        } catch (error) {
          console.error('Failed to load checking details:', error)
          // Details might not exist yet, that's okay
        } finally {
          setLoadingCheckingDetails(false)
        }
      }
    }

    fetchCheckingDetails()
  }, [account.id, account.account_type])

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'savings':
        return <Building2 className="h-5 w-5" />
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />
      case 'investment':
      case 'crypto':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <DollarSign className="h-5 w-5" />
    }
  }

  const getAccountTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      credit_card: 'Credit Card',
      investment: 'Investment',
      crypto: 'Cryptocurrency',
      cash: 'Cash',
      loan: 'Loan',
      asset: 'Asset',
    }
    return typeMap[type.toLowerCase()] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get account type description
  const getAccountDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      checking: 'Day-to-day transactions and bill payments',
      savings: 'Interest-earning savings account',
      credit_card: 'Credit line for purchases',
      investment: 'Investment portfolio',
      crypto: 'Cryptocurrency holdings',
      cash: 'Physical cash holdings',
      loan: 'Borrowed funds',
      asset: 'Physical or digital assets',
    }
    return descriptions[type.toLowerCase()] || 'Financial account'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getAccountTypeIcon(account.account_type)}
              <CardTitle className="text-2xl">{account.account_name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getAccountTypeName(account.account_type)}</Badge>
              <Badge variant={account.is_active ? 'default' : 'destructive'}>
                {account.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onArchive && (
              <Button variant="outline" size="icon" onClick={onArchive}>
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(account.current_balance || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{account.currency}</p>
        </div>

        {/* Account Description */}
        <div className="text-sm text-muted-foreground">
          {getAccountDescription(account.account_type)}
        </div>

        {/* Basic Details */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Institution
            </p>
            <p className="font-medium">{account.institution_name || 'Not specified'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created
            </p>
            <p className="font-medium">{formatDate(account.created_at)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">{formatDate(account.updated_at)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Account ID</p>
            <p className="font-mono text-xs">{account.id.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Checking Account Specific Details */}
        {account.account_type.toLowerCase() === 'checking' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Checking Account Details</h3>
            {loadingCheckingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : checkingDetails ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {checkingDetails.overdraft_limit !== null && checkingDetails.overdraft_limit !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Overdraft Limit
                    </p>
                    <p className="font-medium text-lg">{formatCurrency(checkingDetails.overdraft_limit)}</p>
                  </div>
                )}
                {checkingDetails.monthly_fee !== null && checkingDetails.monthly_fee !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      Monthly Fee
                    </p>
                    <p className="font-medium text-lg">{formatCurrency(checkingDetails.monthly_fee)}</p>
                  </div>
                )}
                {checkingDetails.account_number_last_four && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      Account Number
                    </p>
                    <p className="font-mono text-lg">••••{checkingDetails.account_number_last_four}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No checking account details available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
