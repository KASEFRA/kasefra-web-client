'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { healthScoreApi, type HealthScoreResponse } from '@/lib/api/health-score'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft, Lightbulb } from 'lucide-react'

const GRADE_COLOR: Record<string, string> = {
  S: 'text-emerald-500',
  A: 'text-green-500',
  B: 'text-blue-500',
  C: 'text-yellow-500',
  D: 'text-orange-500',
  F: 'text-red-500',
}

const GRADE_BG: Record<string, string> = {
  S: 'bg-emerald-500',
  A: 'bg-green-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  F: 'bg-red-500',
}

const GRADES_LEGEND = [
  { grade: 'S', range: '90–100', label: 'Exceptional' },
  { grade: 'A', range: '80–89', label: 'Great' },
  { grade: 'B', range: '70–79', label: 'Good' },
  { grade: 'C', range: '60–69', label: 'Fair' },
  { grade: 'D', range: '50–59', label: 'Poor' },
  { grade: 'F', range: '<50', label: 'Critical' },
]

export default function HealthScorePage() {
  const [data, setData] = useState<HealthScoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    healthScoreApi
      .get()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Health Score</h1>
          <p className="text-muted-foreground mt-1">
            Your overall financial wellness based on current data
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Calculating your score...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Unable to calculate health score. Please try again later.
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Score Summary */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className={`text-7xl font-bold ${GRADE_COLOR[data.grade] ?? 'text-foreground'}`}>
                  {data.grade}
                </div>
                <div className="text-3xl font-semibold">{data.total_score}/100</div>
                <p className="text-xs text-muted-foreground">
                  Last calculated {new Date(data.calculated_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Grades Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Grade Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {GRADES_LEGEND.map(({ grade, range, label }) => (
                    <div key={grade} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white ${GRADE_BG[grade] ?? 'bg-muted'}`}
                        >
                          {grade}
                        </span>
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dimensions + Insights */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dimension Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {data.dimensions.map((dim) => (
                  <div key={dim.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dim.label}</span>
                      <span className="text-muted-foreground">
                        {dim.weighted_score}/{dim.weight} pts
                      </span>
                    </div>
                    <Progress value={dim.raw_score} className="h-2" />
                    <p className="text-xs text-muted-foreground">{dim.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.insights.map((insight, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
