"use client"'use client'



import * as React from "react"/**

import { * App Sidebar Component

  LayoutDashboard, * Collapsible sidebar navigation for dashboard

  Wallet, */

  ArrowRightLeft,

  PieChart,import Link from 'next/link'

  Target,import { usePathname } from 'next/navigation'

  FileText,import { useAuth } from '@/components/providers/auth-provider'

  Settings,import {

  HelpCircle,  Home,

} from "lucide-react"  CreditCard,

  ArrowLeftRight,

import {  PiggyBank,

  Sidebar,  Target,

  SidebarContent,  BarChart3,

  SidebarFooter,  Settings,

  SidebarHeader,  ChevronLeft,

  SidebarMenu,  ChevronRight,

  SidebarMenuButton,} from 'lucide-react'

  SidebarMenuItem,import { useState } from 'react'

} from "@/components/ui/sidebar"

import { NavMain } from "@/components/dashboard/nav-main"const navigationItems = [

import { NavSecondary } from "@/components/dashboard/nav-secondary"  {

import { NavUser } from "@/components/dashboard/nav-user"    name: 'Dashboard',

import { useAuth } from "@/components/providers/auth-provider"    href: '/dashboard',

    icon: Home,

const navMainItems = [  },

  {  {

    title: "Dashboard",    name: 'Accounts',

    url: "/dashboard",    href: '/dashboard/accounts',

    icon: LayoutDashboard,    icon: CreditCard,

  },  },

  {  {

    title: "Accounts",    name: 'Transactions',

    url: "/dashboard/accounts",    href: '/dashboard/transactions',

    icon: Wallet,    icon: ArrowLeftRight,

  },  },

  {  {

    title: "Transactions",    name: 'Budgets',

    url: "/dashboard/transactions",    href: '/dashboard/budgets',

    icon: ArrowRightLeft,    icon: PiggyBank,

  },  },

  {  {

    title: "Budgets",    name: 'Goals',

    url: "/dashboard/budgets",    href: '/dashboard/goals',

    icon: PieChart,    icon: Target,

  },  },

  {  {

    title: "Goals",    name: 'Reports',

    url: "/dashboard/goals",    href: '/dashboard/reports',

    icon: Target,    icon: BarChart3,

  },  },

  {  {

    title: "Reports",    name: 'Settings',

    url: "/dashboard/reports",    href: '/dashboard/settings',

    icon: FileText,    icon: Settings,

  },  },

]]



const navSecondaryItems = [export default function AppSidebar() {

  {  const [collapsed, setCollapsed] = useState(false)

    title: "Settings",  const pathname = usePathname()

    url: "/dashboard/settings",  const { user } = useAuth()

    icon: Settings,

  },  return (

  {    <div

    title: "Help & Support",      className={`flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ${

    url: "/dashboard/help",        collapsed ? 'w-16' : 'w-64'

    icon: HelpCircle,      }`}

  },    >

]      {/* Logo Section */}

      <div className="flex h-16 items-center justify-between border-b border-border px-4">

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {        {!collapsed && (

  const { user } = useAuth()          <Link href="/dashboard" className="flex items-center space-x-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">

  const userData = {              <span className="text-lg font-bold text-primary-foreground">K</span>

    name: user?.full_name || "User",            </div>

    email: user?.email || "",            <span className="text-lg font-bold text-foreground">Kasefra</span>

    avatar: "/avatars/default.jpg",          </Link>

  }        )}

        {collapsed && (

  return (          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">

    <Sidebar collapsible="offcanvas" {...props}>            <span className="text-lg font-bold text-primary-foreground">K</span>

      <SidebarHeader>          </div>

        <SidebarMenu>        )}

          <SidebarMenuItem>      </div>

            <SidebarMenuButton size="lg" asChild>

              <a href="/dashboard">      {/* Navigation Items */}

                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#6e4993] text-white">      <nav className="flex-1 space-y-1 overflow-y-auto p-4">

                  <span className="font-bold text-lg">K</span>        {navigationItems.map((item) => {

                </div>          const Icon = item.icon

                <div className="flex flex-col gap-0.5 leading-none">          const isActive = pathname === item.href

                  <span className="font-semibold">Kasefra</span>          return (

                  <span className="text-xs text-muted-foreground">PFM</span>            <Link

                </div>              key={item.href}

              </a>              href={item.href}

            </SidebarMenuButton>              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${

          </SidebarMenuItem>                isActive

        </SidebarMenu>                  ? 'bg-primary text-primary-foreground'

      </SidebarHeader>                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'

      <SidebarContent>              }`}

        <NavMain items={navMainItems} />              title={collapsed ? item.name : undefined}

        <NavSecondary items={navSecondaryItems} className="mt-auto" />            >

      </SidebarContent>              <Icon className="h-5 w-5 flex-shrink-0" />

      <SidebarFooter>              {!collapsed && <span>{item.name}</span>}

        <NavUser user={userData} />            </Link>

      </SidebarFooter>          )

    </Sidebar>        })}

  )      </nav>

}

      {/* User Section */}
      <div className="border-t border-border p-4">
        {!collapsed && user && (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-semibold">
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-semibold">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}
