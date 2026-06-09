"use client"

import { useState, type ReactElement } from "react"
import Link from "next/link"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet"
import { useCart } from "@/features/cart/context/CartProvider"
import type {
  CartModifier,
  ConfiguredCartItem,
  DealCartChildItem,
  DealCartItem,
} from "@/features/cart/types/cart"
import {
  ProductConfigurator,
  type ProductConfig,
} from "@/features/product-configurator/components/ProductConfigurator"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"
import { DealBuilder } from "@/features/specials/components/DealBuilder"
import {
  isConfiguredCartItem,
  isDealCartItem,
} from "@/features/cart/utils/cart-items"

type CartSheetProps = {
  trigger: ReactElement
  checkoutHref?: string
}

type ModifierGroup = {
  groupId: string
  groupName: string
  modifiers: CartModifier[]
}

function groupModifiers(modifiers: CartModifier[]) {
  return modifiers.reduce<ModifierGroup[]>((groups, modifier) => {
    const group = groups.find((item) => item.groupId === modifier.groupId)

    if (group) {
      group.modifiers.push(modifier)
      return groups
    }

    return [
      ...groups,
      {
        groupId: modifier.groupId,
        groupName: modifier.groupName,
        modifiers: [modifier],
      },
    ]
  }, [])
}

function formatPlacement(placement: CartModifier["placement"]) {
  if (placement === "whole") return null

  return placement.charAt(0).toUpperCase() + placement.slice(1)
}

function formatDealChildPricing(child: DealCartChildItem) {
  if (child.componentPricingMode === "fixed_price") {
    const price = child.componentBasePrice ?? child.componentFixedPrice ?? 0

    return `Fixed price $${price.toFixed(2)}`
  }

  if (child.componentPricingMode === "normal_price") {
    return "Normal product price"
  }

  if (child.componentPricingMode === "included") {
    return "Included"
  }

  return null
}

function ModifierDetails({
  modifiers,
  itemKey,
}: {
  modifiers: CartModifier[]
  itemKey: string
}) {
  if (modifiers.length === 0) return null

  return (
    <div className="space-y-3 border-t pt-3">
      {groupModifiers(modifiers).map((group) => (
        <div key={`${itemKey}-${group.groupId}`} className="border-l pl-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {group.groupName}
          </p>
          <div className="mt-1 space-y-1">
            {group.modifiers.map((modifier) => {
              const placement = formatPlacement(modifier.placement)

              return (
                <div
                  key={`${itemKey}-${modifier.optionId}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {modifier.optionName}
                    {placement ? ` (${placement})` : ""}
                    {modifier.multiplier > 1 ? ` x${modifier.multiplier}` : ""}
                  </span>
                  {modifier.priceDelta > 0 ? (
                    <span className="shrink-0 text-muted-foreground">
                      +${modifier.priceDelta.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function DealChildLine({ child }: { child: DealCartChildItem }) {
  const pricing = formatDealChildPricing(child)

  return (
    <div className="space-y-2 rounded-lg border bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{child.productName}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>Qty {child.quantity}</span>
            {child.variantName ? <span>{child.variantName}</span> : null}
          </div>
          {pricing ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {pricing}
            </p>
          ) : null}
        </div>

        {child.childExtraTotal > 0 ? (
          <p className="shrink-0 text-sm font-semibold">
            +${child.childExtraTotal.toFixed(2)}
          </p>
        ) : null}
      </div>

      <ModifierDetails modifiers={child.modifiers} itemKey={child.childLineId} />
    </div>
  )
}

function DealCartItemCard({
  item,
  onEdit,
  onRemove,
}: {
  item: DealCartItem
  onEdit: (item: DealCartItem) => void
  onRemove: (cartItemId: string) => void
}) {
  const sortedComponents = [...item.components].sort(
    (left, right) => left.sortOrder - right.sortOrder
  )
  const isMixAndMatch = item.specialType === "mix_and_match_fixed_unit_price"
  const label = isMixAndMatch ? "Mix & Match" : "Deal"
  const summary = isMixAndMatch
    ? item.ruleSummary ??
      `${item.selectedQuantity ?? 0} selected at ${
        item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "one fixed price"
      } each`
    : `${item.usesComponentPricing ? "Component base" : "Base"} $${item.dealBasePrice.toFixed(2)}${
        item.childExtraTotal > 0
          ? ` + ${item.childExtraTotal.toFixed(2)} extras`
          : ""
      }`

  return (
    <ThemedCard className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-tight">{item.specialName}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{summary}</p>
          {isMixAndMatch && item.childExtraTotal > 0 ? (
            <p className="text-xs text-muted-foreground">
              Extras +${item.childExtraTotal.toFixed(2)}
            </p>
          ) : null}
        </div>

        <p className="shrink-0 text-right font-semibold leading-tight">
          ${item.totalPrice.toFixed(2)}
        </p>
      </div>

      <div className="space-y-3 border-t pt-3">
        {sortedComponents.map((component) => (
          <div key={component.componentId} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {component.componentLabel}
              </p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {component.selectedQuantity}/{component.requiredQuantity}
              </p>
            </div>

            <div className="space-y-2">
              {component.children.map((child) => (
                <DealChildLine key={child.childLineId} child={child} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t pt-3">
        {!isMixAndMatch ? (
          <ThemedButton
            type="button"
            variant="link"
            onClick={() => onEdit(item)}
            className="mr-4 h-auto bg-transparent p-0 text-sm font-medium text-foreground hover:bg-transparent"
          >
            Customize
          </ThemedButton>
        ) : null}

        <ThemedButton
          type="button"
          variant="link"
          onClick={() => onRemove(item.cartItemId)}
          className="h-auto bg-transparent p-0 text-sm font-medium text-destructive hover:bg-transparent"
        >
          Remove
        </ThemedButton>
      </div>
    </ThemedCard>
  )
}

function ConfiguredCartItemCard({
  item,
  loadingEditItemId,
  onEdit,
  onRemove,
}: {
  item: ConfiguredCartItem
  loadingEditItemId: string | null
  onEdit: (item: ConfiguredCartItem) => void
  onRemove: (cartItemId: string) => void
}) {
  return (
    <ThemedCard className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-tight">{item.productName}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Qty {item.quantity}
            </span>
          </div>

          {item.variantName ? (
            <p className="text-sm text-muted-foreground">{item.variantName}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold leading-tight">
            ${item.totalPrice.toFixed(2)}
          </p>
          {item.quantity > 1 ? (
            <p className="text-xs text-muted-foreground">
              ${item.unitPrice.toFixed(2)} each
            </p>
          ) : null}
        </div>
      </div>

      <ModifierDetails modifiers={item.modifiers} itemKey={item.cartItemId} />

      <div className="flex justify-end border-t pt-3">
        <ThemedButton
          type="button"
          variant="link"
          onClick={() => onEdit(item)}
          disabled={loadingEditItemId === item.cartItemId}
          className="mr-4 h-auto bg-transparent p-0 text-sm font-medium text-foreground hover:bg-transparent"
        >
          {loadingEditItemId === item.cartItemId ? "Loading..." : "Edit"}
        </ThemedButton>

        <ThemedButton
          type="button"
          variant="link"
          onClick={() => onRemove(item.cartItemId)}
          className="h-auto bg-transparent p-0 text-sm font-medium text-destructive hover:bg-transparent"
        >
          Remove
        </ThemedButton>
      </div>
    </ThemedCard>
  )
}

export function CartSheet({ trigger, checkoutHref = "/checkout" }: CartSheetProps) {
  const { items, subtotal, removeItem, clearCart } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConfiguredCartItem | null>(
    null
  )
  const [editingProduct, setEditingProduct] = useState<ProductConfig | null>(
    null
  )
  const [editingDealItem, setEditingDealItem] = useState<DealCartItem | null>(
    null
  )
  const [loadingEditItemId, setLoadingEditItemId] = useState<string | null>(
    null
  )
  const [editError, setEditError] = useState<string | null>(null)

  async function handleEditItem(item: ConfiguredCartItem) {
    if (loadingEditItemId) return

    setEditError(null)
    setLoadingEditItemId(item.cartItemId)

    try {
      const config = await getProductConfig(item.productId, {
        businessSlug: item.businessSlug,
      })

      setEditingProduct(config as unknown as ProductConfig)
      setEditingItem(item)
      setIsCartOpen(false)
    } catch (error) {
      console.error("Failed to load cart item config:", error)
      setEditError("Could not load this item. Please try again.")
    } finally {
      setLoadingEditItemId(null)
    }
  }

  function handleEditOpenChange(open: boolean) {
    if (open) return

    setEditingItem(null)
    setEditingProduct(null)
  }

  function handleEditDealItem(item: DealCartItem) {
    setEditingDealItem(item)
    setIsCartOpen(false)
  }

  function handleDealEditOpenChange(open: boolean) {
    if (open) return

    setEditingDealItem(null)
  }

  return (
    <>
      <ThemedSheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <ThemedSheetTrigger asChild>{trigger}</ThemedSheetTrigger>

        <ThemedSheetContent className="flex h-dvh w-full max-w-full flex-col gap-0 p-0 sm:max-w-md md:max-w-lg">
          <ThemedSheetHeader className="border-b px-4 py-4 pr-12">
            <ThemedSheetTitle>Your Cart</ThemedSheetTitle>
            <ThemedSheetDescription>
              Review your order before checkout.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          {editError ? (
            <p className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </p>
          ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <div className="space-y-2">
                <p className="font-semibold">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add a menu item and it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                if (isDealCartItem(item)) {
                  return (
                    <DealCartItemCard
                      key={item.cartItemId}
                      item={item}
                      onEdit={handleEditDealItem}
                      onRemove={removeItem}
                    />
                  )
                }

                if (isConfiguredCartItem(item)) {
                  return (
                    <ConfiguredCartItemCard
                      key={item.cartItemId}
                      item={item}
                      loadingEditItemId={loadingEditItemId}
                      onEdit={handleEditItem}
                      onRemove={removeItem}
                    />
                  )
                }

                return null
              })}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="space-y-4 border-t bg-background p-4">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="border-t" />

            <div className="grid gap-2">
              <ThemedButton asChild className="h-11 w-full">
                <Link href={checkoutHref}>Continue to Checkout</Link>
              </ThemedButton>

              <ThemedButton
                type="button"
                variant="outline"
                className="h-11 w-full bg-background text-foreground hover:bg-muted"
                onClick={clearCart}
              >
                Clear Cart
              </ThemedButton>
            </div>
          </div>
        ) : null}
        </ThemedSheetContent>
      </ThemedSheet>

      {editingProduct && editingItem ? (
        <ProductConfigurator
          key={editingItem.cartItemId}
          product={editingProduct}
          open={Boolean(editingProduct && editingItem)}
          onOpenChange={handleEditOpenChange}
          mode="edit"
          cartItem={editingItem}
          businessSlug={editingItem.businessSlug}
        />
      ) : null}

      {editingDealItem ? (
        <DealBuilder
          open={Boolean(editingDealItem)}
          onOpenChange={handleDealEditOpenChange}
          businessSlug={editingDealItem.businessSlug}
          businessId={editingDealItem.businessId}
          specialId={editingDealItem.specialId}
          editingDealItem={editingDealItem}
        />
      ) : null}
    </>
  )
}
