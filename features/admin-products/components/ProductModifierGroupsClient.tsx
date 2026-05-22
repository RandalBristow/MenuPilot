"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { X } from "lucide-react"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  attachProductModifierGroup,
  detachProductModifierGroup,
} from "@/features/admin-products/actions/save-product-modifier-group-assignment"
import type {
  ProductModifierGroupManagementData,
  ProductModifierGroupOption,
} from "@/features/admin-products/queries/get-product-management-data"

type ProductModifierGroupsClientProps = {
  data: ProductModifierGroupManagementData
}

type ModifierGroupCardProps = {
  group: ProductModifierGroupOption
  activeProductId: string
  assignmentId?: string
  selected?: boolean
  onAttach: (formData: FormData) => void
  onDetach: (formData: FormData) => void
}

function getGroupDescription(group: ProductModifierGroupOption) {
  const requiredLabel = group.is_required ? "Required" : "Optional"

  return `${requiredLabel} - ${group.selection_type}`
}

function getModifierGroupHref(groupId: string, productId?: string) {
  const baseHref = `/admin/modifiers/${groupId}`

  if (!productId) return baseHref

  return `${baseHref}?productId=${encodeURIComponent(productId)}`
}

function ModifierGroupCard({
  group,
  activeProductId,
  assignmentId,
  selected = false,
  onAttach,
  onDetach,
}: ModifierGroupCardProps) {
  const groupHref = getModifierGroupHref(group.id, activeProductId)

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
        aria-label={`Open modifier group ${group.name}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="px-3 py-2.5">
        <div>
          <div className="flex min-w-0 items-center gap-2">
            <CompactRecordStatusIcon
              enabled={group.is_enabled}
              enabledLabel={
                selected
                  ? "Assigned modifier group"
                  : "Modifier group enabled"
              }
              disabledLabel="Modifier group disabled"
            />
            <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
              {group.name}
            </div>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {getGroupDescription(group)}
          </p>
        </div>

        <div className="mt-1.5 flex items-end justify-end gap-3">
          <span className="inline-flex items-center gap-1 text-xs leading-5 text-muted-foreground">
            Product choices
          </span>

          {selected ? (
            <form action={onDetach} className="relative z-10">
              <input type="hidden" name="productId" value={activeProductId} />
              <input
                type="hidden"
                name="assignmentId"
                value={assignmentId ?? ""}
              />
              <ThemedButton
                type="submit"
                size="sm"
                aria-label={`Remove ${group.name} from this product`}
                className="h-8 px-3 text-xs"
              >
                Remove Group
              </ThemedButton>
            </form>
          ) : (
            <form action={onAttach} className="relative z-10">
              <input type="hidden" name="productId" value={activeProductId} />
              <input type="hidden" name="modifierGroupId" value={group.id} />
              <ThemedButton
                type="submit"
                size="sm"
                variant="outline"
                aria-label={`Attach ${group.name}`}
                className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
              >
                Attach Group
              </ThemedButton>
            </form>
          )}
        </div>
      </div>
    </ThemedCard>
  )
}

export function ProductModifierGroupsClient({
  data,
}: ProductModifierGroupsClientProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    selectedProductId,
    selectedProductName,
    modifierCategories,
    modifierAssignments,
  } = data
  const activeProductId = selectedProductId ?? ""
  const activeProductName = selectedProductName ?? "this product"
  const allGroups = modifierCategories.flatMap((category) =>
    category.modifier_groups.map((group) => ({
      ...group,
      categoryName: category.name,
    }))
  )
  const assignmentsByGroupId = new Map(
    modifierAssignments.map((assignment) => [
      assignment.modifier_group_id,
      assignment,
    ])
  )
  const attachedGroups = allGroups.filter((group) =>
    assignmentsByGroupId.has(group.id)
  )
  const availableGroups = allGroups.filter(
    (group) => !assignmentsByGroupId.has(group.id)
  )

  async function handleAttach(formData: FormData) {
    setSubmitError(null)

    try {
      await attachProductModifierGroup(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not attach modifier group."
      )
    }
  }

  async function handleDetach(formData: FormData) {
    setSubmitError(null)

    try {
      await detachProductModifierGroup(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not remove modifier group."
      )
    }
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Modifier Groups"
            description={`Attach reusable modifier groups for ${data.businessName}.`}
          />

          <div>
            <p className="text-sm font-semibold">Product</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {activeProductName}
            </p>
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-3">
          {!activeProductId ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No product selected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open this page from a product card to manage choices.
              </p>
            </ThemedCard>
          ) : (
            <>
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Assigned Modifier Groups</h2>
                {attachedGroups.length === 0 ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No choice groups attached</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Attach reusable modifier groups before this product can
                      offer choices.
                    </p>
                  </ThemedCard>
                ) : (
                  attachedGroups.map((group) => (
                    <ModifierGroupCard
                      key={group.id}
                      group={group}
                      activeProductId={activeProductId}
                      assignmentId={assignmentsByGroupId.get(group.id)?.id}
                      selected
                      onAttach={handleAttach}
                      onDetach={handleDetach}
                    />
                  ))
                )}
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Available Modifier Groups</h2>
                {availableGroups.length === 0 ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No groups available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All reusable modifier groups are already attached.
                    </p>
                  </ThemedCard>
                ) : (
                  availableGroups.map((group) => (
                    <ModifierGroupCard
                      key={group.id}
                      group={group}
                      activeProductId={activeProductId}
                      onAttach={handleAttach}
                      onDetach={handleDetach}
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
            <ThemedButton
              asChild
              variant="outline"
              size="icon"
              aria-label="Back to products"
              className="size-10 bg-background text-foreground hover:bg-muted"
            >
              <Link href="/admin/products/list">
                <X aria-hidden="true" />
                <span className="sr-only">Back to products</span>
              </Link>
            </ThemedButton>
          </div>
        </div>
      </div>
    </main>
  )
}
