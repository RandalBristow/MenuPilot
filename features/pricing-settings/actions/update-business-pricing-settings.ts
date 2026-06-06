"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
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
