'use client'

/**
 * Transaction Flow Report
 * Visualizes income/expense branches in a Sankey-style flow grouped by category.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { ArrowRightLeft, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react'

import { accountsApi, bankApi } from '@/lib/api'
import type { Account, TransactionFlowResponse } from '@/types'
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

const VIEW_WIDTH = 1000
const NODE_WIDTH = 220
const CENTER_WIDTH = 180
const SIDE_PADDING = 40
const BASE_HEIGHT = 440

interface FlowNode {
  id: string
  label: string
  meta: string
  amount: number
  color: string
  kind: 'income' | 'expense'
  transactionCount: number
  categoryCount: number
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

const distributeBetween = (count: number, start: number, end: number) => {
  if (count <= 0) return []
  if (count === 1) return [(start + end) / 2]
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + index * step)
}

const INCOME_PALETTE = [
  '#10B981',
  '#34D399',
  '#6EE7B7',
  '#22C55E',
  '#16A34A',
  '#4ADE80',
  '#059669',
  '#047857',
]
const EXPENSE_PALETTE = [
  '#FB7185',
  '#F43F5E',
  '#FDA4AF',
  '#E11D48',
  '#BE123C',
  '#F87171',
  '#DC2626',
  '#EF4444',
]

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const pickColor = (seed: string, kind: 'income' | 'expense') => {
  const palette = kind === 'income' ? INCOME_PALETTE : EXPENSE_PALETTE
  return palette[hashString(seed) % palette.length]
}

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean
  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value)) return `rgba(0, 0, 0, ${alpha})`
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const buildFlowNodes = (
  nodes: TransactionFlowResponse['income_nodes'],
  kind: 'income' | 'expense'
): FlowNode[] => {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    meta: node.meta,
    amount: normalizeAmount(node.amount),
    color: pickColor(`${node.id}-${kind}`, kind),
    kind,
    transactionCount: node.transaction_count,
    categoryCount: node.category_count,
  }))
}

export function TransactionFlowReport() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [flowResponse, setFlowResponse] = useState<TransactionFlowResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange)
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [detailLevel, setDetailLevel] = useState<number[]>([8])

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const accountsResponse = await accountsApi.getAll()
        setAccounts(accountsResponse.accounts.filter((account) => account.is_active))
      } catch (err) {
        console.error('Failed to load report lookups:', err)
      }
    }

    loadLookups()
  }, [])

  const loadFlow = useCallback(async () => {
    if (!dateRange?.from) {
      setFlowResponse(null)
      return
    }

    setLoading(true)
    setError(null)

    const startDate = format(dateRange.from, 'yyyy-MM-dd')
    const endDate = format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd')
    const maxNodesPerSide = Math.max(4, detailLevel[0] ?? 8)

    try {
      const response = await bankApi.getTransactionFlow({
        start_date: startDate,
        end_date: endDate,
        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
        max_nodes_per_side: maxNodesPerSide,
      })
      setFlowResponse(response)
    } catch (err: any) {
      console.error('Failed to load transactions for flow report:', err)
      setError('Unable to load transactions for the selected range.')
      setFlowResponse(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedAccount, detailLevel])

  useEffect(() => {
    loadFlow()
  }, [loadFlow])

  const maxNodesPerSide = Math.max(4, detailLevel[0] ?? 8)

  const flowData = useMemo(() => {
    if (!flowResponse) {
      return {
        incomeNodes: [] as FlowNode[],
        expenseNodes: [] as FlowNode[],
        totalIncome: 0,
        totalExpenses: 0,
        incomeCount: 0,
        expenseCount: 0,
        totalTransactions: 0,
        overflow: false,
      }
    }

    return {
      incomeNodes: buildFlowNodes(flowResponse.income_nodes, 'income'),
      expenseNodes: buildFlowNodes(flowResponse.expense_nodes, 'expense'),
      totalIncome: normalizeAmount(flowResponse.total_income),
      totalExpenses: normalizeAmount(flowResponse.total_expenses),
      incomeCount: flowResponse.income_category_count,
      expenseCount: flowResponse.expense_category_count,
      totalTransactions: flowResponse.total_transactions,
      overflow: flowResponse.overflow,
    }
  }, [flowResponse])

  const summary = useMemo(() => {
    if (!flowResponse || flowResponse.total_transactions === 0) return null
    return {
      total_income: normalizeAmount(flowResponse.total_income),
      total_expenses: normalizeAmount(flowResponse.total_expenses),
      net_income: normalizeAmount(flowResponse.net_income),
      income_count: flowResponse.income_count,
      expense_count: flowResponse.expense_count,
    }
  }, [flowResponse])

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
            Category-level income and expense streams converge into a single cash flow story.
          </p>
        </div>
        <Button variant="outline" onClick={loadFlow} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <TransactionSummary data={summary} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Flow Timeline</CardTitle>
          <CardDescription>
            Showing grouped categories for {rangeLabel}. Larger nodes represent bigger category totals.
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
              <Label>Categories shown (per side)</Label>
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
                Increase to show more categories on each side.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <TrendingUp className="h-3 w-3" /> Income categories
            </Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <TrendingDown className="h-3 w-3" /> Expense categories
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              {flowData.totalTransactions === 0
                ? 'No transactions loaded'
                : `${flowData.incomeNodes.length}/${flowData.incomeCount} income categories · ${flowData.expenseNodes.length}/${flowData.expenseCount} expense categories`}
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Loading error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {flowData.overflow && flowData.totalTransactions > 0 && (
            <Alert>
              <AlertTitle>Not all categories shown</AlertTitle>
              <AlertDescription>
                Increase the slider to display more categories.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-2xl border bg-gradient-to-br from-emerald-50/70 via-background to-rose-50/70 p-4 shadow-sm dark:from-emerald-950/30 dark:via-background dark:to-rose-950/30">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-40 w-full" />
                ))}
              </div>
            ) : flowData.totalTransactions === 0 ? (
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
  const badgeStyle = {
    backgroundColor: hexToRgba(node.color, 0.15),
    borderColor: hexToRgba(node.color, 0.4),
    color: node.color,
  }
  const cardStyle = {
    borderColor: hexToRgba(node.color, 0.4),
    backgroundColor: hexToRgba(node.color, isIncome ? 0.08 : 0.07),
    boxShadow: `0 12px 28px ${hexToRgba(node.color, 0.12)}`,
  }

  return (
    <div
      className={cn('absolute w-[220px] -translate-y-1/2 rounded-xl border px-3 py-2 backdrop-blur')}
      style={{
        left: toPercent(node.x, VIEW_WIDTH),
        top: toPercent(node.y, viewHeight),
        ...cardStyle,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{formatCurrency(node.amount)}</span>
        <Badge style={badgeStyle}>{isIncome ? 'Income' : 'Expense'}</Badge>
      </div>
      <div className="mt-1 text-xs font-medium text-foreground/90 line-clamp-2">
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
      className="absolute -translate-y-1/2 rounded-2xl border bg-background/90 px-4 py-3 text-center shadow-md"
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
