import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TenantAdminShellPage } from "./TenantAdminShellPage"
import type {
  TenantBusinessContext,
  TenantLocationContext,
} from "@/features/tenant/types/tenant-context"
import { DEFAULT_BUSINESS_PRICING_SETTINGS } from "@/lib/pricing/business-pricing-settings"

vi.mock("@/features/pricing-settings/components/BusinessPricingSettingsForm", () => ({
  BusinessPricingSettingsForm: () => <div>Pizza pricing settings form</div>,
}))

const setupBusiness: TenantBusinessContext = {
  id: "business-randys",
  slug: "randys-pizza",
  name: "Randy's Pizza & Pub",
  status: "setup",
  primaryContactName: null,
  primaryContactEmail: null,
  primaryPhone: null,
  isActive: false,
  isSetup: true,
  isPaused: false,
  isArchived: false,
}

const setupLocation: TenantLocationContext = {
  id: "location-randys",
  businessId: "business-randys",
  slug: "randys-main-street",
  name: "Randy's Main Street",
  status: "setup",
  isEnabled: false,
  acceptingOrders: false,
  pickupEnabled: false,
  deliveryEnabled: false,
  timezone: "America/New_York",
  isActive: false,
  isSetup: true,
}

function getLinkHref(name: RegExp) {
  return screen.getByRole("link", { name }).getAttribute("href")
}

describe("TenantAdminShellPage", () => {
  it("groups setup links by catalog, variants, modifiers, media, and preview", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    expect(screen.getByText("Product Catalog")).toBeInTheDocument()
    expect(screen.getByText("Categories & Subcategories")).toBeInTheDocument()
    expect(screen.queryByText("Product Subcategories")).not.toBeInTheDocument()
    expect(screen.queryByText("New Product")).not.toBeInTheDocument()
    expect(screen.getByText("Variants")).toBeInTheDocument()
    expect(screen.queryByText("Product Variant Assignments")).not.toBeInTheDocument()
    expect(screen.getByText("Modifiers")).toBeInTheDocument()
    expect(screen.queryByText("Product Modifier Assignments")).not.toBeInTheDocument()
    expect(screen.getByText("Media")).toBeInTheDocument()
    expect(screen.getByText("Customer Preview")).toBeInTheDocument()
    expect(screen.getByText("Platform Admin Mode")).toBeInTheDocument()
  })

  it("uses tenant-scoped links for reusable setup and product assignments", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        defaultLocation={setupLocation}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    expect(getLinkHref(/^Categories & Subcategories/)).toBe(
      "/businesses/randys-pizza/admin/products/categories"
    )
    expect(getLinkHref(/^Variant Groups/)).toBe(
      "/businesses/randys-pizza/admin/products/variant-groups"
    )
    expect(getLinkHref(/^Modifier Library/)).toBe(
      "/businesses/randys-pizza/admin/modifiers"
    )
  })

  it("puts category setup before products in the product catalog section", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    const catalogSection = screen
      .getByText("Product Catalog")
      .closest("div")?.parentElement

    expect(catalogSection).not.toBeNull()

    const catalogLinks = Array.from(
      catalogSection?.querySelectorAll("a") ?? []
    ).map((link) => link.textContent ?? "")

    expect(catalogLinks[0]).toContain("Categories & Subcategories")
    expect(catalogLinks[1]).toContain("Product List")
    expect(catalogLinks).toHaveLength(2)
  })

  it("links setup businesses to the scoped public menu preview", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    expect(
      getLinkHref(/^Public Menu Preview \(setup\)/)
    ).toBe("/businesses/randys-pizza/menu")
  })

  it("links locations and orders to the scoped location order route", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        defaultLocation={setupLocation}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    expect(getLinkHref(/^Randy's Main Street Orders/)).toBe(
      "/businesses/randys-pizza/locations/randys-main-street/orders"
    )
  })

  it("keeps future specials disabled and shows no-location order messaging", () => {
    render(
      <TenantAdminShellPage
        business={setupBusiness}
        pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
      />
    )

    expect(screen.getByText("Specials")).toBeInTheDocument()
    expect(screen.getByText("Locations / Orders")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /specials/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /orders/i })
    ).not.toBeInTheDocument()
  })
})
