import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useEffect, useRef } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ThemedToastProvider } from "@/components/themed/ThemedToastProvider"
import type { ConfiguredProductResult, DealCartItem } from "@/features/cart/types/cart"
import { CartProvider, useCart } from "@/features/cart/context/CartProvider"
import { DealBuilder } from "./DealBuilder"

const loadPublicOrderableDealMock = vi.fn()
const getProductConfigMock = vi.fn()

vi.mock("@/features/specials/queries/load-public-orderable-deal", () => ({
  loadPublicOrderableDeal: (...args: unknown[]) =>
    loadPublicOrderableDealMock(...args),
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
              productId: "product-1",
              productName: "Cheese Pizza",
              variantId: "large",
              variantName: "Large",
              quantity: 1,
              unitPrice: 15,
              totalPrice: 15,
              configuredLineTotal: 15,
              chargedModifierTotal: 2,
              modifierExtraTotal: 2,
              childExtraTotal: 2,
              modifiers: [
                {
                  optionId: "pepperoni",
                  optionName: "Pepperoni",
                  groupId: "toppings",
                  groupName: "Toppings",
                  placement: "whole",
                  multiplier: 1,
                  priceDelta: 2,
                },
              ],
            })
          }
        >
          Return configured child
        </button>
        <button
          type="button"
          onClick={() =>
            onConfiguredItem({
              productId: "product-1",
              productName: "Cheese Pizza",
              variantId: "large",
              variantName: "Large",
              quantity: 2,
              unitPrice: 15,
              totalPrice: 30,
              configuredLineTotal: 30,
              chargedModifierTotal: 0,
              modifierExtraTotal: 0,
              childExtraTotal: 0,
              modifiers: [],
            })
          }
        >
          Return quantity two child
        </button>
      </div>
    ),
  })
)

const deal = {
  id: "deal-1",
  businessId: "business-1",
  businessSlug: "demo",
  name: "Family Deal",
  customerDescription: "Pizza and drinks.",
  dealBasePrice: 24.99,
  isEnabled: true,
  startsAt: null,
  endsAt: null,
  availabilityWindows: [],
  components: [
    {
      id: "component-1",
      label: "Choose a pizza",
      description: null,
      sortOrder: 1,
      requiredQuantity: 1,
      minQuantity: 1,
      maxQuantity: 1,
      pricingBehavior: "included_base" as const,
      isRequired: true,
      products: [
        {
          id: "product-1",
          name: "Cheese Pizza",
          description: "Classic cheese.",
          basePrice: 12,
          builderTemplate: "pizza",
          hasVariants: true,
          allowedVariantOptionIds: ["large"],
          modifierGroupOverrides: [
            {
              modifierGroupId: "toppings",
              includedSelectionCount: 2,
            },
          ],
        },
      ],
    },
  ],
}

const defaultProductConfig = {
  id: "product-1",
  business_id: "business-1",
  name: "Cheese Pizza",
  description: "Classic cheese.",
  builder_template: "pizza",
  has_variants: true,
  is_enabled: true,
  base_price: 12,
  variants: [
    {
      id: "large",
      name: "Large",
      base_price: 12,
      is_default: true,
      is_enabled: true,
      sort_order: 1,
    },
  ],
  product_modifier_groups: [],
  product_included_modifier_groups: [],
  product_default_modifier_options: [],
  product_variant_modifier_option_availability_rules: [],
  product_variant_modifier_option_price_overrides: [],
}

const requiredModifierProductConfig = {
  ...defaultProductConfig,
  product_modifier_groups: [
    {
      id: "product-group-crust",
      is_enabled: true,
      sort_order: 1,
      modifier_groups: {
        id: "group-crust",
        name: "Crust Type",
        selection_type: "single",
        is_required: true,
        min_required: 1,
        max_allowed: 1,
        is_enabled: true,
        supports_placement: false,
        supports_multiplier: false,
        min_multiplier: 1,
        max_multiplier: 1,
        multiplier_step: 1,
        modifier_options: [
          {
            id: "thin-crust",
            name: "Thin",
            price_delta: 0,
            is_enabled: true,
            sort_order: 1,
            modifier_option_group_id: "option-group-crust",
            modifier_option_groups: {
              id: "option-group-crust",
              name: "Crusts",
              description: null,
              is_enabled: true,
              sort_order: 1,
            },
          },
        ],
      },
    },
  ],
}

function SeedDealOnMount({ item }: { item: DealCartItem }) {
  const { addDealItem } = useCart()
  const hasSeededRef = useRef(false)

  useEffect(() => {
    if (hasSeededRef.current) return
    hasSeededRef.current = true
    addDealItem(item)
  }, [addDealItem, item])

  return null
}

describe("DealBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear()
    loadPublicOrderableDealMock.mockResolvedValue(deal)
    getProductConfigMock.mockResolvedValue({ id: "product-1" })
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("child-1")
        .mockReturnValueOnce("toast-1")
        .mockReturnValueOnce("deal-cart-1"),
    })
  })

  it("configures required child products and adds one parent deal item to cart", async () => {
    render(
      <ThemedToastProvider>
        <CartProvider>
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()
    expect(screen.getByText("Item 1 of 1")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Choose a pizza" })
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("button", { name: /review deal/i })
        .every((button) => button.hasAttribute("disabled"))
    ).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: /customize/i }))
    expect(await screen.findByText("Allowed variants: large")).toBeInTheDocument()
    expect(
      screen.getByText("Modifier overrides: toppings:2")
    ).toBeInTheDocument()
    fireEvent.click(await screen.findByText("Return configured child"))

    await waitFor(() => {
      expect(screen.getByText("Review your deal")).toBeInTheDocument()
    })
    expect(screen.getByText("Cheese Pizza added to deal")).toBeInTheDocument()
    expect(
      screen.getAllByText(/Cheese Pizza - Large - Extras \$2.00/).length
    ).toBeGreaterThan(0)

    expect(screen.getAllByText("Total").length).toBeGreaterThan(0)
    expect(screen.getAllByText("$26.99").length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as unknown[]

    expect(storedCart).toHaveLength(1)
    expect(storedCart[0]).toMatchObject({
      cartItemId: "deal-cart-1",
      itemType: "deal",
      specialId: "deal-1",
      specialName: "Family Deal",
      totalPrice: 26.99,
      components: [
        {
          componentId: "component-1",
          children: [
            {
              childLineId: "child-1",
              productId: "product-1",
              productName: "Cheese Pizza",
              variantId: "large",
              variantName: "Large",
              childExtraTotal: 2,
            },
          ],
        },
      ],
    })
  })

  it("adds a default configured child directly from the product card", async () => {
    getProductConfigMock.mockResolvedValue(defaultProductConfig)

    render(
      <ThemedToastProvider>
        <CartProvider>
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /add to deal/i }))

    await waitFor(() => {
      expect(screen.getByText("Review your deal")).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Cheese Pizza - Large/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as unknown[]

    expect(storedCart[0]).toMatchObject({
      cartItemId: "deal-cart-1",
      totalPrice: 24.99,
      components: [
        {
          componentId: "component-1",
          children: [
            {
              childLineId: "child-1",
              productId: "product-1",
              variantId: "large",
              childExtraTotal: 0,
            },
          ],
        },
      ],
    })
  })

  it("charges extra quantity units on a deal child", async () => {
    render(
      <ThemedToastProvider>
        <CartProvider>
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /customize/i }))
    fireEvent.click(await screen.findByText("Return quantity two child"))

    await waitFor(() => {
      expect(screen.getByText("Review your deal")).toBeInTheDocument()
    })
    expect(screen.getAllByText("$39.99").length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as DealCartItem[]

    expect(storedCart[0]).toMatchObject({
      childExtraTotal: 15,
      totalPrice: 39.99,
      components: [
        {
          children: [
            {
              quantity: 2,
              configuredLineTotal: 30,
              childExtraTotal: 15,
            },
          ],
        },
      ],
    })
  })

  it("uses first required modifier options when adding a deal child without customization", async () => {
    getProductConfigMock.mockResolvedValue(requiredModifierProductConfig)

    render(
      <ThemedToastProvider>
        <CartProvider>
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /add to deal/i }))

    await waitFor(() => {
      expect(screen.getByText("Review your deal")).toBeInTheDocument()
    })
    expect(screen.queryByText(/Allowed variants:/)).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as Array<{
      components?: Array<{
        children?: Array<{
          modifiers?: Array<{ optionId: string; optionName: string }>
        }>
      }>
    }>

    expect(
      storedCart[0]?.components?.[0]?.children?.[0]?.modifiers
    ).toContainEqual(
      expect.objectContaining({
        optionId: "thin-crust",
        optionName: "Thin",
      })
    )
  })

  it("loads an existing deal cart item and updates it instead of adding another item", async () => {
    const editingDealItem: DealCartItem = {
      cartItemId: "existing-deal-cart-id",
      itemType: "deal",
      businessId: "business-1",
      businessSlug: "demo",
      locationId: null,
      locationSlug: null,
      specialId: "deal-1",
      specialName: "Family Deal",
      dealBasePrice: 24.99,
      childExtraTotal: 0,
      totalPrice: 24.99,
      components: [
        {
          componentId: "component-1",
          componentLabel: "Choose a pizza",
          sortOrder: 1,
          requiredQuantity: 1,
          selectedQuantity: 1,
          children: [
            {
              childLineId: "existing-child-id",
              productId: "product-1",
              productName: "Cheese Pizza",
              variantId: "large",
              variantName: "Large",
              quantity: 1,
              configuredLineTotal: 12,
              childExtraTotal: 0,
              modifiers: [],
            },
          ],
        },
      ],
    }

    render(
      <ThemedToastProvider>
        <CartProvider>
          <SeedDealOnMount item={editingDealItem} />
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
            editingDealItem={editingDealItem}
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()
    expect(await screen.findByText("Review your deal")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as DealCartItem[]

    expect(storedCart).toHaveLength(1)
    expect(storedCart[0]).toMatchObject({
      cartItemId: "existing-deal-cart-id",
      itemType: "deal",
      totalPrice: 24.99,
      components: [
        {
          componentId: "component-1",
          children: [
            {
              childLineId: "existing-child-id",
              productId: "product-1",
            },
          ],
        },
      ],
    })
    expect(screen.getByText("Family Deal updated")).toBeInTheDocument()
  })

  it("does not double-charge extra child quantity when editing a deal", async () => {
    const editingDealItem: DealCartItem = {
      cartItemId: "existing-deal-cart-id",
      itemType: "deal",
      businessId: "business-1",
      businessSlug: "demo",
      locationId: null,
      locationSlug: null,
      specialId: "deal-1",
      specialName: "Family Deal",
      dealBasePrice: 24.99,
      childExtraTotal: 15,
      totalPrice: 39.99,
      components: [
        {
          componentId: "component-1",
          componentLabel: "Choose a pizza",
          sortOrder: 1,
          requiredQuantity: 1,
          selectedQuantity: 1,
          children: [
            {
              childLineId: "existing-child-id",
              productId: "product-1",
              productName: "Cheese Pizza",
              variantId: "large",
              variantName: "Large",
              quantity: 2,
              configuredLineTotal: 30,
              childExtraTotal: 15,
              modifiers: [],
            },
          ],
        },
      ],
    }

    render(
      <ThemedToastProvider>
        <CartProvider>
          <SeedDealOnMount item={editingDealItem} />
          <DealBuilder
            open
            onOpenChange={() => undefined}
            businessSlug="demo"
            specialId="deal-1"
            editingDealItem={editingDealItem}
          />
        </CartProvider>
      </ThemedToastProvider>
    )

    expect(await screen.findByText("Family Deal")).toBeInTheDocument()
    expect(await screen.findByText("Review your deal")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /add deal to cart/i })[0])

    const storedCart = JSON.parse(
      window.localStorage.getItem("menupilot-cart") ?? "[]"
    ) as DealCartItem[]

    expect(storedCart).toHaveLength(1)
    expect(storedCart[0]).toMatchObject({
      cartItemId: "existing-deal-cart-id",
      childExtraTotal: 15,
      totalPrice: 39.99,
      components: [
        {
          children: [
            {
              quantity: 2,
              configuredLineTotal: 30,
              childExtraTotal: 15,
            },
          ],
        },
      ],
    })
  })
})
