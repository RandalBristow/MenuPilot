"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import { updateBusinessPricingSettings } from "@/features/pricing-settings/actions/update-business-pricing-settings"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"

type BusinessPricingSettingsFormProps = {
  businessId: string
  businessSlug: string
  settings: BusinessPricingSettings
}

function CheckboxSetting({
  name,
  label,
  description,
  checked,
}: {
  name: string
  label: string
  description: string
  checked: boolean
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={checked}
        className="mt-1 size-4 rounded border"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}

export function BusinessPricingSettingsForm({
  businessId,
  businessSlug,
  settings,
}: BusinessPricingSettingsFormProps) {
  const router = useRouter()
  const { showToast } = useThemedToast()
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceFeeType, setServiceFeeType] = useState(settings.serviceFeeType)

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateBusinessPricingSettings(formData)

      if (!result.ok) {
        setError(result.message)
        return
      }

      showToast({
        title: result.message,
        kind: "success",
      })
      router.refresh()
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="businessSlug" value={businessSlug} />
      <input
        type="hidden"
        name="pizzaHalfToppingRoundingMode"
        value={settings.pizzaHalfToppingRoundingMode}
      />

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <CheckboxSetting
        name="pizzaHalfToppingPricingEnabled"
        label="Half toppings use half price"
        description="Left- or right-side pizza toppings charge half the effective modifier price."
        checked={settings.pizzaHalfToppingPricingEnabled}
      />

      <CheckboxSetting
        name="pizzaHalfToppingIncludedWeightEnabled"
        label="Half toppings consume half an included slot"
        description="Left- or right-side pizza toppings count as 0.5 selections toward included topping limits."
        checked={settings.pizzaHalfToppingIncludedWeightEnabled}
      />

      <p className="text-xs leading-5 text-muted-foreground">
        Pizza half-topping charges use floor-to-cent rounding after placement
        weight and multiplier are applied.
      </p>

      <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Sales tax rate %</span>
          <input
            name="salesTaxRatePercent"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={settings.salesTaxRatePercent}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Service fee type</span>
          <select
            name="serviceFeeType"
            value={serviceFeeType}
            onChange={(event) =>
              setServiceFeeType(
                event.target.value as typeof settings.serviceFeeType
              )
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="none">No service fee</option>
            <option value="fixed">Fixed amount</option>
            <option value="percentage">Percentage</option>
          </select>
        </label>

        {serviceFeeType !== "none" ? (
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">
              Service fee {serviceFeeType === "percentage" ? "%" : "amount"}
            </span>
            <input
              name="serviceFeeValue"
              type="number"
              min="0"
              step={serviceFeeType === "percentage" ? "0.0001" : "0.01"}
              defaultValue={settings.serviceFeeValue}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>
        ) : (
          <input type="hidden" name="serviceFeeValue" value="0" />
        )}
      </div>

      <CheckboxSetting
        name="tipsEnabled"
        label="Enable checkout tips"
        description="Checkout shows no tip plus 10%, 15%, and 20% preset tip options."
        checked={settings.tipsEnabled}
      />

      <div className="flex justify-end">
        <ThemedButton
          type="submit"
          disabled={isSubmitting}
          className="h-9 gap-1.5"
        >
          <Check aria-hidden="true" className="size-4" />
          {isSubmitting ? "Saving..." : "Save"}
        </ThemedButton>
      </div>
    </form>
  )
}
