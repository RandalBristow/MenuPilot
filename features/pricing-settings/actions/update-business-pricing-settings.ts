"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  type ServiceFeeType,
  type PizzaHalfToppingRoundingMode,
  mapBusinessPricingSettingsToRow,
  normalizeBusinessPricingSettings,
} from "@/lib/pricing/business-pricing-settings"

export type UpdateBusinessPricingSettingsResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
    }

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Required pricing settings data is missing.")
  }

  return value
}

function parseNonnegativeNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value ?? 0)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be 0 or greater.`)
  }

  return parsed
}

function parseServiceFeeType(value: FormDataEntryValue | null): ServiceFeeType {
  if (value === "fixed" || value === "percentage" || value === "none") {
    return value
  }

  throw new Error("Service fee type is not valid.")
}

export async function updateBusinessPricingSettings(
  formData: FormData
): Promise<UpdateBusinessPricingSettingsResult> {
  try {
    const businessId = getRequiredString(formData, "businessId")
    const businessSlug = getRequiredString(formData, "businessSlug")
    const submittedRoundingMode = formData.get("pizzaHalfToppingRoundingMode")
    const roundingMode: PizzaHalfToppingRoundingMode =
      submittedRoundingMode === "floor_to_cent"
        ? submittedRoundingMode
        : "floor_to_cent"
    const settings = normalizeBusinessPricingSettings({
      pizzaHalfToppingPricingEnabled:
        formData.get("pizzaHalfToppingPricingEnabled") === "true",
      pizzaHalfToppingIncludedWeightEnabled:
        formData.get("pizzaHalfToppingIncludedWeightEnabled") === "true",
      pizzaHalfToppingRoundingMode: roundingMode,
      salesTaxRatePercent: parseNonnegativeNumber(
        formData.get("salesTaxRatePercent"),
        "Sales tax rate"
      ),
      serviceFeeType: parseServiceFeeType(formData.get("serviceFeeType")),
      serviceFeeValue: parseNonnegativeNumber(
        formData.get("serviceFeeValue"),
        "Service fee"
      ),
      tipsEnabled: formData.get("tipsEnabled") === "true",
    })

    const { error } = await supabaseAdmin
      .from("business_pricing_settings")
      .upsert(
        {
          business_id: businessId,
          ...mapBusinessPricingSettingsToRow(settings),
        },
        {
          onConflict: "business_id",
        }
      )

    if (error) {
      throw new Error(`Could not save pricing settings: ${error.message}`)
    }

    revalidatePath(`/platform/businesses/${businessId}`)
    revalidatePath(`/businesses/${businessSlug}/admin`)
    revalidatePath(`/businesses/${businessSlug}/menu`)

    return {
      ok: true,
      message: "Pricing settings saved.",
    }
  } catch (error) {
    console.error(error)

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not save pricing settings.",
    }
  }
}
