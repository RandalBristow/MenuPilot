import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PublicSpecial } from "@/features/specials/types/public-special"
import { PublicSpecialsPageClient } from "./PublicSpecialsPageClient"

const builderMock = vi.hoisted(() => ({
  dealProps: [] as Array<{ open: boolean; specialId: string | null }>,
  mixProps: [] as Array<{ open: boolean; specialId: string | null }>,
}))

vi.mock("@/features/specials/components/DealBuilder", () => ({
  DealBuilder: (props: { open: boolean; specialId: string | null }) => {
    builderMock.dealProps.push(props)
    return props.open ? <div>Deal builder opened</div> : null
  },
}))

vi.mock("@/features/specials/components/MixAndMatchBuilder", () => ({
  MixAndMatchBuilder: (props: { open: boolean; specialId: string | null }) => {
    builderMock.mixProps.push(props)
    return props.open ? <div>Mix builder opened</div> : null
  },
}))

vi.mock("@/features/cart/components/CartHeaderButton", () => ({
  CartHeaderButton: ({ checkoutHref }: { checkoutHref?: string }) => (
    <a href={checkoutHref}>Cart</a>
  ),
}))

function buildSpecial(
  overrides: Partial<PublicSpecial> = {}
): PublicSpecial {
  return {
    id: "special-a",
    businessId: "business-a",
    name: "Pizza Night",
    customerDescription: "Save on selected pizzas.",
    specialType: "line_discount",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    eligibleProducts: [],
    eligibleMenuGroupIds: [],
    availabilityWindows: [],
    ...overrides,
  }
}

describe("PublicSpecialsPageClient", () => {
  beforeEach(() => {
    builderMock.dealProps = []
    builderMock.mixProps = []
  })

  it("renders an empty state when no specials are active", () => {
    render(
      <PublicSpecialsPageClient
        businessName="Pronto Demo Pizza & Carryout"
        businessSlug="pronto-demo"
        businessStatus="active"
        activeSpecials={[]}
      />
    )

    expect(screen.getAllByText("Specials & Deals")).toHaveLength(2)
    expect(
      screen.getByText("No specials or deals are available right now.")
    ).toBeInTheDocument()
  })

  it("renders passive specials with checkout copy", () => {
    render(
      <PublicSpecialsPageClient
        businessName="Pronto Demo Pizza & Carryout"
        businessSlug="pronto-demo"
        businessStatus="active"
        activeSpecials={[
          buildSpecial({
            name: "Family Night",
            specialType: "cart_discount",
            discountType: "fixed_amount",
            discountValue: 5,
          }),
        ]}
      />
    )

    expect(screen.getByText("Family Night")).toBeInTheDocument()
    expect(screen.getByText("Cart discount")).toBeInTheDocument()
    expect(
      screen.getByText("Applied automatically at checkout.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /build/i })
    ).not.toBeInTheDocument()
  })

  it("opens the orderable deal builder from a Build Deal action", () => {
    render(
      <PublicSpecialsPageClient
        businessName="Pronto Demo Pizza & Carryout"
        businessSlug="pronto-demo"
        businessStatus="active"
        activeSpecials={[
          buildSpecial({
            id: "deal-a",
            name: "Family Deal",
            specialType: "orderable_deal",
            discountType: "fixed_price",
            discountValue: 29.99,
          }),
        ]}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Build Deal" }))

    expect(screen.getByText("Deal builder opened")).toBeInTheDocument()
    expect(builderMock.dealProps.at(-1)).toMatchObject({
      open: true,
      specialId: "deal-a",
    })
  })

  it("opens the Mix & Match builder from a Build Mix & Match action", () => {
    render(
      <PublicSpecialsPageClient
        businessName="Pronto Demo Pizza & Carryout"
        businessSlug="pronto-demo"
        businessStatus="active"
        activeSpecials={[
          buildSpecial({
            id: "mix-a",
            name: "Any 2 Subs",
            specialType: "mix_and_match_fixed_unit_price",
            discountType: "fixed_price",
            discountValue: 0,
            mixRule: {
              minQuantity: 2,
              maxQuantity: 4,
              unitPrice: 7.99,
              allowExtraItems: true,
            },
            mixProductCount: 5,
          }),
        ]}
      />
    )

    expect(
      screen.getByText("Choose 2-4 for $7.99 each. 5 eligible items.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Build Mix & Match" }))

    expect(screen.getByText("Mix builder opened")).toBeInTheDocument()
    expect(builderMock.mixProps.at(-1)).toMatchObject({
      open: true,
      specialId: "mix-a",
    })
  })

  it("renders storefront navigation and footer links with the tenant slug", () => {
    render(
      <PublicSpecialsPageClient
        businessName="Pronto Demo Pizza & Carryout"
        businessSlug="pronto-demo"
        businessStatus="active"
        activeSpecials={[]}
      />
    )

    expect(screen.getByRole("link", { name: "Back to menu" })).toHaveAttribute(
      "href",
      "/businesses/pronto-demo/menu"
    )
    expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute(
      "href",
      "/businesses/pronto-demo/menu"
    )
    expect(screen.getByRole("link", { name: "Specials" })).toHaveAttribute(
      "href",
      "/businesses/pronto-demo/specials"
    )
    expect(screen.getByRole("link", { name: "Platform Admin" }))
      .toHaveAttribute("href", "/platform")
  })
})
