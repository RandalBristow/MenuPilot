"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { Check, LinkIcon, Settings, Unlink, X } from "lucide-react"
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
import { saveProductIncludedModifierGroupAction } from "@/features/admin-products/actions/save-product-included-modifier-group"
import {
  attachProductModifierGroup,
  detachProductModifierGroup,
} from "@/features/admin-products/actions/save-product-modifier-group-assignment"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import { getIncludedSummary } from "@/features/admin-products/utils/product-included-modifier-summary"
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
  includedRule?: ProductModifierGroupOptionAssignment["includedRule"]
  selected?: boolean
  onAttach: (formData: FormData) => void
  onDetach: (formData: FormData) => void
  onSettingsSaved: () => void
}

type ProductModifierGroupOptionAssignment =
  ProductModifierGroupManagementData["modifierAssignments"][number]

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
  includedRule,
  selected = false,
  onAttach,
  onDetach,
  onSettingsSaved,
}: ModifierGroupCardProps) {
  const groupHref = getModifierGroupHref(group.id, activeProductId)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsState, settingsAction, isSavingSettings] = useActionState(
    saveProductIncludedModifierGroupAction,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)
  const includedSummary = getIncludedSummary(includedRule)

  useEffect(() => {
    if (!settingsState?.ok) return

    formRef.current?.reset()
    onSettingsSaved()
  }, [onSettingsSaved, settingsState])

  return (
    <>
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
            {includedSummary ? (
              <p className="mt-1 text-xs font-medium text-foreground">
                {includedSummary}
              </p>
            ) : null}
          </div>

          <div className="mt-1.5 flex justify-end">
            {selected ? (
              <div className="relative z-10 flex items-center gap-2">
                <ThemedButton
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 bg-background px-3 text-xs text-foreground hover:bg-muted"
                >
                  <Link
                    href={`/admin/products/modifier-groups/${group.id}/availability?productId=${activeProductId}`}
                    aria-label="Manage modifier availability"
                  >
                    Manage Availability
                  </Link>
                </ThemedButton>
                <ThemedButton
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Included settings for ${group.name}`}
                  className="size-8 bg-background text-foreground hover:bg-muted"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings aria-hidden="true" />
                  <span className="sr-only">Included settings</span>
                </ThemedButton>
                <form action={onDetach}>
                  <input type="hidden" name="productId" value={activeProductId} />
                  <input
                    type="hidden"
                    name="assignmentId"
                    value={assignmentId ?? ""}
                  />
                  <ThemedButton
                    type="submit"
                    size="icon"
                    aria-label={`Remove ${group.name} from this product`}
                    className="size-8"
                  >
                    <Unlink aria-hidden="true" />
                    <span className="sr-only">Remove {group.name}</span>
                  </ThemedButton>
                </form>
              </div>
            ) : (
              <form action={onAttach} className="relative z-10">
                <input type="hidden" name="productId" value={activeProductId} />
                <input type="hidden" name="modifierGroupId" value={group.id} />
                <ThemedButton
                  type="submit"
                  size="icon"
                  variant="outline"
                  aria-label={`Attach ${group.name}`}
                  className="size-8 bg-background text-foreground hover:bg-muted"
                >
                  <LinkIcon aria-hidden="true" />
                  <span className="sr-only">Attach {group.name}</span>
                </ThemedButton>
              </form>
            )}
          </div>
        </div>
      </ThemedCard>

      <ThemedSheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
            <ThemedSheetTitle>{group.name}</ThemedSheetTitle>
            <ThemedSheetDescription>
              Included selection settings for this product.
            </ThemedSheetDescription>
          </ThemedSheetHeader>

          <form
            ref={formRef}
            action={settingsAction}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
              {settingsState && !settingsState.ok ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {settingsState.message}
                </p>
              ) : null}
              {settingsState?.ok ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {settingsState.message}
                </p>
              ) : null}
              <input type="hidden" name="productId" value={activeProductId} />
              <input type="hidden" name="modifierGroupId" value={group.id} />

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Included selections</span>
                <input
                  name="includedQuantity"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={includedRule?.included_quantity ?? 0}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  Set to 0 to remove included pricing for this assignment.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
                <input
                  type="checkbox"
                  name="chargeForExtra"
                  value="true"
                  defaultChecked={includedRule?.charge_for_extra ?? true}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Charge extra selections
                  </span>
                  <span className="text-xs text-muted-foreground">
                    When enabled, selections beyond the included amount use
                    effective modifier pricing.
                  </span>
                </span>
              </label>
            </div>

            <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
              {includedRule ? (
                <ThemedButton
                  type="submit"
                  name="clearIncludedRule"
                  value="true"
                  variant="destructive"
                  aria-label="Clear included settings"
                  disabled={isSavingSettings}
                  className="mr-auto h-10 bg-destructive/10 px-3 text-destructive hover:bg-destructive/20"
                >
                  Clear
                </ThemedButton>
              ) : null}
              <ThemedButton
                type="button"
                variant="outline"
                size="icon"
                aria-label="Close"
                className="size-10 bg-background text-foreground hover:bg-muted"
                onClick={() => setSettingsOpen(false)}
              >
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </ThemedButton>
              <ThemedButton
                type="submit"
                size="icon"
                aria-label="Save included settings"
                disabled={isSavingSettings}
                className="size-10"
              >
                <Check aria-hidden="true" />
                <span className="sr-only">Save included settings</span>
              </ThemedButton>
            </div>
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </>
  )
}

export function ProductModifierGroupsClient({
  data,
}: ProductModifierGroupsClientProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedAvailableCategoryId, setSelectedAvailableCategoryId] =
    useState("all")
  const {
    selectedProductId,
    selectedProductName,
    modifierCategories,
    modifierAssignments,
  } = data
  const activeProductId = selectedProductId ?? ""
  const activeProductName = selectedProductName ?? "this product"
  const handleSettingsSaved = useCallback(() => {
    router.refresh()
  }, [router])
  const allGroups = modifierCategories.flatMap((category) =>
    category.modifier_groups.map((group) => ({
      ...group,
      categoryId: category.id,
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
  const filteredAvailableGroups =
    selectedAvailableCategoryId === "all"
      ? availableGroups
      : availableGroups.filter(
          (group) => group.categoryId === selectedAvailableCategoryId
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
            title={`${activeProductName} Modifier Assignments`}
            description={`Attach reusable modifier groups for ${data.businessName}.`}
          />

          {activeProductId ? (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <ThemedButton
                type="button"
                size="sm"
                onClick={() => setSelectedAvailableCategoryId("all")}
                className={
                  selectedAvailableCategoryId === "all"
                    ? "shrink-0"
                    : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
                }
              >
                All
              </ThemedButton>
              {modifierCategories.map((category) => (
                <ThemedButton
                  key={category.id}
                  type="button"
                  size="sm"
                  onClick={() => setSelectedAvailableCategoryId(category.id)}
                  className={
                    selectedAvailableCategoryId === category.id
                      ? "shrink-0"
                      : "shrink-0 bg-muted text-foreground hover:bg-muted/80"
                  }
                >
                  {category.name}
                </ThemedButton>
              ))}
            </div>
          ) : null}
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
                      includedRule={
                        assignmentsByGroupId.get(group.id)?.includedRule
                      }
                      selected
                      onAttach={handleAttach}
                      onDetach={handleDetach}
                      onSettingsSaved={handleSettingsSaved}
                    />
                  ))
                )}
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-semibold">
                  Available Modifier Groups
                </h2>

                {availableGroups.length === 0 ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No groups available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All reusable modifier groups are already attached.
                    </p>
                  </ThemedCard>
                ) : filteredAvailableGroups.length === 0 ? (
                  <ThemedCard className="p-5 text-center">
                    <p className="font-semibold">No groups in this category</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose another modifier category or show all categories.
                    </p>
                  </ThemedCard>
                ) : (
                  filteredAvailableGroups.map((group) => (
                    <ModifierGroupCard
                      key={group.id}
                      group={group}
                      activeProductId={activeProductId}
                      onAttach={handleAttach}
                      onDetach={handleDetach}
                      onSettingsSaved={handleSettingsSaved}
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
              fallbackHref="/admin/products/list"
              label="Back to products"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
