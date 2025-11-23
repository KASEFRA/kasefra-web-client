'use client'

/**
 * Account Type Dropdown Component
 * Provides a unified dropdown for creating all account types
 */

import { useState } from 'react'
import { Plus, Landmark, PiggyBank, CreditCard, Wallet, FileText, TrendingUp, Bitcoin, Home, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { CreateCheckingAccountDialog } from './create-checking-account-dialog'
import { CreateSavingsAccountDialog } from './create-savings-account-dialog'
import { CreateCreditCardDialog } from './create-credit-card-dialog'
import { CreateCashAccountDialog } from './create-cash-account-dialog'
import { CreateLoanDialog } from './create-loan-dialog'
import { CreateInvestmentDialog } from './create-investment-dialog'
import { CreateCryptoDialog } from './create-crypto-dialog'
import { CreateRealEstateDialog } from './create-real-estate-dialog'
import { CreateOtherAssetDialog } from './create-other-asset-dialog'

type AccountTypeDialog =
  | 'checking'
  | 'savings'
  | 'credit-card'
  | 'cash'
  | 'loan'
  | 'investment'
  | 'crypto'
  | 'real-estate'
  | 'other-asset'
  | null

export function AccountTypeDropdown() {
  const [openDialog, setOpenDialog] = useState<AccountTypeDialog>(null)

  const accountTypes = [
    {
      id: 'checking' as const,
      label: 'Checking Account',
      icon: Landmark,
      description: 'Bank checking account',
    },
    {
      id: 'savings' as const,
      label: 'Savings Account',
      icon: PiggyBank,
      description: 'Savings or high-yield account',
    },
    {
      id: 'credit-card' as const,
      label: 'Credit Card',
      icon: CreditCard,
      description: 'Credit card account',
    },
    {
      id: 'cash' as const,
      label: 'Cash',
      icon: Wallet,
      description: 'Physical cash',
    },
    {
      id: 'loan' as const,
      label: 'Loan',
      icon: FileText,
      description: 'Loan or mortgage',
    },
    {
      id: 'investment' as const,
      label: 'Investment',
      icon: TrendingUp,
      description: 'Investment or retirement account',
    },
    {
      id: 'crypto' as const,
      label: 'Crypto',
      icon: Bitcoin,
      description: 'Cryptocurrency account',
    },
    {
      id: 'real-estate' as const,
      label: 'Real Estate',
      icon: Home,
      description: 'Property or real estate',
    },
    {
      id: 'other-asset' as const,
      label: 'Other Asset',
      icon: Package,
      description: 'Vehicle, collectible, or other asset',
    },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button">
            <Plus className="mr-2 size-4" />
            Add Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Select Account Type</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Liquid Accounts */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">Liquid Accounts</DropdownMenuLabel>
          {accountTypes.slice(0, 4).map((type) => {
            const Icon = type.icon
            return (
              <DropdownMenuItem
                key={type.id}
                onClick={() => setOpenDialog(type.id)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 size-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Liabilities */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">Liabilities</DropdownMenuLabel>
          {accountTypes.slice(4, 5).map((type) => {
            const Icon = type.icon
            return (
              <DropdownMenuItem
                key={type.id}
                onClick={() => setOpenDialog(type.id)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 size-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Investments & Assets */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">Investments & Assets</DropdownMenuLabel>
          {accountTypes.slice(5).map((type) => {
            const Icon = type.icon
            return (
              <DropdownMenuItem
                key={type.id}
                onClick={() => setOpenDialog(type.id)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 size-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* All Dialog Components */}
      <CreateCheckingAccountDialog
        open={openDialog === 'checking'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateSavingsAccountDialog
        open={openDialog === 'savings'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateCreditCardDialog
        open={openDialog === 'credit-card'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateCashAccountDialog
        open={openDialog === 'cash'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateLoanDialog
        open={openDialog === 'loan'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateInvestmentDialog
        open={openDialog === 'investment'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateCryptoDialog
        open={openDialog === 'crypto'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateRealEstateDialog
        open={openDialog === 'real-estate'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
      <CreateOtherAssetDialog
        open={openDialog === 'other-asset'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />
    </>
  )
}
