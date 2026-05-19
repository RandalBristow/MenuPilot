"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierOptionGroupFormDialog } from "@/features/admin-modifiers/components/ModifierOptionGroupFormDialog"
import type { ModifierGroupDetail } from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierSubgroupListClientProps = {
  data: {
    businessName: string
    group: ModifierGroupDetail
  }
}

export function ModifierSubgroupListClient({
  data,
}: ModifierSubgroupListClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeOptionGroup, setActiveOptionGroup] = useState<
    ModifierGroupDetail["optionGroups"][number] | null
  >(null)
  const { group } = data

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={group.name}
            description="Option groups inside this modifier subgroup."
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
                onClick={() => setActiveOptionGroup(subgroup)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setActiveOptionGroup(subgroup)
                  }
                }}
                className={
                  subgroup.is_enabled
                    ? "cursor-pointer gap-0 overflow-hidden p-0"
                    : "cursor-pointer gap-0 overflow-hidden bg-muted/30 p-0 opacity-75"
                }
              >
                <div className="px-3 pt-2.5 text-left">
                  <div className="flex min-w-0 items-center gap-2">
                    <CompactRecordStatusIcon enabled={subgroup.is_enabled} />
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                      {subgroup.name}
                    </div>
                  </div>

                  {subgroup.description ? (
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                      {subgroup.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end px-3 pb-2.5 pt-1.5">
                  <ThemedButton
                    type="button"
                    variant="outline"
                    className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                    onClick={(event) => {
                      event.stopPropagation()
                      router.push(
                        `/admin/modifiers/${group.id}/subgroups/${subgroup.id}`
                      )
                    }}
                  >
                    Manage Options
                  </ThemedButton>
                </div>
              </ThemedCard>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-between gap-2">
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Back to modifier groups"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() =>
                router.push(
                  group.modifier_group_category_id
                    ? `/admin/modifiers/groups/${group.modifier_group_category_id}`
                    : "/admin/modifiers/groups"
                )
              }
            >
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier groups</span>
            </ThemedButton>
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
