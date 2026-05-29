"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import {
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import type {
  ExistingProduct,
  MenuGroup,
} from "@/features/admin-products/components/ProductForm"

export function formatMoney(value: number | null) {
  const amount = value ?? 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function getMenuGroupLabelById(groupId: string, groups: MenuGroup[]) {
  const group = groups.find((item) => item.id === groupId)

  if (!group) return "Unassigned"

  const parent = groups.find((item) => item.id === group.parent_group_id)

  if (!parent) return group.name

  return `${parent.name} / ${group.name}`
}

export function ProductPanelHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
      <ThemedSheetTitle>{title}</ThemedSheetTitle>
      <ThemedSheetDescription>{description}</ThemedSheetDescription>
    </ThemedSheetHeader>
  )
}

export function ProductPanelFooter({
  closeControl,
  submitLabel,
}: {
  closeControl: ReactNode
  submitLabel?: string
}) {
  return (
    <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
      {closeControl}
      {submitLabel ? (
        <ThemedButton
          type="submit"
          size="icon"
          aria-label={submitLabel}
          className="size-10"
        >
          <Check aria-hidden="true" />
          <span className="sr-only">{submitLabel}</span>
        </ThemedButton>
      ) : null}
    </div>
  )
}

export function ProductUpdateHiddenFields({
  product,
  redirectTo,
  includeInfo = true,
  includeMenuPlacement = true,
  includeAvailability = true,
  includeModifierGroups = true,
}: {
  product: ExistingProduct
  redirectTo: string
  includeInfo?: boolean
  includeMenuPlacement?: boolean
  includeAvailability?: boolean
  includeModifierGroups?: boolean
}) {
  return (
    <>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {includeInfo ? (
        <>
          <input type="hidden" name="name" value={product.name} />
          <input
            type="hidden"
            name="description"
            value={product.description ?? ""}
          />
          <input
            type="hidden"
            name="basePrice"
            value={String(product.base_price ?? 0)}
          />
          <input
            type="hidden"
            name="builderTemplate"
            value={product.builder_template}
          />
          {product.has_variants ? (
            <input type="hidden" name="hasVariants" value="true" />
          ) : null}
          <input
            type="hidden"
            name="imageMediaId"
            value={product.image_media_id ?? ""}
          />
        </>
      ) : null}

      {includeMenuPlacement ? (
        <input type="hidden" name="menuGroupId" value={product.menuGroupId} />
      ) : null}

      {includeAvailability ? (
        <input
          type="hidden"
          name="isEnabled"
          value={String(product.is_enabled)}
        />
      ) : null}

      {includeModifierGroups
        ? product.modifierGroupIds.map((modifierGroupId) => (
            <input
              key={modifierGroupId}
              type="hidden"
              name="modifierGroupIds"
              value={modifierGroupId}
            />
          ))
        : null}

    </>
  )
}
