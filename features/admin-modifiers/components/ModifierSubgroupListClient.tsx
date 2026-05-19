"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, X } from "lucide-react"
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

function getOptionCount(group: ModifierGroupDetail, subgroupId: string) {
  return group.options.filter(
    (option) => option.modifier_option_group_id === subgroupId
  ).length
}

export function ModifierSubgroupListClient({
  data,
}: ModifierSubgroupListClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const { group } = data

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Option Groups"
            description={`Option groups inside ${group.name}.`}
          />
          <p className="truncate text-sm text-muted-foreground">
            {data.businessName}
          </p>
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
              <button
                key={subgroup.id}
                type="button"
                aria-label={`Open subgroup ${subgroup.name}`}
                onClick={() =>
                  router.push(
                    `/admin/modifiers/${group.id}/subgroups/${subgroup.id}`
                  )
                }
                className={
                  subgroup.is_enabled
                    ? "block w-full text-left"
                    : "block w-full text-left opacity-75"
                }
              >
                <ThemedCard
                  className={
                    subgroup.is_enabled
                      ? "overflow-hidden p-0"
                      : "overflow-hidden bg-muted/30 p-0"
                  }
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <CompactRecordStatusIcon enabled={subgroup.is_enabled} />
                        <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                          {subgroup.name}
                        </div>
                      </div>

                      {subgroup.description ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          {subgroup.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{getOptionCount(group, subgroup.id)} options</span>
                        <span>Sort {subgroup.sort_order}</span>
                      </div>
                    </div>

                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </div>
                </ThemedCard>
              </button>
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
    </main>
  )
}
