"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle, ImageIcon, Loader2, LockKeyhole } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCart } from "@/features/cart/context/CartProvider"
import type {
  ConfiguredProductResult,
  DealCartItem,
} from "@/features/cart/types/cart"
import {
  ProductConfigurator,
  type ProductConfig,
} from "@/features/product-configurator/components/ProductConfigurator"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"
import { buildDefaultConfiguredProductResult } from "@/features/product-configurator/utils/build-default-configured-product-result"
import { loadPublicOrderableDeal } from "@/features/specials/queries/load-public-orderable-deal"
import type { PublicOrderableDeal } from "@/features/specials/types/orderable-deal"
import {
  validateAndPriceOrderableDeal,
  type OrderableDealSelectedChild,
} from "@/features/specials/utils/validate-and-price-orderable-deal"

type DealBuilderProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessSlug?: string | null
  businessId?: string | null
  specialId: string | null
  editingDealItem?: DealCartItem | null
  timeZone?: string | null
}

type SelectedChild = {
  stepKey: string
  componentId: string
  childLineId: string
  allowedVariantOptionIds: string[]
  result: ConfiguredProductResult
}

type DealStep = {
  key: string
  component: PublicOrderableDeal["components"][number]
  slotIndex: number
  slotCount: number
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function getChildExtra(result: ConfiguredProductResult) {
  return (
    result.childExtraTotal ??
    result.modifierExtraTotal ??
    result.chargedModifierTotal ??
    0
  )
}

function getDealChildExtra(result: ConfiguredProductResult) {
  const firstIncludedUnitExtra = getChildExtra(result)
  const extraUnitTotal = Math.max(0, result.quantity - 1) * result.unitPrice

  return Number((firstIncludedUnitExtra + extraUnitTotal).toFixed(2))
}

function getComponentPricingText(
  component: PublicOrderableDeal["components"][number]
) {
  if (component.pricingMode === "fixed_price") {
    return component.fixedPrice === null
      ? "Fixed price unavailable"
      : `Fixed price: ${formatMoney(component.fixedPrice)}`
  }

  if (component.pricingMode === "normal_price") {
    return "Normal product price is not supported yet"
  }

  return "Included"
}

function getSelectedChildKey(componentId: string, productId: string) {
  return `${componentId}:${productId}`
}

function getStepKey(componentId: string, slotIndex: number) {
  return `${componentId}:${slotIndex}`
}

function getComponentSlotCount(component: PublicOrderableDeal["components"][number]) {
  return Math.max(1, component.requiredQuantity)
}

function getDealSteps(deal: PublicOrderableDeal) {
  return deal.components.flatMap((component) => {
    const slotCount = getComponentSlotCount(component)

    return Array.from({ length: slotCount }, (_, slotIndex) => ({
      key: getStepKey(component.id, slotIndex),
      component,
      slotIndex,
      slotCount,
    }))
  })
}

function getCardActionLabel(
  product: PublicOrderableDeal["components"][number]["products"][number]
) {
  if (product.hasVariants) return "Customize"
  if (product.builderTemplate === "pizza") return "Customize"
  if (product.builderTemplate === "standard") return "Customize"

  return "Customize"
}

function getProductImage(
  product: PublicOrderableDeal["components"][number]["products"][number]
) {
  const mediaAsset = product.mediaAsset

  if (!mediaAsset || mediaAsset.isArchived || !mediaAsset.publicUrl) return null

  return {
    src: mediaAsset.publicUrl,
    alt: mediaAsset.altText ?? mediaAsset.caption ?? product.name,
  }
}

function isSupabaseStorageUrl(src: string) {
  try {
    const url = new URL(src)

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    )
  } catch {
    return false
  }
}

export function DealBuilder({
  open,
  onOpenChange,
  businessSlug = null,
  businessId = null,
  specialId,
  editingDealItem = null,
  timeZone = null,
}: DealBuilderProps) {
  const { addDealItem, updateDealItem } = useCart()
  const { showToast } = useThemedToast()
  const [deal, setDeal] = useState<PublicOrderableDeal | null>(null)
  const [selectedChildren, setSelectedChildren] = useState<SelectedChild[]>([])
  const [loadingDeal, setLoadingDeal] = useState(false)
  const [loadingProductKey, setLoadingProductKey] = useState<string | null>(null)
  const [builderProduct, setBuilderProduct] = useState<ProductConfig | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null)
  const [activeStepKey, setActiveStepKey] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !specialId) return

    let isCancelled = false
    const resolvedSpecialId = specialId

    async function loadDeal() {
      setLoadingDeal(true)
      setError(null)
      setDeal(null)
      setSelectedChildren([])
      setCurrentStepIndex(0)

      try {
        const loadedDeal = await loadPublicOrderableDeal({
          businessSlug,
          businessId,
          specialId: resolvedSpecialId,
          timeZone,
        })

        if (isCancelled) return

        if (!loadedDeal) {
          setError("This deal is not available right now.")
          return
        }

        setDeal(loadedDeal)

        if (editingDealItem?.specialId === loadedDeal.id) {
          const loadedSteps = getDealSteps(loadedDeal)
          const restoredChildren: SelectedChild[] = editingDealItem.components.flatMap(
            (component) =>
              component.children.map<SelectedChild | null>((child, childIndex) => {
                const step =
                  loadedSteps.find(
                    (item) =>
                      item.component.id === component.componentId &&
                      item.slotIndex === childIndex
                  ) ??
                  loadedSteps.find(
                    (item) => item.component.id === component.componentId
                  )
                const dealComponent = loadedDeal.components.find(
                  (item) => item.id === component.componentId
                )
                const dealProduct = dealComponent?.products.find(
                  (product) => product.id === child.productId
                )

                if (!step) return null

                const configuredLineTotal = child.configuredLineTotal ?? 0
                const unitPrice =
                  child.quantity > 0
                    ? configuredLineTotal / child.quantity
                    : configuredLineTotal
                const extraUnitTotal =
                  Math.max(0, child.quantity - 1) * unitPrice
                const firstIncludedUnitExtra = Number(
                  Math.max(0, child.childExtraTotal - extraUnitTotal).toFixed(2)
                )

                const result: ConfiguredProductResult = {
                  businessId: editingDealItem.businessId,
                  businessSlug: editingDealItem.businessSlug,
                  locationId: editingDealItem.locationId,
                  locationSlug: editingDealItem.locationSlug,
                  productId: child.productId,
                  productName: child.productName,
                  variantId: child.variantId,
                  variantName: child.variantName,
                  quantity: 1,
                  unitPrice,
                  totalPrice: unitPrice + firstIncludedUnitExtra,
                  configuredLineTotal: unitPrice + firstIncludedUnitExtra,
                  chargedModifierTotal: firstIncludedUnitExtra,
                  modifierExtraTotal: firstIncludedUnitExtra,
                  childExtraTotal: firstIncludedUnitExtra,
                  modifiers: child.modifiers,
                }

                return {
                  stepKey: step.key,
                  componentId: component.componentId,
                  childLineId: child.childLineId,
                  allowedVariantOptionIds:
                    dealProduct?.allowedVariantOptionIds ?? [],
                  result,
                }
              })
          ).filter((child): child is SelectedChild => child !== null)

          setSelectedChildren(restoredChildren)
          setCurrentStepIndex(
            restoredChildren.length >= loadedSteps.length ? loadedSteps.length : 0
          )
        }
      } catch (loadError) {
        console.error("Failed to load deal:", loadError)
        if (!isCancelled) setError("Could not load this deal.")
      } finally {
        if (!isCancelled) setLoadingDeal(false)
      }
    }

    void loadDeal()

    return () => {
      isCancelled = true
    }
  }, [businessId, businessSlug, editingDealItem, open, specialId, timeZone])

  const steps = useMemo<DealStep[]>(() => {
    if (!deal) return []

    return getDealSteps(deal)
  }, [deal])

  const validation = useMemo(() => {
    if (!deal) return null

    return validateAndPriceOrderableDeal({
      businessId: deal.businessId,
      currentTime: new Date(),
      timeZone,
      deal: {
        businessId: deal.businessId,
        specialId: deal.id,
        name: deal.name,
        specialType: "orderable_deal",
        isEnabled: deal.isEnabled,
        startsAt: deal.startsAt,
        endsAt: deal.endsAt,
        availabilityWindows: deal.availabilityWindows,
        dealBasePrice: deal.dealBasePrice,
        components: deal.components.map((component) => ({
          componentId: component.id,
          label: component.label,
          sortOrder: component.sortOrder,
          requiredQuantity: component.requiredQuantity,
          minQuantity: component.minQuantity,
          maxQuantity: component.maxQuantity,
          pricingBehavior: component.pricingBehavior,
          pricingMode: component.pricingMode,
          fixedPrice: component.fixedPrice,
          isRequired: component.isRequired,
          allowedProductIds: component.products.map((product) => product.id),
          allowedProductVariantOptions: component.products
            .filter((product) => product.allowedVariantOptionIds.length > 0)
            .map((product) => ({
              productId: product.id,
              allowedVariantOptionIds: product.allowedVariantOptionIds,
            })),
          modifierGroupOverrides: component.products.flatMap((product) =>
            product.modifierGroupOverrides.map((override) => ({
              productId: product.id,
              modifierGroupId: override.modifierGroupId,
              includedSelectionCount: override.includedSelectionCount,
            }))
          ),
        })),
      },
      children: selectedChildren.map<OrderableDealSelectedChild>((child) => ({
        componentId: child.componentId,
        childLineId: child.childLineId,
        productId: child.result.productId,
        productName: child.result.productName,
        selectedVariantOptionId: child.result.variantId,
        quantity: child.result.quantity,
        configuredLineTotal:
          child.result.configuredLineTotal ?? child.result.totalPrice,
        chargedModifierTotal: child.result.chargedModifierTotal,
        modifierExtraTotal: child.result.modifierExtraTotal,
        childExtraTotal: getDealChildExtra(child.result),
        variantName: child.result.variantName,
        configurationSnapshot: {
          variantId: child.result.variantId,
          variantName: child.result.variantName,
          modifiers: child.result.modifiers,
        },
      })),
    })
  }, [deal, selectedChildren, timeZone])

  async function handleConfigureProduct(step: DealStep, productId: string) {
    if (loadingProductKey) return

    setError(null)
    setActiveComponentId(step.component.id)
    setActiveStepKey(step.key)
    setLoadingProductKey(getSelectedChildKey(step.key, productId))

    try {
      const config = await getProductConfig(productId, { businessSlug })
      setBuilderProduct(config as unknown as ProductConfig)
      setBuilderOpen(true)
    } catch (loadError) {
      console.error("Failed to load deal child product:", loadError)
      setError("Could not load that deal item.")
    } finally {
      setLoadingProductKey(null)
    }
  }

  async function handleAddDefaultProduct(step: DealStep, productId: string) {
    if (loadingProductKey) return

    setError(null)
    setActiveComponentId(step.component.id)
    setActiveStepKey(step.key)
    setLoadingProductKey(getSelectedChildKey(step.key, productId))

    try {
      const config = (await getProductConfig(productId, {
        businessSlug,
      })) as unknown as ProductConfig
      const product = step.component.products.find((item) => item.id === productId)
      const result = buildDefaultConfiguredProductResult({
        product: config,
        businessSlug,
        allowedVariantOptionIds: product?.allowedVariantOptionIds ?? null,
        modifierIncludedRuleOverrides:
          product?.modifierGroupOverrides ?? null,
        requireExplicitRequiredModifierDefaults: true,
        requireSatisfiedIncludedModifierGroups: true,
      })

      if (!result) {
        setBuilderProduct(config)
        setBuilderOpen(true)
        return
      }

      handleConfiguredItemForStep({
        result,
        componentId: step.component.id,
        stepKey: step.key,
      })
    } catch (loadError) {
      console.error("Failed to add default deal child product:", loadError)
      setError("Could not add that deal item.")
    } finally {
      setLoadingProductKey(null)
    }
  }

  function handleConfiguredItem(result: ConfiguredProductResult) {
    if (!activeComponentId || !activeStepKey) return
    if (result.quantity !== 1) {
      showToast({
        kind: "error",
        title: "Choose one item for this deal step",
        description: "Each deal item is configured separately.",
      })
      return
    }
    handleConfiguredItemForStep({
      result,
      componentId: activeComponentId,
      stepKey: activeStepKey,
    })
    setBuilderOpen(false)
    setBuilderProduct(null)
    setActiveComponentId(null)
    setActiveStepKey(null)
  }

  function handleConfiguredItemForStep({
    result,
    componentId,
    stepKey,
  }: {
    result: ConfiguredProductResult
    componentId: string
    stepKey: string
  }) {
    const activeComponent = deal?.components.find(
      (component) => component.id === componentId
    )
    const activeProduct = activeComponent?.products.find(
      (product) => product.id === result.productId
    )
    const currentStep = steps.findIndex((step) => step.key === stepKey)
    const nextStepIndex = steps.findIndex(
      (step, index) =>
        index > currentStep &&
        step.key !== stepKey &&
        !selectedChildrenByStep.has(step.key)
    )
    const nextStep = nextStepIndex >= 0 ? steps[nextStepIndex] : null

    setSelectedChildren((current) => [
      ...current.filter((child) => child.stepKey !== stepKey),
      {
        stepKey,
        componentId,
        childLineId: crypto.randomUUID(),
        allowedVariantOptionIds: activeProduct?.allowedVariantOptionIds ?? [],
        result,
      },
    ])
    setCurrentStepIndex(nextStep ? nextStepIndex : steps.length)
    showToast({
      kind: "success",
      title: `${result.productName} added to deal`,
      description: nextStep
        ? `Moving to item ${nextStepIndex + 1}: ${nextStep.component.label}.`
        : "All items are selected and ready to add.",
    })
  }

  function handleAddDeal() {
    if (!deal || !validation?.ok) return

    const childrenById = new Map(
      selectedChildren.map((child) => [child.childLineId, child])
    )

    const dealItem: DealCartItem = {
      cartItemId: crypto.randomUUID(),
      itemType: "deal",
      businessId: deal.businessId,
      businessSlug: businessSlug ?? deal.businessSlug,
      locationId: null,
      locationSlug: null,
      specialId: deal.id,
      specialName: deal.name,
      usesComponentPricing: true,
      componentBaseTotal: validation.componentBaseTotal,
      dealBasePrice: validation.dealBasePrice,
      childExtraTotal: validation.childExtraTotal,
      totalPrice: validation.total,
      components: validation.components.map((component) => ({
        componentId: component.componentId,
        componentLabel: component.label,
        sortOrder: component.sortOrder,
        requiredQuantity: component.requiredQuantity,
        selectedQuantity: component.selectedQuantity,
        pricingMode: component.pricingMode,
        fixedPrice: component.fixedPrice,
        componentBaseTotal: component.componentBaseTotal,
        children: component.children.map((child) => {
          const selectedChild = childrenById.get(child.childLineId)

          return {
            childLineId: child.childLineId,
            productId: child.productId,
            productName: child.productName,
            variantId: selectedChild?.result.variantId ?? null,
            variantName: child.variantName,
            quantity: child.quantity,
            configuredLineTotal: child.configuredLineTotal,
            componentPricingMode: child.componentPricingMode,
            componentFixedPrice: child.componentFixedPrice,
            componentBasePrice: child.componentBasePrice,
            childExtraTotal: child.childExtraTotal,
            modifiers: selectedChild?.result.modifiers ?? [],
          }
        }),
      })),
    }

    if (editingDealItem) {
      updateDealItem(editingDealItem.cartItemId, {
        ...dealItem,
        cartItemId: editingDealItem.cartItemId,
      })
      showToast({
        kind: "success",
        title: `${deal.name} updated`,
        description: "Your deal changes were saved in the cart.",
      })
    } else {
      addDealItem(dealItem)
    }
    onOpenChange(false)
  }

  const selectedChildrenByStep = new Map(
    selectedChildren.map((child) => [child.stepKey, child])
  )
  const canAddDeal = Boolean(validation?.ok)
  const completedStepCount = steps.filter((step) =>
    selectedChildrenByStep.has(step.key)
  ).length
  const usesFixedComponentPricing = steps.some(
    (step) => step.component.pricingMode === "fixed_price"
  )
  const minimumComponentBase = usesFixedComponentPricing
    ? steps.reduce(
        (total, step) =>
          total +
          (step.component.pricingMode === "fixed_price"
            ? step.component.fixedPrice ?? 0
            : 0),
        0
      )
    : deal?.dealBasePrice ?? 0
  const displayedComponentBase = validation?.ok
    ? validation.componentBaseTotal
    : minimumComponentBase ?? 0
  const displayedTotal = validation?.ok
    ? validation.total
    : minimumComponentBase ?? 0
  const displayedExtras = validation?.ok ? validation.childExtraTotal : 0
  const validationErrors =
    validation && !validation.ok ? validation.errors : []
  const unexpectedValidationErrors = validationErrors.filter(
    (validationError) =>
      validationError.code !== "missing_required_component" &&
      validationError.code !== "below_min_quantity"
  )
  const activeBuilderComponent = activeComponentId
    ? deal?.components.find((component) => component.id === activeComponentId)
    : null

  function renderSummaryPanel({ compact = false }: { compact?: boolean } = {}) {
    if (!deal) return null

    return (
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <h3 className="font-semibold">Deal summary</h3>
          <p className="text-sm text-muted-foreground">
            {completedStepCount} of {steps.length} items selected
          </p>
        </div>

        <div className="divide-y border-y">
          {steps.map((step, index) => {
            const selectedChild = selectedChildrenByStep.get(step.key)
            const itemBasePrice = step.component.pricingMode === "fixed_price"
              ? step.component.fixedPrice ?? 0
              : 0
            const itemExtra = selectedChild
              ? getDealChildExtra(selectedChild.result)
              : 0

            return (
              <div key={step.key} className="py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">Item {index + 1}: {step.component.label}</p>
                    {selectedChild ? <>
                      <p className="text-muted-foreground">
                        {selectedChild.result.productName}
                        {selectedChild.result.variantName ? ` — ${selectedChild.result.variantName}` : ""}
                      </p>
                      {selectedChild.result.modifiers.length > 0 ? (
                        <ul className="mt-1 text-xs text-muted-foreground">
                          {selectedChild.result.modifiers.map((modifier) => (
                            <li key={`${modifier.groupId}:${modifier.optionId}`}>
                              {modifier.groupName}: {modifier.optionName}
                              {modifier.placement !== "whole" ? ` (${modifier.placement})` : ""}
                              {modifier.multiplier > 1 ? ` ×${modifier.multiplier}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {itemExtra > 0 ? <p className="mt-1 text-xs text-muted-foreground">Extras {formatMoney(itemExtra)}</p> : null}
                    </> : <p className="text-muted-foreground">Pending</p>}
                  </div>
                  <span className="shrink-0 font-medium">
                    {step.component.pricingMode === "included" ? "Included" : formatMoney(itemBasePrice + itemExtra)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Component base</span>
            <span>{formatMoney(displayedComponentBase)}</span>
          </div>
          <div className="flex justify-between">
            <span>Extras</span>
            <span>{formatMoney(displayedExtras)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(displayedTotal)}</span>
          </div>
        </div>

        <ThemedButton
          type="button"
          disabled={!canAddDeal}
          onClick={handleAddDeal}
          className="h-11 w-full justify-between"
        >
          <span>{editingDealItem ? "Update Deal" : "Add Deal to Cart"}</span>
          <span>{formatMoney(displayedTotal)}</span>
        </ThemedButton>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="deal-builder-shell flex h-[92dvh] max-h-[92dvh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b px-4 py-4">
            <DialogTitle>{deal?.name ?? "Build Deal"}</DialogTitle>
            <DialogDescription className="sr-only">
              Select each item required for this deal.
            </DialogDescription>
          </DialogHeader>

          <div className="deal-builder-content grid min-h-0 flex-1">
            <div className="deal-builder-main no-scrollbar min-h-0 space-y-4 overflow-y-auto px-4 py-4">
              {loadingDeal ? (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading deal...
                </div>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              {unexpectedValidationErrors.length > 0 ? (
                <p className="text-sm text-destructive">
                  {unexpectedValidationErrors[0].message}
                </p>
              ) : null}

              {deal ? (
                <>
                {steps.map((step, index) => {
                  const selectedChild = selectedChildrenByStep.get(step.key)
                  const isActive = index === currentStepIndex
                  const isLocked = !selectedChild && index > completedStepCount

                  return (
                  <ThemedCard
                    key={step.key}
                    aria-disabled={isLocked}
                    className={isLocked ? "space-y-4 bg-muted/30 p-4 opacity-60" : "space-y-4 p-4"}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Item {index + 1} of {steps.length}</p>
                        <h3 className="text-xl font-semibold">{step.component.label}</h3>
                        <p className="text-sm font-medium">{getComponentPricingText(step.component)}</p>
                      </div>
                      {selectedChild && !isActive ? (
                        <ThemedButton type="button" variant="outline" onClick={() => setCurrentStepIndex(index)}>
                          Edit Item
                        </ThemedButton>
                      ) : isLocked ? (
                        <LockKeyhole aria-label="Locked until the previous item is complete" className="size-5 text-muted-foreground" />
                      ) : selectedChild ? (
                        <CheckCircle aria-label="Item complete" className="size-5 text-success" />
                      ) : null}
                    </div>

                    {isActive ? (
                    <div className="deal-builder-products-grid grid gap-3">
                      {step.component.products.map((product) => {
                        const productKey = getSelectedChildKey(
                          step.key,
                          product.id
                        )
                        const image = getProductImage(product)

                        return (
                          <ThemedCard
                            key={product.id}
                            className="flex h-full flex-col overflow-hidden p-0"
                          >
                            {image ? (
                              <div className="deal-builder-product-media relative aspect-video border-b bg-muted/30">
                                {isSupabaseStorageUrl(image.src) ? (
                                  <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    sizes="(min-width: 640px) 50vw, 100vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div
                                aria-hidden="true"
                                className="deal-builder-product-media flex aspect-video items-center justify-center border-b bg-muted/35 text-muted-foreground"
                              >
                                <ImageIcon className="size-8" />
                              </div>
                            )}
                            <div className="deal-builder-product-body flex flex-1 flex-col space-y-3 p-3">
                              <div className="space-y-1">
                                <h4 className="font-semibold leading-tight">
                                  {product.name}
                                </h4>
                                {product.description ? (
                                  <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                                    {product.description}
                                  </p>
                                ) : null}
                                {product.allowedVariantOptionIds.length > 0 ? (
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Restricted variant
                                  </p>
                                ) : null}
                                <p className="text-xs font-medium text-muted-foreground">
                                  {getComponentPricingText(step.component)}
                                </p>
                              </div>

                              <div className="deal-builder-product-actions mt-auto grid gap-2">
                                <ThemedButton
                                  type="button"
                                  onClick={() =>
                                    handleAddDefaultProduct(step, product.id)
                                  }
                                  className="deal-builder-card-button h-10"
                                >
                                  {loadingProductKey === productKey ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                  ) : null}
                                  Add to Deal
                                </ThemedButton>
                                <ThemedButton
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    handleConfigureProduct(step, product.id)
                                  }
                                  className="deal-builder-card-button h-10 bg-background text-foreground"
                                >
                                  {getCardActionLabel(product)}
                                </ThemedButton>
                              </div>
                            </div>
                          </ThemedCard>
                        )
                      })}
                    </div>
                    ) : null}
                  </ThemedCard>
                  )
                })}
                </>
              ) : null}
            </div>

            {deal ? (
              <aside className="deal-builder-summary min-h-0 border-l bg-background/60 p-4">
                <div className="sticky top-0">{renderSummaryPanel()}</div>
              </aside>
            ) : null}
          </div>

          {deal ? (
            <div className="deal-builder-footer shrink-0 space-y-3 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Completed</span>
                  <span>
                    {completedStepCount}/{steps.length}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(displayedTotal)}</span>
                </div>
              </div>
              <ThemedButton
                type="button"
                disabled={!canAddDeal}
                onClick={handleAddDeal}
                className="h-12 w-full justify-between"
              >
                <span>{editingDealItem ? "Update Deal" : "Add Deal to Cart"}</span>
                <span>{formatMoney(displayedTotal)}</span>
              </ThemedButton>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {builderProduct ? (
        <ProductConfigurator
          product={builderProduct}
          open={builderOpen}
          onOpenChange={setBuilderOpen}
          mode="create"
          businessSlug={businessSlug}
          submitBehavior="return"
          allowedVariantOptionIds={
            activeComponentId
              ? deal?.components
                  .find((component) => component.id === activeComponentId)
                  ?.products.find((product) => product.id === builderProduct.id)
                  ?.allowedVariantOptionIds
              : undefined
          }
          modifierIncludedRuleOverrides={
            activeBuilderComponent
              ? activeBuilderComponent.products.find(
                  (product) => product.id === builderProduct.id
                )?.modifierGroupOverrides
              : undefined
          }
          dealComponentPricingContext={
            activeBuilderComponent
              ? {
                  pricingMode: activeBuilderComponent.pricingMode,
                  fixedPrice: activeBuilderComponent.fixedPrice,
                  componentLabel: activeBuilderComponent.label,
                  displayPricingContext: true,
                }
              : null
          }
          lockQuantity
          onConfiguredItem={handleConfiguredItem}
        />
      ) : null}
    </>
  )
}
