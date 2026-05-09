"use client"

import { useMemo, useState } from "react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type CheckoutFormData = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  fulfillmentType: "pickup" | "delivery"
  specialInstructions?: string
}

type CheckoutFormProps = {
  onSubmit: (formData: CheckoutFormData) => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string | null
}

export function CheckoutForm({
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">(
    "pickup"
  )
  const [specialInstructions, setSpecialInstructions] = useState("")

  const canSubmit = useMemo(() => {
    return customerName.trim().length > 0 && customerPhone.trim().length > 0
  }, [customerName, customerPhone])

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || isSubmitting) return

    onSubmit({
      customerName,
      customerPhone,
      customerEmail,
      fulfillmentType,
      specialInstructions,
    })
  }

  return (
    <ThemedCard className="p-6">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Customer details</h2>
          <p className="mt-1 text-muted-foreground">
            We will use this information for your order.
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Jane Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="(555) 123-4567"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email optional</Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="jane@example.com"
          />
        </div>

        <div className="space-y-3">
          <Label>Fulfillment</Label>

          <RadioGroup
            value={fulfillmentType}
            onValueChange={(value: string) =>
              setFulfillmentType(value as "pickup" | "delivery")
            }
            className="grid gap-3 sm:grid-cols-2"
          >
            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem value="pickup" />
              <span>
                <span className="block font-semibold">Pickup</span>
                <span className="text-sm text-muted-foreground">
                  Pick up at the restaurant.
                </span>
              </span>
            </Label>

            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
              <RadioGroupItem value="delivery" />
              <span>
                <span className="block font-semibold">Delivery</span>
                <span className="text-sm text-muted-foreground">
                  Delivery details will be added later.
                </span>
              </span>
            </Label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialInstructions">Order notes optional</Label>
          <Textarea
            id="specialInstructions"
            value={specialInstructions}
            onChange={(event) => setSpecialInstructions(event.target.value)}
            placeholder="Add any notes for the restaurant."
            rows={5}
          />
        </div>

        <ThemedButton
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="h-11 w-full"
        >
          {isSubmitting ? "Placing order..." : "Place Order"}
        </ThemedButton>
      </form>
    </ThemedCard>
  )
}