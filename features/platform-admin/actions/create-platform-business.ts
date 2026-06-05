"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  createPlatformBusinessWithLocationRecord,
  type PlatformBusinessCreateResult,
  type PlatformBusinessInsertPayload,
  type PlatformLocationInsertPayload,
} from "@/features/platform-admin/utils/create-platform-business"

export type CreatePlatformBusinessActionState = PlatformBusinessCreateResult

async function findBusinessBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not check business slug: ${error.message}`)
  }

  return data ? { id: data.id as string } : null
}

async function insertBusiness(business: PlatformBusinessInsertPayload) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .insert(business)
    .select("id")
    .single()

  if (error || !data) {
    throw new Error(`Could not create business: ${error?.message}`)
  }

  return { id: data.id as string }
}

async function insertLocation(location: PlatformLocationInsertPayload) {
  const { error } = await supabaseAdmin.from("locations").insert(location)

  if (error) {
    throw new Error(`Could not create first location: ${error.message}`)
  }
}

async function deleteBusiness(businessId: string) {
  const { error } = await supabaseAdmin
    .from("businesses")
    .delete()
    .eq("id", businessId)

  if (error) {
    throw new Error(`Could not clean up business: ${error.message}`)
  }
}

export async function createPlatformBusinessWithLocation(
  _previousState: CreatePlatformBusinessActionState,
  formData: FormData
): Promise<CreatePlatformBusinessActionState> {
  const result = await createPlatformBusinessWithLocationRecord(
    {
      findBusinessBySlug,
      insertBusiness,
      insertLocation,
      deleteBusiness,
    },
    formData
  )

  if (result.ok) {
    revalidatePath("/platform/businesses")
    revalidatePath(`/platform/businesses/${result.businessId}`)
  }

  return result
}
