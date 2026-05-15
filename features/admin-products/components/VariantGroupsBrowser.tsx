"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Plus, X } from "lucide-react"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import { saveVariantGroup } from "@/features/admin-products/actions/save-variant-group"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type { VariantGroupListItem } from "@/features/admin-products/queries/get-variant-groups"

type VariantGroupsBrowserProps = {
  data: {
    businessName: string
    groups: VariantGroupListItem[]
  }
}

function getNextSortOrder(groups: VariantGroupListItem[]) {
  if (groups.length === 0) return 1

  return Math.max(...groups.map((group) => group.sort_order)) + 1
}

function VariantGroupFormPanel({
  open,
  onOpenChange,
  nextSortOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextSortOrder: number
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await saveVariantGroup(formData)
    formRef.current?.reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedButton
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            className="absolute top-3 right-3 bg-transparent text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </ThemedButton>
          <ThemedSheetTitle className="text-3xl font-bold text-foreground">
            New Variant Group
          </ThemedSheetTitle>
          <ThemedSheetDescription>
            Create a reusable variant group.
          </ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          ref={formRef}
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Name</span>
                <input
                  name="name"
                  required
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Sort order</span>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={String(nextSortOrder)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    name="isEnabled"
                    defaultValue="true"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </ThemedButton>
            <ThemedButton
              type="submit"
              size="icon"
              aria-label="Create Variant Group"
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">Create Variant Group</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function VariantGroupsBrowser({ data }: VariantGroupsBrowserProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const nextSortOrder = getNextSortOrder(data.groups)

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <ThemedPageHeader
          title="Variant Groups"
          description={`Reusable product variant groups for ${data.businessName}.`}
          className="shrink-0 border-b pb-3"
        />

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {data.groups.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variant groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create reusable groups like pizza sizes or drink sizes.
              </p>
            </ThemedCard>
          ) : (
            data.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-label={`Open variant group ${group.name}`}
                onClick={() =>
                  router.push(`/admin/products/variant-groups/${group.id}`)
                }
                className={
                  group.is_enabled
                    ? "block w-full text-left"
                    : "block w-full text-left opacity-75"
                }
                >
                  <ThemedCard
                    className={
                      group.is_enabled
                        ? "overflow-hidden p-0"
                        : "overflow-hidden bg-muted/30 p-0"
                    }
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <CompactRecordStatusIcon
                            enabled={group.is_enabled}
                          />
                          <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                            {group.name}
                          </div>
                        </div>

                        {group.description ? (
                          <p className="text-xs leading-5 text-muted-foreground">
                            {group.description}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{group.optionCount} options</span>
                          <span>Sort {group.sort_order}</span>
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
          <div className="flex justify-end">
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New Variant Group"
              className="size-10 rounded-md p-0 shadow-sm sm:size-8"
              onClick={() => setIsCreating(true)}
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">New Variant Group</span>
            </ThemedButton>
          </div>
        </div>
      </div>

      <VariantGroupFormPanel
        open={isCreating}
        onOpenChange={setIsCreating}
        nextSortOrder={nextSortOrder}
      />
    </main>
  )
}
