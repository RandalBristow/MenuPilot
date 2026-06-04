"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ListChecks, Plus } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import type { DeleteModifierOptionGroupResult } from "@/features/admin-modifiers/actions/delete-modifier-option-group"
import { DeleteModifierOptionGroupButton } from "@/features/admin-modifiers/components/DeleteModifierOptionGroupButton"
import { ModifierOptionGroupFormDialog } from "@/features/admin-modifiers/components/ModifierOptionGroupFormDialog"
import {
  getNextModifierOptionGroupSortOrder,
  sortModifierOptionGroups,
} from "@/features/admin-modifiers/utils/modifier-option-group-sort-order"
import type { ModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"
import type { ModifierGroupProductContext } from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierSubgroupListClientProps = {
  data: {
    businessName: string
    mode: "global" | "product" | "preview"
    group: ModifierGroupDetail
    productContext: ModifierGroupProductContext
  }
}

function getProductScopedHref(href: string, productId?: string) {
  if (!productId) return href

  return `${href}?productId=${encodeURIComponent(productId)}`
}

export function ModifierSubgroupListClient({
  data,
}: ModifierSubgroupListClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeOptionGroup, setActiveOptionGroup] = useState<
    ModifierGroupDetail["optionGroups"][number] | null
  >(null)
  const [deleteResult, setDeleteResult] =
    useState<DeleteModifierOptionGroupResult | null>(null)
  const { group, mode, productContext } = data
  const isProductScopedMode = mode !== "global"
  const optionGroups = sortModifierOptionGroups(group.optionGroups)
  const nextSortOrder = getNextModifierOptionGroupSortOrder({
    optionGroups,
  })

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${group.name} Lists`}
            description={
              productContext
                ? `Product-specific lists for ${productContext.name}.`
              : `Lists inside ${group.name}.`
            }
          />
          {deleteResult ? (
            <p
              className={
                deleteResult.status === "deleted"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                  : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              }
            >
              {deleteResult.message}
            </p>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {optionGroups.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No option groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add option groups like Meats, Veggies, Sauces, or Sizes.
              </p>
            </ThemedCard>
          ) : (
            optionGroups.map((subgroup) => (
              <ThemedCard
                key={subgroup.id}
                role="button"
                tabIndex={0}
                aria-label={`Edit option group ${subgroup.name}`}
                onClick={() => {
                  if (!isProductScopedMode) setActiveOptionGroup(subgroup)
                }}
                onKeyDown={(event) => {
                  if (
                    !isProductScopedMode &&
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    setActiveOptionGroup(subgroup)
                  }
                }}
                className={
                  subgroup.is_enabled
                    ? "cursor-pointer gap-0 overflow-hidden py-0"
                    : "cursor-pointer gap-0 overflow-hidden bg-muted/30 py-0 opacity-75"
                }
              >
                <CompactRecordRow
                  title={subgroup.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={subgroup.is_enabled} />
                  }
                  description={subgroup.description}
                  metadata={
                    <span>Sort {subgroup.sort_order}</span>
                  }
                  rightAction={
                    <>
                      <ThemedButton
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Manage options for ${subgroup.name}`}
                        className="size-8 bg-background text-foreground hover:bg-muted"
                        onClick={(event) => {
                          event.stopPropagation()
                          router.push(
                            getProductScopedHref(
                              `/admin/modifiers/${group.id}/subgroups/${subgroup.id}`,
                              productContext?.id
                            )
                          )
                        }}
                      >
                        <ListChecks aria-hidden="true" />
                        <span className="sr-only">Manage Options</span>
                      </ThemedButton>
                      {mode === "preview" ? null : (
                        <DeleteModifierOptionGroupButton
                          modifierGroupId={group.id}
                          modifierOptionGroupId={subgroup.id}
                          optionGroupName={subgroup.name}
                          onResult={setDeleteResult}
                        />
                      )}
                    </>
                  }
                />
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref={
                productContext
                  ? `/admin/products/modifier-groups?productId=${productContext.id}`
                  : group.modifier_category_id
                    ? `/admin/modifiers/groups/${group.modifier_category_id}`
                    : "/admin/modifiers/groups"
              }
              label="Back to modifier groups"
            />
            {isProductScopedMode ? null : (
              <ThemedButton
                type="button"
                size="icon"
                aria-label="New Option Group"
                className="size-10 rounded-md p-0 shadow-sm sm:size-8"
                onClick={() => setCreateOpen(true)}
              >
                <Plus aria-hidden="true" />
                <span className="sr-only">New Option Group</span>
              </ThemedButton>
            )}
          </div>
        </div>
      </div>

      <ModifierOptionGroupFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        modifierGroupId={group.id}
        modifierGroupName={group.name}
        nextSortOrder={nextSortOrder}
      />

      {activeOptionGroup ? (
        <ModifierOptionGroupFormDialog
          open={Boolean(activeOptionGroup)}
          onOpenChange={(open) => {
            if (!open) setActiveOptionGroup(null)
          }}
          mode="edit"
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          nextSortOrder={nextSortOrder}
          optionGroup={activeOptionGroup}
        />
      ) : null}
    </main>
  )
}
