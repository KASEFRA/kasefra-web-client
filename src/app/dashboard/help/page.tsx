'use client'

/**
 * Help & Support Page
 * FAQ and support resources
 */

import { HelpCircle, Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I add a new account?',
      answer: 'Navigate to the Accounts page and click the "Add Account" button. Fill in the account details including name, type, and initial balance. You can add bank accounts, investments, crypto, and physical assets.',
    },
    {
      question: 'How do I track my expenses?',
      answer: 'Go to the Transactions page to view all your transactions. You can add manual transactions, categorize them, and use filters to analyze your spending patterns.',
    },
    {
      question: 'What is Net Worth and how is it calculated?',
      answer: 'Net Worth is the difference between your total assets and total liabilities. It includes all your accounts: bank balances, investments, crypto, and physical assets, minus any loans or debts.',
    },
    {
      question: 'How do budgets work?',
      answer: 'Create a budget on the Budgets page by setting spending limits for different categories. The app will track your actual spending against your budget and alert you when you\'re approaching limits.',
    },
    {
      question: 'Can I set financial goals?',
      answer: 'Yes! Visit the Goals page to create savings goals. Set a target amount and deadline, and the app will track your progress and suggest how much to save regularly.',
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes, we take security seriously. All data is encrypted, and we use industry-standard security practices. We never share your personal financial information with third parties.',
    },
    {
      question: 'How do I export my data?',
      answer: 'Currently, data export is coming soon. Once available, you\'ll be able to export your transactions and reports in CSV and PDF formats from the Reports page.',
    },
    {
      question: 'What currencies are supported?',
      answer: 'Currently, Kasefra supports AED (UAE Dirham). We\'re working on adding multi-currency support in future updates.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Find answers to common questions and get support
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Read our comprehensive guides and tutorials
            </p>
            <Button variant="outline" className="w-full" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our support team in real-time
            </p>
            <Button variant="outline" className="w-full" disabled>
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Email Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send us an email and we'll get back to you
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:support@kasefra.com">
                <Mail className="h-4 w-4 mr-2" />
                Email Us
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>
            Find quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>
            Our support team is here to help you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you couldn't find the answer you're looking for, please don't hesitate to reach out.
            We're available Monday to Friday, 9 AM to 6 PM GST.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <a href="mailto:support@kasefra.com">
                <Mail className="h-4 w-4 mr-2" />
                support@kasefra.com
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
