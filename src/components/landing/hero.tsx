'use client'

/**
 * Hero Section
 * Main landing page hero with Kasefra branding
 */

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="container mx-auto px-4 py-16 text-center md:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Main Headline */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Smart Finance Management for the{' '}
          <span className="text-primary">UAE</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-8 text-xl text-muted-foreground">
          Take control of your finances with AI-powered insights, UAE-specific
          features, and Shariah-compliant options.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              Multi-Account Tracking
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect multiple UAE bank accounts, credit cards, and investment accounts in one place.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              AI-Powered Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Get personalized recommendations and forecasts to optimize your financial health.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 text-left shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              Shariah-Compliant
            </h3>
            <p className="text-sm text-muted-foreground">
              Track Zakat, Hajj savings, and halal investments with UAE-specific features.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
