'use client'

/**
 * Transaction Flow Report
 * Visualizes income/expense branches in a Sankey-style flow (per transaction).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { ArrowRightLeft, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react'

import { accountsApi, bankApi } from '@/lib/api'
import type { Account, BankTransaction } from '@/types'
import { TransactionType } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { TransactionSummary } from '@/components/dashboard/transaction-summary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'

const today = new Date()
const defaultRange: DateRange = {
  from: startOfMonth(subMonths(today, 1)),
  to: today,
}

const PAGE_SIZE = 1000
const MAX_PAGES = 10

const VIEW_WIDTH = 1000
const NODE_WIDTH = 220
const CENTER_WIDTH = 180
const SIDE_PADDING = 40
const BASE_HEIGHT = 420

interface FlowNode {
  id: string
  label: string
  meta: string
  amount: number
  color: string
  kind: 'income' | 'expense'
}

interface PositionedNode extends FlowNode {
  x: number
  y: number
}

const normalizeAmount = (amount: number | string) => {
  const numeric = typeof amount === 'string' ? Number(amount) : amount
  return Number.isFinite(numeric) ? numeric : 0
}

const toPercent = (value: number, max: number) => `${(value / max) * 100}%`

const parseTransactionDate = (dateValue: string) =>
  new Date(`${dateValue}T00:00:00`)

const formatTransactionDate = (dateValue: string) =>
  format(parseTransactionDate(dateValue), 'MMM dd, yyyy')

const distributeBetween = (count: number, start: number, end: number) => {
  if (count <= 0) return []
  if (count === 1) return [(start + end) / 2]
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + index * step)
}

const sampleNodes = (nodes: FlowNode[], maxNodes: number) => {
  if (nodes.length <= maxNodes || maxNodes <= 0) {
    return nodes
  }
  if (maxNodes === 1) {
    return [nodes[0]]
  }

  const sampled: FlowNode[] = []
  const step = (nodes.length - 1) / (maxNodes - 1)
  let lastIndex = -1

  for (let i = 0; i < maxNodes; i += 1) {
    const index = Math.round(i * step)
    if (index !== lastIndex) {
      sampled.push(nodes[index])
      lastIndex = index
    }
  }

  if (sampled[sampled.length - 1]?.id !== nodes[nodes.length - 1]?.id) {
    sampled[sampled.length - 1] = nodes[nodes.length - 1]
  }

  return sampled
}

const buildTransactionNodes = (
  transactions: BankTransaction[],
  accountMap: Map<string, string>,
  kind: 'income' | 'expense'
): FlowNode[] => {
  const targetType = kind === 'income' ? TransactionType.CREDIT : TransactionType.DEBIT

  const sorted = [...transactions]
    .filter((transaction) => transaction.transaction_type === targetType)
    .sort((a, b) => {
      const dateDiff =
        parseTransactionDate(a.transaction_date).getTime() -
        parseTransactionDate(b.transaction_date).getTime()
      if (dateDiff !== 0) return dateDiff
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  return sorted.map((transaction) => {
    const accountName = accountMap.get(transaction.account_id) ?? 'Account'
    return {
      id: transaction.id,
      label: transaction.description,
      meta: `${accountName} • ${formatTransactionDate(transaction.transaction_date)}`,
      amount: normalizeAmount(transaction.amount),
      color: kind === 'income' ? '#34d399' : '#fb7185',
      kind,
    }
  })
}

export function TransactionFlowReport() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataCapped, setDataCapped] = useState(false)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange)
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [detailLevel, setDetailLevel] = useState<number[]>([8])

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await accountsApi.getAll()
        setAccounts(response.accounts.filter((account) => account.is_active))
      } catch (err) {
        console.error('Failed to load accounts for reports:', err)
      }
    }

    loadAccounts()
  }, [])

  const loadTransactions = useCallback(async () => {
    if (!dateRange?.from) {
      setTransactions([])
      return
    }

    setLoading(true)
    setError(null)
    setDataCapped(false)

    const startDate = format(dateRange.from, 'yyyy-MM-dd')
    const endDate = format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd')

    try {
      const collected: BankTransaction[] = []
      let skip = 0
      let page = 0
      let totalCount = 0

      do {
        const response = await bankApi.getAll({
          start_date: startDate,
          end_date: endDate,
          account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
          skip,
          limit: PAGE_SIZE,
        })

        totalCount = response.total_count ?? response.transactions.length
        collected.push(...response.transactions)
        skip += PAGE_SIZE
        page += 1
      } while (collected.length < totalCount && page < MAX_PAGES)

      if (collected.length < totalCount) {
        setDataCapped(true)
      }

      setTransactions(collected)
    } catch (err: any) {
      console.error('Failed to load transactions for flow report:', err)
      setError('Unable to load transactions for the selected range.')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedAccount])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const accountMap = useMemo(() => {
    return new Map(accounts.map((account) => [account.id, account.account_name]))
  }, [accounts])

  const maxNodesPerSide = Math.max(4, detailLevel[0] ?? 8)

  const flowData = useMemo(() => {
    const totalIncome = transactions.reduce((sum, transaction) => {
      if (transaction.transaction_type !== TransactionType.CREDIT) return sum
      return sum + normalizeAmount(transaction.amount)
    }, 0)
    const totalExpenses = transactions.reduce((sum, transaction) => {
      if (transaction.transaction_type !== TransactionType.DEBIT) return sum
      return sum + normalizeAmount(transaction.amount)
    }, 0)

    const allIncomeNodes = buildTransactionNodes(transactions, accountMap, 'income')
    const allExpenseNodes = buildTransactionNodes(transactions, accountMap, 'expense')

    const incomeNodes = sampleNodes(allIncomeNodes, maxNodesPerSide)
    const expenseNodes = sampleNodes(allExpenseNodes, maxNodesPerSide)

    return {
      incomeNodes,
      expenseNodes,
      totalIncome,
      totalExpenses,
      incomeCount: allIncomeNodes.length,
      expenseCount: allExpenseNodes.length,
      overflow:
        allIncomeNodes.length > incomeNodes.length ||
        allExpenseNodes.length > expenseNodes.length,
    }
  }, [transactions, accountMap, maxNodesPerSide])

  const summary = useMemo(() => {
    if (transactions.length === 0) return null

    return transactions.reduce(
      (acc, txn) => {
        const amount = normalizeAmount(txn.amount)
        if (txn.transaction_type === TransactionType.CREDIT) {
          acc.total_income += amount
          acc.income_count += 1
        } else {
          acc.total_expenses += amount
          acc.expense_count += 1
        }
        acc.net_income = acc.total_income - acc.total_expenses
        return acc
      },
      {
        total_income: 0,
        total_expenses: 0,
        net_income: 0,
        income_count: 0,
        expense_count: 0,
      }
    )
  }, [transactions])

  const rangeLabel = useMemo(() => {
    if (!dateRange?.from) return 'No range selected'
    const startLabel = format(dateRange.from, 'MMM dd, yyyy')
    const endLabel = format(dateRange.to ?? dateRange.from, 'MMM dd, yyyy')
    return `${startLabel} - ${endLabel}`
  }, [dateRange])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Flow Report</h1>
          <p className="text-muted-foreground mt-2">
            Individual income and expense transactions join into a single cash flow.
          </p>
        </div>
        <Button variant="outline" onClick={loadTransactions} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <TransactionSummary data={summary} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Flow Timeline</CardTitle>
          <CardDescription>
            Showing transactions for {rangeLabel}. Each transaction is drawn individually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date range</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="space-y-2">
              <Label>Account filter</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transactions shown (per side)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={detailLevel}
                  onValueChange={setDetailLevel}
                  min={4}
                  max={20}
                  step={1}
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {maxNodesPerSide}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Increase to show more individual transactions on each side.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <TrendingUp className="h-3 w-3" /> Income joins
            </Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <TrendingDown className="h-3 w-3" /> Expense exits
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              {transactions.length === 0
                ? 'No transactions loaded'
                : `${flowData.incomeNodes.length}/${flowData.incomeCount} income · ${flowData.expenseNodes.length}/${flowData.expenseCount} expense`}
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Loading error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {dataCapped && (
            <Alert>
              <AlertTitle>Large dataset</AlertTitle>
              <AlertDescription>
                More than {PAGE_SIZE * MAX_PAGES} transactions matched this range.
                Increase the detail level or narrow the date range for the full flow.
              </AlertDescription>
            </Alert>
          )}

          {flowData.overflow && transactions.length > 0 && (
            <Alert>
              <AlertTitle>Not all transactions shown</AlertTitle>
              <AlertDescription>
                Increase the slider to display more individual transactions.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-muted/30 p-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-40 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                  <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No transactions in this range</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting the date range or selecting a different account.
                </p>
              </div>
            ) : (
              <SankeyFlow
                incomeNodes={flowData.incomeNodes}
                expenseNodes={flowData.expenseNodes}
                totalIncome={flowData.totalIncome}
                totalExpenses={flowData.totalExpenses}
                netIncome={summary?.net_income ?? 0}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SankeyFlow({
  incomeNodes,
  expenseNodes,
  totalIncome,
  totalExpenses,
  netIncome,
}: {
  incomeNodes: FlowNode[]
  expenseNodes: FlowNode[]
  totalIncome: number
  totalExpenses: number
  netIncome: number
}) {
  const nodeCount = Math.max(incomeNodes.length, expenseNodes.length, 1)
  const viewHeight = Math.max(BASE_HEIGHT, nodeCount * 70)
  const topPadding = 40
  const joinSpan = Math.min(200, viewHeight * 0.4)

  const leftYs = distributeBetween(
    incomeNodes.length,
    topPadding,
    viewHeight - topPadding
  )
  const rightYs = distributeBetween(
    expenseNodes.length,
    topPadding,
    viewHeight - topPadding
  )
  const joinYsLeft = distributeBetween(
    incomeNodes.length,
    viewHeight / 2 - joinSpan / 2,
    viewHeight / 2 + joinSpan / 2
  )
  const joinYsRight = distributeBetween(
    expenseNodes.length,
    viewHeight / 2 - joinSpan / 2,
    viewHeight / 2 + joinSpan / 2
  )

  const leftNodes: PositionedNode[] = incomeNodes.map((node, index) => ({
    ...node,
    x: SIDE_PADDING,
    y: leftYs[index] ?? viewHeight / 2,
  }))
  const rightNodes: PositionedNode[] = expenseNodes.map((node, index) => ({
    ...node,
    x: VIEW_WIDTH - SIDE_PADDING - NODE_WIDTH,
    y: rightYs[index] ?? viewHeight / 2,
  }))

  const maxAmount = Math.max(
    1,
    ...incomeNodes.map((node) => node.amount),
    ...expenseNodes.map((node) => node.amount)
  )

  const centerX = (VIEW_WIDTH - CENTER_WIDTH) / 2
  const centerY = viewHeight / 2

  const strokeWidth = (amount: number) => {
    const scaled = 4 + (amount / maxAmount) * 16
    return Math.max(3, Math.min(22, scaled))
  }

  const drawPath = (startX: number, startY: number, endX: number, endY: number) => {
    const curve = 140
    return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`
  }

  return (
    <div className="relative" style={{ height: viewHeight }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
        preserveAspectRatio="none"
      >
        {leftNodes.map((node, index) => {
          const startX = node.x + NODE_WIDTH
          const startY = node.y
          const endX = centerX
          const endY = joinYsLeft[index] ?? centerY

          return (
            <path
              key={`left-${node.id}`}
              d={drawPath(startX, startY, endX, endY)}
              fill="none"
              stroke={node.color}
              strokeOpacity={0.45}
              strokeWidth={strokeWidth(node.amount)}
              strokeLinecap="round"
            />
          )
        })}

        {rightNodes.map((node, index) => {
          const startX = centerX + CENTER_WIDTH
          const startY = joinYsRight[index] ?? centerY
          const endX = node.x
          const endY = node.y

          return (
            <path
              key={`right-${node.id}`}
              d={drawPath(startX, startY, endX, endY)}
              fill="none"
              stroke={node.color}
              strokeOpacity={0.45}
              strokeWidth={strokeWidth(node.amount)}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {leftNodes.map((node) => (
        <FlowNodeCard key={node.id} node={node} viewHeight={viewHeight} />
      ))}

      {rightNodes.map((node) => (
        <FlowNodeCard key={node.id} node={node} viewHeight={viewHeight} />
      ))}

      <CenterNodeCard
        x={centerX}
        y={centerY}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netIncome={netIncome}
        viewHeight={viewHeight}
      />
    </div>
  )
}

function FlowNodeCard({ node, viewHeight }: { node: PositionedNode; viewHeight: number }) {
  const isIncome = node.kind === 'income'
  const badgeClass = isIncome
    ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
    : 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-900/40 dark:text-rose-200'
  const cardClass = isIncome
    ? 'border-emerald-200/70 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
    : 'border-rose-200/70 bg-rose-50/70 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100'

  return (
    <div
      className={cn('absolute w-[220px] -translate-y-1/2 rounded-lg border px-3 py-2 shadow-sm', cardClass)}
      style={{
        left: toPercent(node.x, VIEW_WIDTH),
        top: toPercent(node.y, viewHeight),
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{formatCurrency(node.amount)}</span>
        <Badge className={badgeClass}>{isIncome ? 'Income' : 'Expense'}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {node.label}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {node.meta}
      </div>
    </div>
  )
}

function CenterNodeCard({
  x,
  y,
  totalIncome,
  totalExpenses,
  netIncome,
  viewHeight,
}: {
  x: number
  y: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  viewHeight: number
}) {
  const netValue = normalizeAmount(netIncome)
  const isPositive = netValue >= 0

  return (
    <div
      className="absolute -translate-y-1/2 rounded-xl border bg-background/90 px-4 py-3 text-center shadow-sm"
      style={{
        left: toPercent(x, VIEW_WIDTH),
        top: toPercent(y, viewHeight),
        width: `${CENTER_WIDTH}px`,
      }}
    >
      <div className="text-xs text-muted-foreground">Cash Flow</div>
      <div className={cn('text-lg font-semibold', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
        {formatCurrency(netValue)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>In {formatCurrency(normalizeAmount(totalIncome))}</div>
        <div>Out {formatCurrency(normalizeAmount(totalExpenses))}</div>
      </div>
    </div>
  )
}
