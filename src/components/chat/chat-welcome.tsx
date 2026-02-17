/**
 * Chat welcome screen.
 * Shown when no messages exist — provides compact starter prompts.
 */

'use client'

import Image from 'next/image'
import {
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
    label: 'Account overview',
    prompt: 'Give me an overview of all my accounts and their balances.',
  },
  {
    icon: ArrowRightLeft,
    label: 'Recent spending',
    prompt: 'What have I spent money on this month?',
  },
  {
    icon: PieChart,
    label: 'Budget check',
    prompt: "How am I doing on my budgets? Am I over budget anywhere?",
  },
  {
    icon: Target,
    label: 'Goal progress',
    prompt: 'How close am I to reaching my savings goals?',
  },
  {
    icon: TrendingUp,
    label: 'Net worth trend',
    prompt: "What's my current net worth and how has it changed recently?",
  },
]

export function ChatWelcome({ onSendPrompt }: ChatWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-4">
        <Image
          src="/loky.png"
          alt="Loky AI"
          width={80}
          height={80}
          className="rounded-2xl shadow-lg"
        />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-1 text-foreground">
        Loky AI
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        How can I help you today?
      </p>

      {/* Compact starter prompts — 2-column grid of pills */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {starterPrompts.map((item) => (
          <button
            key={item.label}
            onClick={() => onSendPrompt(item.prompt)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs transition-colors hover:bg-accent hover:border-primary/30"
          >
            <item.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
