"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LinkIcon, Unlink } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  detachProductVariantGroupAssignment,
  selectProductVariantGroupAssignment,
} from "@/features/admin-products/actions/save-product-variant-group-assignment"
import type {
  AssignableVariantGroup,
  ProductVariantAssignmentData,
} from "@/features/admin-products/queries/get-product-variant-assignments"
import {
  getProductListHref,
  getVariantGroupDetailHref,
} from "@/features/admin-products/utils/product-admin-routes"

type ProductVariantAssignmentsClientProps = {
  data: ProductVariantAssignmentData
  businessSlug?: string
  writesEnabled?: boolean
}

function getGroupDescription(group: AssignableVariantGroup) {
  return group.description ?? `${group.optionCount} options`
}

function VariantGroupCard({
  group,
  activeProductId,
  assignmentId,
  selected = false,
  onSelect,
  onDetach,
  businessSlug,
  writesEnabled,
}: {
  group: AssignableVariantGroup
  activeProductId: string
  assignmentId?: string
  selected?: boolean
  onSelect: (formData: FormData) => void
  onDetach: (formData: FormData) => void
  businessSlug?: string
  writesEnabled: boolean
}) {
  const groupHref = getVariantGroupDetailHref({
    groupId: group.id,
    productId: activeProductId,
    businessSlug,
  })

  return (
    <ThemedCard
      className={
        group.is_enabled
          ? "relative overflow-hidden p-0"
          : "relative overflow-hidden bg-muted/30 p-0 opacity-75"
      }
    >
      <Link
        href={groupHref}
        aria-label={`Open variant group ${group.name}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="px-3 py-2.5">
        <div>
          <div className="flex min-w-0 items-center gap-2">
            <CompactRecordStatusIcon
              enabled={group.is_enabled}
              enabledLabel={
                selected ? "Selected variant group" : "Variant group enabled"
              }
              disabledLabel="Variant group disabled"
            />
            <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
              {group.name}
            </div>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {getGroupDescription(group)}
          </p>
        </div>

        <div className="mt-1.5 flex justify-end">
          {selected ? (
            <form
              action={writesEnabled ? onDetach : undefined}
              className="relative z-10"
            >
              {businessSlug ? (
                <input type="hidden" name="businessSlug" value={businessSlug} />
              ) : null}
              <input type="hidden" name="productId" value={activeProductId} />
              <input
                type="hidden"
                name="assignmentId"
                value={assignmentId ?? ""}
              />
              <ThemedButton
                type="submit"
                disabled={!writesEnabled}
                size="icon"
                aria-label={`Remove ${group.name} from this product`}
                className="size-8"
              >
                <Unlink aria-hidden="true" />
                <span className="sr-only">Remove {group.name}</span>
              </ThemedButton>
            </form>
          ) : (
            <form
              action={writesEnabled ? onSelect : undefined}
              className="relative z-10"
            >
              {businessSlug ? (
                <input type="hidden" name="businessSlug" value={businessSlug} />
              ) : null}
              <input type="hidden" name="productId" value={activeProductId} />
              <input type="hidden" name="variantGroupId" value={group.id} />
              <ThemedButton
                type="submit"
                disabled={!writesEnabled}
                size="icon"
                variant="outline"
                aria-label={`Select ${group.name}`}
                className="size-8 bg-background text-foreground hover:bg-muted"
              >
                <LinkIcon aria-hidden="true" />
                <span className="sr-only">Select {group.name}</span>
              </ThemedButton>
            </form>
          )}
        </div>
      </div>
    </ThemedCard>
  )
}

export function ProductVariantAssignmentsClient({
  data,
  businessSlug,
  writesEnabled = true,
}: ProductVariantAssignmentsClientProps) {
  const router = useRouter()
  const {
    selectedProductId,
    selectedProductName,
    attachedGroups,
    availableGroups,
  } = data
  const [submitError, setSubmitError] = useState<string | null>(null)
  const activeProductId = selectedProductId ?? ""
  const activeProductName = selectedProductName ?? "this product"
  const selectedAssignment =
    attachedGroups.find((assignment) => assignment.is_enabled) ?? null

  async function handleSelect(formData: FormData) {
    setSubmitError(null)

    try {
      await selectProductVariantGroupAssignment(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not select variant group."
      )
    }
  }

  async function handleDetach(formData: FormData) {
    setSubmitError(null)

    try {
      await detachProductVariantGroupAssignment(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not remove variant group."
      )
    }
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${activeProductName} Variant Assignments`}
            description={`Attach reusable variant groups for ${data.businessName}.`}
          />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-3">
          {!activeProductId ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No product selected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open this page from a product card to manage assignments.
              </p>
            </ThemedCard>
          ) : (
            <>
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Selected Variant Group</h2>
                {!selectedAssignment ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No reusable group attached</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Attach a reusable group before this product can offer
                      variants.
                    </p>
                  </ThemedCard>
                ) : (
                  <VariantGroupCard
                    group={selectedAssignment.variantGroup}
                    activeProductId={activeProductId}
                    assignmentId={selectedAssignment.id}
                    selected
                    onSelect={handleSelect}
                    onDetach={handleDetach}
                    businessSlug={businessSlug}
                    writesEnabled={writesEnabled}
                  />
                )}
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Available Groups</h2>
                {availableGroups.length === 0 ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No groups available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All reusable variant groups are already attached.
                    </p>
                  </ThemedCard>
                ) : (
                  availableGroups.map((group) => (
                    <VariantGroupCard
                      key={group.id}
                      group={group}
                      activeProductId={activeProductId}
                      onSelect={handleSelect}
                      onDetach={handleDetach}
                      businessSlug={businessSlug}
                      writesEnabled={writesEnabled}
                    />
                  ))
                )}
              </section>

              {submitError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end">
            <AdminBackButton
              fallbackHref={getProductListHref(businessSlug)}
              label="Back to products"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
