import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ThemedToastProvider } from "@/components/themed/ThemedToastProvider"
import type { ConfiguredProductResult, DealCartItem } from "@/features/cart/types/cart"
import { CartProvider } from "@/features/cart/context/CartProvider"
import { MixAndMatchBuilder } from "./MixAndMatchBuilder"

const loadPublicMixAndMatchDealMock = vi.fn()
const getProductConfigMock = vi.fn()

vi.mock("@/features/specials/queries/load-public-mix-and-match-deal", () => ({
  loadPublicMixAndMatchDeal: (...args: unknown[]) =>
    loadPublicMixAndMatchDealMock(...args),
}))

vi.mock("@/features/product-configurator/queries/get-product-config", () => ({
  getProductConfig: (...args: unknown[]) => getProductConfigMock(...args),
}))

vi.mock(
  "@/features/product-configurator/components/ProductConfigurator",
  () => ({
    ProductConfigurator: ({
      allowedVariantOptionIds,
      modifierIncludedRuleOverrides,
      onConfiguredItem,
    }: {
      allowedVariantOptionIds?: string[] | null
      modifierIncludedRuleOverrides?: Array<{
        modifierGroupId: string
        includedSelectionCount: number
      }> | null
      onConfiguredItem: (result: ConfiguredProductResult) => void
    }) => (
      <div>
        <div>Allowed variants: {allowedVariantOptionIds?.join(", ") ?? "all"}</div>
        <div>
          Modifier overrides:{" "}
          {modifierIncludedRuleOverrides
            ?.map(
              (override) =>
                `${override.modifierGroupId}:${override.includedSelectionCount}`
            )
            .join(", ") ?? "none"}
        </div>
        <button
          type="button"
          onClick={() =>
            onConfiguredItem({
              businessId: "business-1",
              businessSlug: "demo",
              locationId: null,
              locationSlug: null,
              productId: "product-1",
              productName: "Italian Sub",
              variantId: "large",
              variantName: "Large",
              quantity: 1,
              unitPrice: 12,
              totalPrice: 12,
              configuredLineTotal: 12,
              chargedModifierTotal: 1,
              modifierExtraTotal: 1,
              childExtraTotal: 1,
              modifiers: [],
            })
          }
        >
          Return configured mix child
        </button>
      </div>
    ),
  })
)

const mixDeal = {
  id: "mix-1",
  businessId: "business-1",
  businessSlug: "demo",
  name: "Any 2 Subs",
  customerDescription: "Choose any two subs.",
  isEnabled: true,
  startsAt: null,
  endsAt: null,
  availabilityWindows: [],
  rule: {
    minQuantity: 2,
    maxQuantity: null,
    unitPrice: 7.99,
    allowExtraItems: true,
  },
  products: [
    {
      id: "product-1",
      name: "Italian Sub",
      description: "Ham, salami, and cheese.",
      basePrice: 12,
      builderTemplate: "standard",
      hasVariants: true,
      allowedVariantOptionIds: ["large"],
      modifierGroupOverrides: [
        {
          modifierGroupId: "toppings",
          includedSelectionCount: 2,
        },
      ],
    },
    {
      id: "product-2",
      name: "Turkey Sub",
      description: "Turkey and cheese.",
      basePrice: 12,
      builderTemplate: "standard",
      hasVariants: false,
      allowedVariantOptionIds: [],
      modifierGroupOverrides: [],
    },
  ],
}

function buildProductConfig(productId: string) {
  const name = productId === "product-1" ? "Italian Sub" : "Turkey Sub"

  return {
    id: productId,
    business_id: "business-1",
    name,
    description: null,
    builder_template: "standard",
    has_variants: productId === "product-1",
    is_enabled: true,
    base_price: 12,
    variants:
      productId === "product-1"
        ? [
            {
              id: "large",
              name: "Large",
              base_price: 12,
              is_default: true,
              is_enabled: true,
              sort_order: 1,
            },
          ]
        : [],
    product_modifier_groups: [],
    product_included_modifier_groups: [],
    product_default_modifier_options: [],
    product_variant_modifier_option_availability_rules: [],
    product_variant_modifier_option_price_overrides: [],
  }
}

describe("MixAndMatchBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear()
    loadPublicMixAndMatchDealMock.mockResolvedValue(mixDeal)
    getProductConfigMock.mockImplementation((productId: string) =>
      Promise.resolve(buildProductConfig(productId))
    )

    let sequence = 0
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => {
        sequence += 1
        return `uuid-${sequence}`
      }),
    })
  })

  it("adds default configured products into one Mix & Match cart item", async () => {
    render(
      <ThemedToastProvider>
        <CartProvider>
          <MixAndMatchBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="mix-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Any 2 Subs")).toBeInTheDocument()
    expect(screen.getAllByText("Any 2+ for $7.99 each").length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole("button", { name: /add to mix/i })[0])

    await waitFor(() => {
      expect(screen.getByText("1 more item needed.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("button", { name: /add to mix/i })[1])

    await waitFor(() => {
      expect(screen.getByText("Ready to add this Mix & Match deal.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("button", { name: /add mix to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as DealCartItem[]

    expect(storedCart).toHaveLength(1)
    expect(storedCart[0]).toMatchObject({
      itemType: "deal",
      specialType: "mix_and_match_fixed_unit_price",
      specialId: "mix-1",
      specialName: "Any 2 Subs",
      ruleSummary: "Any 2+ for $7.99 each",
      selectedQuantity: 2,
      unitPrice: 7.99,
      mixBaseTotal: 15.98,
      totalPrice: 15.98,
      components: [
        {
          componentLabel: "Mix & Match selections",
          selectedQuantity: 2,
          children: [
            {
              productId: "product-1",
              productName: "Italian Sub",
              variantId: "large",
            },
            {
              productId: "product-2",
              productName: "Turkey Sub",
            },
          ],
        },
      ],
    })
  })

  it("passes mix variant restrictions and modifier overrides into customization", async () => {
    render(
      <ThemedToastProvider>
        <CartProvider>
          <MixAndMatchBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="mix-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Any 2 Subs")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /customize/i })[0])

    expect(await screen.findByText("Allowed variants: large")).toBeInTheDocument()
    expect(
      screen.getByText("Modifier overrides: toppings:2")
    ).toBeInTheDocument()
  })
})
