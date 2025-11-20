"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { usePathname } from "next/navigation"
import React from "react"
import { Home } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  
  const pathSegments = pathname.split("/").filter((segment) => segment !== "")
  
  // Format segment names to be more readable
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }
  
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[padding] duration-200 ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.length > 0 && (
            <BreadcrumbSeparator className="hidden md:block" />
          )}
          {pathSegments.map((segment, index) => {
            const href = `/${pathSegments.slice(0, index + 1).join("/")}`
            const isLast = index === pathSegments.length - 1
            const title = formatSegment(segment)

            return (
              <React.Fragment key={segment}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
