'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ChevronRight, AlertCircle } from 'lucide-react'
import type { HealthScoreResponse } from '@/lib/api/health-score'

interface Props {
  data: HealthScoreResponse | null
  loading: boolean
}

const GRADE_COLOR: Record<string, { text: string; ring: string }> = {
  S: { text: 'text-emerald-500', ring: '#10b981' },
  A: { text: 'text-green-500', ring: '#22c55e' },
  B: { text: 'text-blue-500', ring: '#3b82f6' },
  C: { text: 'text-yellow-500', ring: '#eab308' },
  D: { text: 'text-orange-500', ring: '#f97316' },
  F: { text: 'text-red-500', ring: '#ef4444' },
}

function ScoreDial({ score, grade }: { score: number; grade: string }) {
  const colors = GRADE_COLOR[grade] ?? GRADE_COLOR['F']
  const pct = Math.min(100, Math.max(0, score))
  // conic-gradient: fill clockwise from top (offset by -90deg)
  const style = {
    background: `conic-gradient(${colors.ring} 0% ${pct}%, hsl(var(--muted)) ${pct}% 100%)`,
  } as React.CSSProperties

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ ...style, transform: 'rotate(-90deg)' }}
      />
      {/* Inner cutout */}
      <div className="absolute inset-[10px] rounded-full bg-card flex flex-col items-center justify-center">
        <span className={`text-xl font-bold leading-none ${colors.text}`}>{grade}</span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">{Math.round(score)}</span>
      </div>
    </div>
  )
}

export function HealthScoreCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to calculate score</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const topInsights = data.insights.slice(0, 2)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <ScoreDial score={data.total_score} grade={data.grade} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-2xl font-bold">{data.total_score}/100</div>
            {topInsights.length > 0 && (
              <ul className="space-y-1">
                {topInsights.map((insight, i) => (
                  <li key={i} className="text-xs text-muted-foreground line-clamp-2">
                    • {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-3">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs w-full justify-between" asChild>
            <Link href="/dashboard/health-score">
              View full breakdown
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
