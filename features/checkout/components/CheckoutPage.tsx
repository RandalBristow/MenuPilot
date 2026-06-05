"use client";

import { useState } from "react";
import { useCart } from "@/features/cart/context/CartProvider";
import { createOrder } from "@/features/checkout/actions/create-order";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { ThemedButton } from "@/components/themed/ThemedButton";
import Link from "next/link";

type CheckoutPageProps = {
  businessSlug?: string | null
  businessName?: string | null
  locationName?: string | null
  menuHref?: string
  orderBlockedReason?: string | null
}

export function CheckoutPage({
  businessSlug = null,
  businessName = null,
  locationName = null,
  menuHref = "/menu",
  orderBlockedReason = null,
}: CheckoutPageProps) {
  const { items, clearCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  async function handleSubmit(formData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    fulfillmentType: "pickup" | "delivery";
    specialInstructions?: string;
  }) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await createOrder({
        ...formData,
        items,
        businessSlug,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      clearCart();
      setOrderNumber(result.orderNumber);
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error ? error.message : "Could not place order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
        <div className="rounded-xl border p-8 text-center">
          <h1 className="text-3xl font-bold">Order placed!</h1>
          <p className="mt-3 text-muted-foreground">Your order number is:</p>
          <p className="mt-4 text-2xl font-bold">{orderNumber}</p>

          <ThemedButton asChild className="mt-6">
            <Link href={menuHref}>Back to Menu</Link>
          </ThemedButton>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
        <div className="rounded-xl border p-8 text-center">
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Add something delicious before checking out.
          </p>

          <ThemedButton asChild className="mt-6">
            <Link href={menuHref}>View Menu</Link>
          </ThemedButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your details and review your order.
          </p>
          {businessName ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Ordering from <span className="font-medium text-foreground">{businessName}</span>
              {locationName ? (
                <>
                  {" "}
                  at <span className="font-medium text-foreground">{locationName}</span>
                </>
              ) : null}
              .
            </p>
          ) : null}
          {orderBlockedReason ? (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {orderBlockedReason}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <CheckoutForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSubmitBlocked={Boolean(orderBlockedReason)}
            errorMessage={submitError}
          />

          <CheckoutOrderSummary
            items={items}
            subtotal={items.reduce((sum, item) => sum + item.totalPrice, 0)}
          />
        </div>
      </div>
    </main>
  );
}
