'use client'

/**
 * Reports Page
 * Financial reports and analytics
 */

import { FileText, TrendingUp, PieChart, BarChart, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            View detailed financial reports and insights
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BarChart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Reports Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              We're working on powerful reporting features to help you understand your finances better.
              Check back soon for income statements, expense analysis, and more!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Future Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Income Statement</CardTitle>
            </div>
            <CardDescription>
              Detailed breakdown of income and expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Expense Analysis</CardTitle>
            </div>
            <CardDescription>
              Category-wise spending breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cash Flow</CardTitle>
            </div>
            <CardDescription>
              Monthly cash flow analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Net Worth Trend</CardTitle>
            </div>
            <CardDescription>
              Track your net worth over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Budget vs Actual</CardTitle>
            </div>
            <CardDescription>
              Compare budgeted vs actual spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tax Summary</CardTitle>
            </div>
            <CardDescription>
              Annual tax-related transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
