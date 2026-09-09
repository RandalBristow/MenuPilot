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
  BusinessPricingSettingsForm: () => <div>Pricing settings form</div>,
}))

const business: TenantBusinessContext = {
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

const location: TenantLocationContext = {
  id: "location-randys",
  businessId: business.id,
  slug: "main-street",
  name: "Main Street",
  status: "setup",
  isEnabled: false,
  acceptingOrders: false,
  pickupEnabled: false,
  deliveryEnabled: false,
  timezone: "America/New_York",
  isActive: false,
  isSetup: true,
}

function renderPage(defaultLocation: TenantLocationContext | null = location) {
  render(
    <TenantAdminShellPage
      business={business}
      defaultLocation={defaultLocation}
      pricingSettings={DEFAULT_BUSINESS_PRICING_SETTINGS}
    />
  )
}

describe("TenantAdminShellPage", () => {
  it("links the business dashboard to each top-level administration area", () => {
    renderPage()

    expect(screen.getByRole("link", { name: /Product Catalog/ })).toHaveAttribute(
      "href",
      "/businesses/randys-pizza/admin/catalog"
    )
    expect(
      screen.getByRole("link", { name: /Specials & Promotions/ })
    ).toHaveAttribute("href", "/businesses/randys-pizza/admin/specials")
    expect(screen.getByRole("link", { name: /Media Library/ })).toHaveAttribute(
      "href",
      "/businesses/randys-pizza/admin/media"
    )
    expect(
      screen.getByRole("link", { name: /Orders & Operations/ })
    ).toHaveAttribute(
      "href",
      "/businesses/randys-pizza/locations/main-street/orders"
    )
    expect(
      screen.getByRole("link", { name: /Storefront Preview/ })
    ).toHaveAttribute("href", "/businesses/randys-pizza/menu")
  })

  it("does not link orders when the business has no location", () => {
    renderPage(null)

    expect(
      screen.queryByRole("link", { name: /Orders & Operations/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Orders & Operations")).toBeInTheDocument()
  })

  it("keeps product configuration links off the dashboard", () => {
    renderPage()

    expect(screen.queryByText("Categories & Subcategories")).not.toBeInTheDocument()
    expect(screen.queryByText("Variant Groups")).not.toBeInTheDocument()
    expect(screen.queryByText("Modifier Library")).not.toBeInTheDocument()
  })
})
