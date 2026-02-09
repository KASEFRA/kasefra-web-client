'use client'

/**
 * Settings Page
 * Application settings (profile management moved to profile page)
 */

import { useEffect, useState } from 'react'
import { Lock, Bell, Globe, Shield, Wallet, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/providers/auth-provider'
import { authAPI } from '@/lib/api/auth'
import { accountsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/currency'
import type { Account } from '@/types'
import { AccountType } from '@/types'
import { toast } from 'sonner'

const ALLOWED_DEFAULT_TYPES: AccountType[] = [
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.CASH,
  AccountType.CREDIT_CARD,
]

const accountTypeLabel: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  cash: 'Cash',
  credit_card: 'Credit Card',
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [settingDefault, setSettingDefault] = useState(false)
  const [clearingDefault, setClearingDefault] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const res = await accountsApi.getAll()
      setAccounts(res.accounts || [])
    } catch {
      toast.error('Failed to load accounts')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const eligibleAccounts = accounts.filter(
    (a) => a.is_active && ALLOWED_DEFAULT_TYPES.includes(a.account_type as AccountType)
  )

  const currentDefault = accounts.find((a) => a.id === user?.default_account_id)

  const handleSetDefault = async (accountId: string) => {
    if (accountId === 'none') return
    try {
      setSettingDefault(true)
      await authAPI.setDefaultAccount(accountId)
      await refreshUser(true)
      toast.success('Default payment account updated')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Failed to set default account')
    } finally {
      setSettingDefault(false)
    }
  }

  const handleClearDefault = async () => {
    try {
      setClearingDefault(true)
      await authAPI.clearDefaultAccount()
      await refreshUser(true)
      toast.success('Default payment account cleared')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Failed to clear default account')
    } finally {
      setClearingDefault(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and app preferences
        </p>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button>Change Password</Button>
        </CardContent>
      </Card>

      {/* Default Payment Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Default Payment Account</CardTitle>
          </div>
          <CardDescription>
            Choose a default account for bill payments and goal contributions.
            This will be used when no specific account is selected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts...
            </div>
          ) : (
            <>
              {currentDefault && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{currentDefault.account_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {accountTypeLabel[currentDefault.account_type] || currentDefault.account_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(currentDefault.current_balance)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearDefault}
                    disabled={clearingDefault}
                    title="Remove default account"
                  >
                    {clearingDefault ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {eligibleAccounts.length > 0 ? (
                <div className="space-y-2">
                  <Label>{currentDefault ? 'Change default account' : 'Select default account'}</Label>
                  <Select
                    onValueChange={handleSetDefault}
                    disabled={settingDefault}
                    value=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        settingDefault
                          ? 'Updating...'
                          : currentDefault
                            ? 'Change to a different account...'
                            : 'Select an account...'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts
                        .filter((a) => a.id !== user?.default_account_id)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} ({accountTypeLabel[account.account_type] || account.account_type}) — {formatCurrency(account.current_balance)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No eligible accounts found. Create a checking, savings, cash, or credit card account first.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive budget alerts and transaction updates
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Enabled
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Budget Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when approaching budget limits
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Enabled
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Goal Updates</p>
              <p className="text-sm text-muted-foreground">
                Track progress on your financial goals
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input
              id="currency"
              defaultValue="AED"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Currently only AED is supported
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              defaultValue="English"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              More languages coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
