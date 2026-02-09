/**
 * Chat welcome screen.
 * Shown when no messages exist — provides starter prompts.
 */

'use client'

import {
  Bot,
  TrendingUp,
  PieChart,
  Target,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react'

interface ChatWelcomeProps {
  onSendPrompt: (prompt: string) => void
}

const starterPrompts = [
  {
    icon: Wallet,
    label: 'Account Overview',
    prompt: 'Give me an overview of all my accounts and their balances.',
  },
  {
    icon: ArrowRightLeft,
    label: 'Recent Spending',
    prompt: 'What have I spent money on this month?',
  },
  {
    icon: PieChart,
    label: 'Budget Check',
    prompt: "How am I doing on my budgets? Am I over budget anywhere?",
  },
  {
    icon: Target,
    label: 'Goal Progress',
    prompt: 'How close am I to reaching my savings goals?',
  },
  {
    icon: TrendingUp,
    label: 'Net Worth',
    prompt: "What's my current net worth and how has it changed recently?",
  },
]

export function ChatWelcome({ onSendPrompt }: ChatWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* AI Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bot className="h-8 w-8" />
      </div>

      {/* Welcome text */}
      <h2 className="text-xl font-semibold mb-2">Kasefra AI Assistant</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Ask me anything about your finances. I can analyze your accounts,
        transactions, budgets, goals, and more.
      </p>

      {/* Starter prompts */}
      <div className="grid gap-2 w-full max-w-lg">
        {starterPrompts.map((item) => (
          <button
            key={item.label}
            onClick={() => onSendPrompt(item.prompt)}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
