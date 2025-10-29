/**
 * Signup Page
 * User registration page
 */

import SignupForm from '@/components/auth/signup-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">K</span>
            </div>
            <span className="text-xl font-bold text-foreground">Kasefra</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get started with your personal finance journey
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <SignupForm />
        </div>

        {/* Back to home link */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
