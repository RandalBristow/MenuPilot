"use client";

import { useState } from "react";
import { useCart } from "@/features/cart/context/CartProvider";
import { getCartSubtotal } from "@/features/cart/utils/cart-items";
import { createOrder } from "@/features/checkout/actions/create-order";
import {
  calculateCheckoutTotals,
  type CheckoutTotals,
} from "@/features/checkout/utils/calculate-checkout-totals";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { ThemedButton } from "@/components/themed/ThemedButton";
import Link from "next/link";
import {
  DEFAULT_BUSINESS_PRICING_SETTINGS,
  type BusinessPricingSettings,
} from "@/lib/pricing/business-pricing-settings";

type CheckoutPageProps = {
  businessSlug?: string | null
  businessName?: string | null
  locationName?: string | null
  menuHref?: string
  orderBlockedReason?: string | null
  pricingSettings?: BusinessPricingSettings
}

export function CheckoutPage({
  businessSlug = null,
  businessName = null,
  locationName = null,
  menuHref = "/menu",
  orderBlockedReason = null,
  pricingSettings = DEFAULT_BUSINESS_PRICING_SETTINGS,
}: CheckoutPageProps) {
  const { items, clearCart } = useCart();
  const effectiveOrderBlockedReason = orderBlockedReason;
  const subtotal = getCartSubtotal(items);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [confirmationTotals, setConfirmationTotals] =
    useState<CheckoutTotals | null>(null);
  const estimatedTotals = calculateCheckoutTotals({
    subtotal,
    settings: pricingSettings,
    tipTotal: pricingSettings.tipsEnabled ? tipAmount : 0,
  });
  const statusHref =
    businessSlug && orderNumber
      ? `/businesses/${encodeURIComponent(businessSlug)}/orders/${encodeURIComponent(orderNumber)}`
      : null

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
        tipAmount,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      clearCart();
      setOrderNumber(result.orderNumber);
      setConfirmationTotals(result.totals ?? estimatedTotals);
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
          {confirmationTotals ? (
            <div className="mx-auto mt-5 max-w-xs space-y-2 rounded-lg border p-3 text-sm">
              {confirmationTotals.discountTotal > 0 ? (
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Discounts</span>
                  <span>-${confirmationTotals.discountTotal.toFixed(2)}</span>
                </div>
              ) : null}
              {confirmationTotals.serviceFeeTotal > 0 ? (
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Service fee</span>
                  <span>${confirmationTotals.serviceFeeTotal.toFixed(2)}</span>
                </div>
              ) : null}
              {confirmationTotals.taxTotal > 0 ? (
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Tax</span>
                  <span>${confirmationTotals.taxTotal.toFixed(2)}</span>
                </div>
              ) : null}
              {confirmationTotals.tipTotal > 0 ? (
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Tip</span>
                  <span>${confirmationTotals.tipTotal.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
                <span>Total</span>
                <span>${confirmationTotals.total.toFixed(2)}</span>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {statusHref ? (
              <ThemedButton asChild>
                <Link href={statusHref}>View order status</Link>
              </ThemedButton>
            ) : null}
            <ThemedButton asChild variant="outline">
              <Link href={menuHref}>Back to Menu</Link>
            </ThemedButton>
          </div>
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
          {effectiveOrderBlockedReason ? (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {effectiveOrderBlockedReason}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <CheckoutForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSubmitBlocked={Boolean(effectiveOrderBlockedReason)}
            errorMessage={submitError}
          />

          <CheckoutOrderSummary
            items={items}
            subtotal={subtotal}
            totals={estimatedTotals}
            pricingSettings={pricingSettings}
            tipAmount={tipAmount}
            onTipAmountChange={setTipAmount}
          />
        </div>
      </div>
    </main>
  );
}
