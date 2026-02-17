"use client"

import * as React from "react"
import Image from "next/image"
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
  PiggyBank,
  CreditCard,
  Banknote,
  CircleDollarSign,
  Bot,
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

const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) return ""
  if (avatarUrl.startsWith("http")) return avatarUrl
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  return `${baseUrl}${avatarUrl}`
}

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
        title: "Checking",
        url: "/dashboard/accounts/checking",
        icon: Landmark,
      },
      {
        title: "Savings",
        url: "/dashboard/accounts/savings",
        icon: PiggyBank,
      },
      {
        title: "Credit Cards",
        url: "/dashboard/accounts/credit-cards",
        icon: CreditCard,
      },
      {
        title: "Cash",
        url: "/dashboard/accounts/cash",
        icon: Banknote,
      },
      {
        title: "Loans",
        url: "/dashboard/accounts/loans",
        icon: CircleDollarSign,
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
  {
    title: "Loky AI",
    url: "/dashboard/chat",
    icon: Bot,
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
    avatar: resolveAvatarUrl(user?.avatar_url),
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Kasefra"
              className=" group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-1"
            >
              <a href="/dashboard">
                <Image
                  src="/logo.png"
                  alt="Kasefra logo"
                  width={48}
                  height={48}
                  className="hidden h-12 w-12 object-contain group-data-[collapsible=icon]:block"
                  priority
                />
                <Image
                  src="/logo_long.png"
                  alt="Kasefra"
                  width={220}
                  height={56}
                  className="block h-14 w-auto max-w-[220px] object-contain group-data-[collapsible=icon]:hidden"
                  priority
                />
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
