"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierOptionGroupFormDialog } from "@/features/admin-modifiers/components/ModifierOptionGroupFormDialog"
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
  const { group, mode, productContext } = data
  const isProductScopedMode = mode !== "global"

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
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {group.optionGroups.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No option groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add option groups like Meats, Veggies, Sauces, or Sizes.
              </p>
            </ThemedCard>
          ) : (
            group.optionGroups.map((subgroup) => (
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
                  rightAction={
                    <ThemedButton
                      type="button"
                      variant="outline"
                      className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
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
                      Manage Options
                    </ThemedButton>
                  }
                />
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Back to modifier groups"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() =>
                router.push(
                  productContext
                    ? `/admin/products/modifier-groups?productId=${productContext.id}`
                    : group.modifier_group_category_id
                      ? `/admin/modifiers/groups/${group.modifier_group_category_id}`
                      : "/admin/modifiers/groups"
                )
              }
            >
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier groups</span>
            </ThemedButton>
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
          optionGroup={activeOptionGroup}
        />
      ) : null}
    </main>
  )
}
