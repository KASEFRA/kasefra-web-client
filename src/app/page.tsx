/**
 * Landing Page
 * Main entry point for unauthenticated users
 */

import Navbar from '@/components/landing/navbar'
import Hero from '@/components/landing/hero'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
    </div>
  )
}
