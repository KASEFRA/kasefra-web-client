"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  Target,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp,
  Landmark,
  Bitcoin,
  Briefcase,
  Home,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { useAuth } from "@/components/providers/auth-provider"

const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Accounts",
    url: "/dashboard/accounts",
    icon: Wallet,
    items: [
      {
        title: "All Accounts",
        url: "/dashboard/accounts",
      },
      {
        title: "Bank Accounts",
        url: "/dashboard/accounts/bank",
        icon: Landmark,
      },
      {
        title: "Investments",
        url: "/dashboard/accounts/investments",
        icon: TrendingUp,
      },
      {
        title: "Crypto",
        url: "/dashboard/accounts/crypto",
        icon: Bitcoin,
      },
      {
        title: "Assets",
        url: "/dashboard/accounts/assets",
        icon: Home,
      },
    ],
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "Budgets",
    url: "/dashboard/budgets",
    icon: PieChart,
  },
  {
    title: "Goals",
    url: "/dashboard/goals",
    icon: Target,
  },
  {
    title: "Net Worth",
    url: "/dashboard/networth",
    icon: Briefcase,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
]

const navSecondaryItems = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/dashboard/help",
    icon: HelpCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = {
    name: user?.full_name || "User",
    email: user?.email || "",
    avatar: "/avatars/default.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-lg">K</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Kasefra</span>
                  <span className="truncate text-xs text-muted-foreground">Personal Finance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
