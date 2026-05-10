"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet"

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "#locations", label: "Locations" },
  { href: "#about", label: "About" },
  { href: "#community", label: "Community" },
  { href: "#contact", label: "Contact" },
]

export function MobileMenuDrawer() {
  return (
    <ThemedSheet>
      <ThemedSheetTrigger asChild>
        <ThemedButton
          type="button"
          variant="outline"
          size="icon"
          className="size-9 bg-background text-foreground hover:bg-muted md:hidden"
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </ThemedButton>
      </ThemedSheetTrigger>

      <ThemedSheetContent
        side="left"
        className="w-[min(18rem,85vw)] gap-0 p-0"
      >
        <ThemedSheetHeader className="border-b px-4 py-4 pr-12">
          <ThemedSheetTitle>Pronto</ThemedSheetTitle>
          <ThemedSheetDescription>Menu navigation</ThemedSheetDescription>
        </ThemedSheetHeader>

        <nav className="grid gap-1 p-3">
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
