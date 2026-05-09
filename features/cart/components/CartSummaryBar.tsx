"use client";

import { useState } from "react";
import { ThemedButton } from "@/components/themed/ThemedButton";
import { ThemedCard } from "@/components/themed/ThemedCard";
import Link from "next/link";
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
  ThemedSheetTrigger,
} from "@/components/themed/ThemedSheet";
import { useCart } from "@/features/cart/context/CartProvider";
import type { CartModifier } from "@/features/cart/types/cart";

type ModifierGroup = {
  groupId: string;
  groupName: string;
  modifiers: CartModifier[];
};

function groupModifiers(modifiers: CartModifier[]) {
  return modifiers.reduce<ModifierGroup[]>((groups, modifier) => {
    const group = groups.find((item) => item.groupId === modifier.groupId);

    if (group) {
      group.modifiers.push(modifier);
      return groups;
    }

    return [
      ...groups,
      {
        groupId: modifier.groupId,
        groupName: modifier.groupName,
        modifiers: [modifier],
      },
    ];
  }, []);
}

function formatPlacement(placement: CartModifier["placement"]) {
  if (placement === "whole") return null;

  return placement.charAt(0).toUpperCase() + placement.slice(1);
}

export function CartSummaryBar() {
  const { items, itemCount, subtotal, removeItem, clearCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (itemCount === 0 && !isCartOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-4 py-3 shadow-lg sm:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {itemCount === 0
              ? "Cart empty"
              : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Subtotal: ${subtotal.toFixed(2)}
          </p>
        </div>

        <ThemedSheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <ThemedSheetTrigger asChild>
            <ThemedButton className="shrink-0">View Cart</ThemedButton>
          </ThemedSheetTrigger>

          <ThemedSheetContent className="flex h-dvh w-full max-w-full flex-col gap-0 p-0 sm:max-w-md md:max-w-lg">
            <ThemedSheetHeader className="border-b px-4 py-4 pr-12">
              <ThemedSheetTitle>Your Cart</ThemedSheetTitle>
              <ThemedSheetDescription>
                Review your order before checkout.
              </ThemedSheetDescription>
            </ThemedSheetHeader>

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
                  {items.map((item) => (
                    <ThemedCard key={item.cartItemId} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold leading-tight">
                              {item.productName}
                            </h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Qty {item.quantity}
                            </span>
                          </div>

                          {item.variantName ? (
                            <p className="text-sm text-muted-foreground">
                              {item.variantName}
                            </p>
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

                      {item.modifiers.length > 0 ? (
                        <div className="space-y-3 border-t pt-3">
                          {groupModifiers(item.modifiers).map((group) => (
                            <div key={group.groupId} className="border-l pl-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                {group.groupName}
                              </p>
                              <div className="mt-1 space-y-1">
                                {group.modifiers.map((modifier) => {
                                  const placement = formatPlacement(
                                    modifier.placement,
                                  );

                                  return (
                                    <div
                                      key={`${item.cartItemId}-${modifier.optionId}`}
                                      className="flex justify-between gap-3 text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        {modifier.optionName}
                                        {placement ? ` (${placement})` : ""}
                                        {modifier.multiplier > 1
                                          ? ` x${modifier.multiplier}`
                                          : ""}
                                      </span>
                                      {modifier.priceDelta > 0 ? (
                                        <span className="shrink-0 text-muted-foreground">
                                          +${modifier.priceDelta.toFixed(2)}
                                        </span>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex justify-end border-t pt-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-sm font-medium text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    </ThemedCard>
                  ))}
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
                    <Link href="/checkout">Continue to Checkout</Link>
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
      </div>
    </div>
  );
}
