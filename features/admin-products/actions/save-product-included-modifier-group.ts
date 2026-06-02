"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { buildProductIncludedModifierGroupPayload } from "@/features/admin-products/utils/build-product-included-modifier-group-payload"
import {
  saveProductIncludedModifierGroupRecord,
  type IncludedModifierGroupStore,
} from "@/features/admin-products/utils/save-product-included-modifier-group-record"

const BUSINESS_SLUG = "pronto-demo"

export type SaveProductIncludedModifierGroupResult =
  | {
      ok: true
      message: string
      savedAt: number
    }
  | {
      ok: false
      message: string
      savedAt: number
    }

async function getBusinessId() {
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .single()

  if (error || !business) {
    throw new Error("Could not load product business.")
  }

  return business.id as string
}

async function assertProductModifierAssignment({
  businessId,
  productId,
  modifierGroupId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
}) {
  const { data, error } = await supabaseAdmin
    .from("product_modifier_groups")
    .select("id")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)
    .single()

  if (error || !data) {
    throw new Error("Selected modifier group assignment is invalid.")
  }
}

function revalidateProductModifierPaths(productId: string) {
  revalidatePath("/admin/products")
  revalidatePath("/admin/products/modifier-groups")
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/menu")
}

async function clearIncludedRule({
  businessId,
  productId,
  modifierGroupId,
}: {
  businessId: string
  productId: string
  modifierGroupId: string
}) {
  const { error } = await supabaseAdmin
    .from("product_included_modifier_groups")
    .delete()
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("modifier_group_id", modifierGroupId)

  if (error) {
    throw new Error(`Could not clear included selections: ${error.message}`)
  }
}

function createIncludedModifierGroupStore(): IncludedModifierGroupStore {
  return {
    async findExisting({ businessId, productId, modifierGroupId }) {
      const { data, error } = await supabaseAdmin
        .from("product_included_modifier_groups")
        .select("id, product_id, modifier_group_id")
        .eq("business_id", businessId)
        .eq("product_id", productId)
        .eq("modifier_group_id", modifierGroupId)
        .maybeSingle()

      if (error) {
        throw new Error(`Could not load included selections: ${error.message}`)
      }

      return data
        ? {
            id: data.id as string,
            product_id: data.product_id as string,
            modifier_group_id: data.modifier_group_id as string,
          }
        : null
    },
    async insert({
      businessId,
      productId,
      modifierGroupId,
      includedQuantity,
      chargeForExtra,
    }) {
      const { error } = await supabaseAdmin
        .from("product_included_modifier_groups")
        .insert({
          business_id: businessId,
          product_id: productId,
          modifier_group_id: modifierGroupId,
          included_quantity: includedQuantity,
          is_swappable: false,
          charge_for_extra: chargeForExtra,
        })

      if (error) {
        throw new Error(`Could not save included selections: ${error.message}`)
      }
    },
    async update({ id, businessId, includedQuantity, chargeForExtra }) {
      const { error } = await supabaseAdmin
        .from("product_included_modifier_groups")
        .update({
          included_quantity: includedQuantity,
          charge_for_extra: chargeForExtra,
        })
        .eq("id", id)
        .eq("business_id", businessId)

      if (error) {
        throw new Error(`Could not update included selections: ${error.message}`)
      }
    },
    async clear({ businessId, productId, modifierGroupId }) {
      await clearIncludedRule({
        businessId,
        productId,
        modifierGroupId,
      })
    },
  }
}

export async function saveProductIncludedModifierGroup(
  formData: FormData
): Promise<SaveProductIncludedModifierGroupResult> {
  try {
    const businessId = await getBusinessId()
    const payload = buildProductIncludedModifierGroupPayload(formData)

    await assertProductModifierAssignment({
      businessId,
      productId: payload.productId,
      modifierGroupId: payload.modifierGroupId,
    })

    await saveProductIncludedModifierGroupRecord({
      businessId,
      payload,
      store: createIncludedModifierGroupStore(),
    })

    revalidateProductModifierPaths(payload.productId)

    return {
      ok: true,
      message:
        payload.action === "clear"
          ? "Included selections cleared."
          : "Included selections saved.",
      savedAt: Date.now(),
    }
  } catch (error) {
    console.error(error)

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not save included selections.",
      savedAt: Date.now(),
    }
  }
}

export async function saveProductIncludedModifierGroupAction(
  _previousState: SaveProductIncludedModifierGroupResult | null,
  formData: FormData
) {
  return saveProductIncludedModifierGroup(formData)
}
