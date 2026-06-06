"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
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
import {
  getProductAdminHref,
  getVariantGroupDetailHref,
} from "@/features/admin-products/utils/product-admin-routes"

type VariantGroupsBrowserProps = {
  data: {
    businessName: string
    groups: VariantGroupListItem[]
  }
  businessSlug?: string
  writesEnabled?: boolean
}

function getNextSortOrder(groups: VariantGroupListItem[]) {
  if (groups.length === 0) return 1

  return Math.max(...groups.map((group) => group.sort_order)) + 1
}

function VariantGroupFormPanel({
  open,
  onOpenChange,
  nextSortOrder,
  group,
  businessSlug,
  writesEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextSortOrder: number
  group?: VariantGroupListItem | null
  businessSlug?: string
  writesEnabled: boolean
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = Boolean(group)
  const [isEnabled, setIsEnabled] = useState(group?.is_enabled ?? true)
  const title = isEditMode ? (group?.name ?? "Edit Variant Group") : "New Variant Group"
  const description = isEditMode
    ? "Update this variant group."
    : "Create a reusable variant group."
  const submitLabel = isEditMode ? "Save Variant Group" : "Create Variant Group"

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      await saveVariantGroup(formData)
      formRef.current?.reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <ThemedSheet open={open} onOpenChange={onOpenChange}>
      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>{title}</ThemedSheetTitle>
          <ThemedSheetDescription>{description}</ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          ref={formRef}
          action={writesEnabled ? handleSubmit : undefined}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            <div className="grid gap-4">
              {businessSlug ? (
                <input type="hidden" name="businessSlug" value={businessSlug} />
              ) : null}

              {group ? (
                <input type="hidden" name="groupId" value={group.id} />
              ) : null}

              {isEditMode ? (
                <input
                  type="hidden"
                  name="isEnabled"
                  value={String(isEnabled)}
                />
              ) : null}

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium">Variant group name</span>
                  <input
                    name="name"
                    required
                    defaultValue={group?.name ?? ""}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {isEditMode ? (
                  <ThemedButton
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${isEnabled ? "Disable" : "Enable"} variant group ${group?.name ?? ""}`}
                    className="size-10 shrink-0 bg-background text-foreground hover:bg-muted"
                    onClick={() => setIsEnabled((current) => !current)}
                  >
                    {isEnabled ? (
                      <ThumbsUp aria-hidden="true" />
                    ) : (
                      <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {isEnabled ? "Disable" : "Enable"} variant group
                    </span>
                  </ThemedButton>
                ) : null}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={group?.description ?? ""}
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
                    defaultValue={String(group?.sort_order ?? nextSortOrder)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </label>

                {!isEditMode ? (
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
                ) : null}
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
              disabled={!writesEnabled || isSubmitting}
              size="icon"
              aria-label={submitLabel}
              className="size-10"
            >
              <Check aria-hidden="true" />
              <span className="sr-only">{submitLabel}</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}

export function VariantGroupsBrowser({
  data,
  businessSlug,
  writesEnabled = true,
}: VariantGroupsBrowserProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [activeGroup, setActiveGroup] = useState<VariantGroupListItem | null>(
    null
  )
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
              <ThemedCard
                key={group.id}
                role="button"
                tabIndex={0}
                aria-label={`Edit variant group ${group.name}`}
                onClick={() => setActiveGroup(group)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setActiveGroup(group)
                  }
                }}
                className={
                  group.is_enabled
                    ? "cursor-pointer gap-0 overflow-hidden p-0"
                    : "cursor-pointer gap-0 overflow-hidden bg-muted/30 p-0 opacity-75"
                }
              >
                <div className="px-3 pt-2.5 text-left">
                  <div className="flex min-w-0 items-center gap-2">
                    <CompactRecordStatusIcon enabled={group.is_enabled} />
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">
                      {group.name}
                    </div>
                  </div>

                  {group.description ? (
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                      {group.description}
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
                        getVariantGroupDetailHref({
                          groupId: group.id,
                          businessSlug,
                        })
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
          <div className="flex justify-end gap-2">
            <AdminBackButton
              fallbackHref={getProductAdminHref("", businessSlug)}
              label="Back to product management"
            />
            <ThemedButton
              type="button"
              size="icon"
              aria-label="New Variant Group"
              className="size-10 rounded-md p-0 shadow-sm"
              disabled={!writesEnabled}
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
        businessSlug={businessSlug}
        writesEnabled={writesEnabled}
      />

      {activeGroup ? (
        <VariantGroupFormPanel
          open={Boolean(activeGroup)}
          onOpenChange={(open) => {
            if (!open) setActiveGroup(null)
          }}
          nextSortOrder={nextSortOrder}
          group={activeGroup}
          businessSlug={businessSlug}
          writesEnabled={writesEnabled}
        />
      ) : null}
    </main>
  )
}
