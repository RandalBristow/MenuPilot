"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { ModifierOptionFormDialog } from "@/features/admin-modifiers/components/ModifierOptionFormDialog"
import type {
  ModifierGroupDetail,
  ModifierGroupDetailOption,
  ModifierGroupDetailSubgroup,
} from "@/features/admin-modifiers/queries/get-modifier-group-detail"

type ModifierSubgroupOptionsClientProps = {
  data: {
    businessName: string
    group: ModifierGroupDetail
  }
  subgroup: ModifierGroupDetailSubgroup
}

function formatPriceDelta(value: number) {
  if (value === 0) return "No price change"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(value)
}

export function ModifierSubgroupOptionsClient({
  data,
  subgroup,
}: ModifierSubgroupOptionsClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeOption, setActiveOption] =
    useState<ModifierGroupDetailOption | null>(null)
  const { group } = data
  const options = group.options.filter(
    (option) => option.modifier_option_group_id === subgroup.id
  )

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title="Modifier Options"
            description={`Options for ${subgroup.name}.`}
          />
          <p className="truncate text-sm text-muted-foreground">
            {group.name} - {data.businessName}
          </p>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {options.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No options yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add options for this subgroup.
              </p>
            </ThemedCard>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={`Edit option ${option.name}`}
                onClick={() => setActiveOption(option)}
                className={
                  option.is_enabled
                    ? "block w-full text-left"
                    : "block w-full text-left opacity-75"
                }
              >
                <ThemedCard
                  className={
                    option.is_enabled
                      ? "overflow-hidden py-0"
                      : "overflow-hidden bg-muted/30 py-0"
                  }
                >
                  <CompactRecordRow
                    title={option.name}
                    statusIcon={
                      <CompactRecordStatusIcon enabled={option.is_enabled} />
                    }
                    description={option.description}
                    metadata={
                      <>
                        <span>{formatPriceDelta(option.price_delta)}</span>
                        <span>Sort {option.sort_order}</span>
                      </>
                    }
                  />
                </ThemedCard>
              </button>
            ))
          )}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end gap-2">
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Back to modifier subgroups"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => router.push(`/admin/modifiers/${group.id}`)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier subgroups</span>
            </ThemedButton>
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New Modifier Option"
              className="size-10 rounded-md p-0 shadow-sm sm:size-8"
              onClick={() => setCreateOpen(true)}
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">New Modifier Option</span>
            </ThemedButton>
          </div>
        </div>
      </div>

      <ModifierOptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        modifierGroupId={group.id}
        modifierGroupName={group.name}
        optionGroups={group.optionGroups}
        initialOptionGroupId={subgroup.id}
      />

      {activeOption ? (
        <ModifierOptionFormDialog
          open={Boolean(activeOption)}
          onOpenChange={(open) => {
            if (!open) setActiveOption(null)
          }}
          mode="edit"
          option={activeOption}
          modifierGroupId={group.id}
          modifierGroupName={group.name}
          optionGroups={group.optionGroups}
          initialOptionGroupId={subgroup.id}
        />
      ) : null}
    </main>
  )
}
