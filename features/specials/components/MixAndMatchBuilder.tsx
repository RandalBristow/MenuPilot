"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle, ImageIcon, Loader2, Trash2 } from "lucide-react"
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
import { loadPublicMixAndMatchDeal } from "@/features/specials/queries/load-public-mix-and-match-deal"
import type {
  PublicMixAndMatchDeal,
  PublicMixAndMatchProduct,
} from "@/features/specials/types/mix-and-match-deal"
import {
  validateAndPriceMixAndMatchDeal,
  type MixAndMatchSelectedChild,
} from "@/features/specials/utils/validate-and-price-mix-and-match-deal"

type MixAndMatchBuilderProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessSlug?: string | null
  businessId?: string | null
  specialId: string | null
  timeZone?: string | null
}

type SelectedMixChild = {
  childLineId: string
  allowedVariantOptionIds: string[]
  result: ConfiguredProductResult
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

function getSelectedQuantity(children: SelectedMixChild[]) {
  return children.reduce((sum, child) => sum + child.result.quantity, 0)
}

function getProductImage(product: PublicMixAndMatchProduct) {
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

function getRuleSummary(rule: PublicMixAndMatchDeal["rule"]) {
  if (rule.maxQuantity === null) {
    return `Any ${rule.minQuantity}+ for ${formatMoney(rule.unitPrice)} each`
  }

  if (rule.minQuantity === rule.maxQuantity) {
    return `Choose ${rule.minQuantity} for ${formatMoney(rule.unitPrice)} each`
  }

  return `Choose ${rule.minQuantity}-${rule.maxQuantity} for ${formatMoney(
    rule.unitPrice
  )} each`
}

function getEffectiveMaxQuantity(rule: PublicMixAndMatchDeal["rule"]) {
  if (!rule.allowExtraItems) return rule.minQuantity

  return rule.maxQuantity
}

function getProductActionKey(productId: string, action: "add" | "customize") {
  return `${productId}:${action}`
}

export function MixAndMatchBuilder({
  open,
  onOpenChange,
  businessSlug = null,
  businessId = null,
  specialId,
  timeZone = null,
}: MixAndMatchBuilderProps) {
  const { addDealItem } = useCart()
  const { showToast } = useThemedToast()
  const [deal, setDeal] = useState<PublicMixAndMatchDeal | null>(null)
  const [selectedChildren, setSelectedChildren] = useState<SelectedMixChild[]>([])
  const [loadingDeal, setLoadingDeal] = useState(false)
  const [loadingProductKey, setLoadingProductKey] = useState<string | null>(null)
  const [builderProduct, setBuilderProduct] = useState<ProductConfig | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
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

      try {
        const loadedDeal = await loadPublicMixAndMatchDeal({
          businessSlug,
          businessId,
          specialId: resolvedSpecialId,
          timeZone,
        })

        if (isCancelled) return

        if (!loadedDeal) {
          setError("This Mix & Match deal is not available right now.")
          return
        }

        setDeal(loadedDeal)
      } catch (loadError) {
        console.error("Failed to load Mix & Match deal:", loadError)
        if (!isCancelled) setError("Could not load this Mix & Match deal.")
      } finally {
        if (!isCancelled) setLoadingDeal(false)
      }
    }

    void loadDeal()

    return () => {
      isCancelled = true
    }
  }, [businessId, businessSlug, open, specialId, timeZone])

  const selectedQuantity = getSelectedQuantity(selectedChildren)
  const effectiveMaxQuantity = deal ? getEffectiveMaxQuantity(deal.rule) : null
  const canSelectMore =
    effectiveMaxQuantity === null || selectedQuantity < effectiveMaxQuantity

  const validation = useMemo(() => {
    if (!deal) return null

    return validateAndPriceMixAndMatchDeal({
      businessId: deal.businessId,
      currentTime: new Date(),
      timeZone,
      deal: {
        businessId: deal.businessId,
        specialId: deal.id,
        name: deal.name,
        specialType: "mix_and_match_fixed_unit_price",
        isEnabled: deal.isEnabled,
        startsAt: deal.startsAt,
        endsAt: deal.endsAt,
        availabilityWindows: deal.availabilityWindows,
        rule: deal.rule,
        poolProducts: deal.products.map((product) => ({
          productId: product.id,
          allowedVariantOptionIds: product.allowedVariantOptionIds,
          modifierGroupOverrides: product.modifierGroupOverrides,
        })),
      },
      children: selectedChildren.map<MixAndMatchSelectedChild>((child) => ({
        childLineId: child.childLineId,
        productId: child.result.productId,
        productName: child.result.productName,
        selectedVariantOptionId: child.result.variantId,
        quantity: child.result.quantity,
        configuredLineTotal:
          child.result.configuredLineTotal ?? child.result.totalPrice,
        chargedModifierTotal: child.result.chargedModifierTotal,
        modifierExtraTotal: child.result.modifierExtraTotal,
        childExtraTotal: getChildExtra(child.result),
        variantName: child.result.variantName,
        configurationSnapshot: {
          variantId: child.result.variantId,
          variantName: child.result.variantName,
          modifiers: child.result.modifiers,
        },
      })),
    })
  }, [deal, selectedChildren, timeZone])

  async function handleConfigureProduct(productId: string) {
    if (!deal || loadingProductKey || !canSelectMore) return

    setError(null)
    setActiveProductId(productId)
    setLoadingProductKey(getProductActionKey(productId, "customize"))

    try {
      const config = await getProductConfig(productId, { businessSlug })
      setBuilderProduct(config as unknown as ProductConfig)
      setBuilderOpen(true)
    } catch (loadError) {
      console.error("Failed to load Mix & Match product:", loadError)
      setError("Could not load that Mix & Match item.")
    } finally {
      setLoadingProductKey(null)
    }
  }

  async function handleAddDefaultProduct(productId: string) {
    if (!deal || loadingProductKey || !canSelectMore) return

    const product = deal.products.find((item) => item.id === productId)
    if (!product) return

    setError(null)
    setActiveProductId(productId)
    setLoadingProductKey(getProductActionKey(productId, "add"))

    try {
      const config = (await getProductConfig(productId, {
        businessSlug,
      })) as unknown as ProductConfig
      const result = buildDefaultConfiguredProductResult({
        product: config,
        businessSlug,
        allowedVariantOptionIds: product.allowedVariantOptionIds,
        modifierIncludedRuleOverrides: product.modifierGroupOverrides,
      })

      if (!result) {
        setBuilderProduct(config)
        setBuilderOpen(true)
        return
      }

      addConfiguredMixItem(result)
    } catch (loadError) {
      console.error("Failed to add default Mix & Match product:", loadError)
      setError("Could not add that Mix & Match item.")
    } finally {
      setLoadingProductKey(null)
    }
  }

  function handleConfiguredItem(result: ConfiguredProductResult) {
    addConfiguredMixItem(result)
    setBuilderOpen(false)
    setBuilderProduct(null)
    setActiveProductId(null)
  }

  function addConfiguredMixItem(result: ConfiguredProductResult) {
    if (!deal) return

    const product = deal.products.find((item) => item.id === result.productId)
    const quantityAfterAdd = selectedQuantity + result.quantity
    const maxQuantity = getEffectiveMaxQuantity(deal.rule)

    if (maxQuantity !== null && quantityAfterAdd > maxQuantity) {
      setError(`${deal.name} allows no more than ${maxQuantity} selected items.`)
      return
    }

    setSelectedChildren((current) => [
      ...current,
      {
        childLineId: crypto.randomUUID(),
        allowedVariantOptionIds: product?.allowedVariantOptionIds ?? [],
        result,
      },
    ])
    showToast({
      kind: "success",
      title: `${result.productName} added`,
      description:
        quantityAfterAdd >= deal.rule.minQuantity
          ? "You can review this Mix & Match deal."
          : `${deal.rule.minQuantity - quantityAfterAdd} more item${
              deal.rule.minQuantity - quantityAfterAdd === 1 ? "" : "s"
            } needed.`,
    })
  }

  function handleRemoveChild(childLineId: string) {
    setSelectedChildren((current) =>
      current.filter((child) => child.childLineId !== childLineId)
    )
  }

  function handleAddMixToCart() {
    if (!deal || !validation?.ok) return

    const selectedChildrenById = new Map(
      selectedChildren.map((child) => [child.childLineId, child])
    )
    const dealItem: DealCartItem = {
      cartItemId: crypto.randomUUID(),
      itemType: "deal",
      specialType: "mix_and_match_fixed_unit_price",
      businessId: deal.businessId,
      businessSlug: businessSlug ?? deal.businessSlug,
      locationId: null,
      locationSlug: null,
      specialId: deal.id,
      specialName: deal.name,
      ruleSummary: getRuleSummary(deal.rule),
      selectedQuantity: validation.selectedQuantity,
      unitPrice: validation.unitPrice,
      mixBaseTotal: validation.mixBaseTotal,
      dealBasePrice: validation.mixBaseTotal,
      childExtraTotal: validation.childExtraTotal,
      totalPrice: validation.total,
      components: [
        {
          componentId: `mix:${deal.id}`,
          componentLabel: "Mix & Match selections",
          sortOrder: 1,
          requiredQuantity: validation.minQuantity,
          selectedQuantity: validation.selectedQuantity,
          children: validation.children.map((child) => {
            const selectedChild = selectedChildrenById.get(child.childLineId)

            return {
              childLineId: child.childLineId,
              productId: child.productId,
              productName: child.productName,
              variantId: selectedChild?.result.variantId ?? null,
              variantName: child.variantName,
              quantity: child.quantity,
              configuredLineTotal: child.configuredLineTotal,
              childExtraTotal: child.childExtraTotal,
              modifiers: selectedChild?.result.modifiers ?? [],
            }
          }),
        },
      ],
    }

    addDealItem(dealItem)
    showToast({
      kind: "success",
      title: `${deal.name} added to cart`,
      description: `${validation.selectedQuantity} item${
        validation.selectedQuantity === 1 ? "" : "s"
      } selected.`,
    })
    onOpenChange(false)
  }

  const displayedBase = validation?.ok
    ? validation.mixBaseTotal
    : selectedQuantity * (deal?.rule.unitPrice ?? 0)
  const displayedExtras = validation?.ok
    ? validation.childExtraTotal
    : selectedChildren.reduce((sum, child) => sum + getChildExtra(child.result), 0)
  const displayedTotal = Number((displayedBase + displayedExtras).toFixed(2))
  const canAddDeal = Boolean(validation?.ok)
  const activeProduct = deal?.products.find((product) => product.id === activeProductId)
  const selectionMessage = deal
    ? `${selectedQuantity} of ${
        deal.rule.maxQuantity ?? `${deal.rule.minQuantity}+`
      } selected`
    : ""
  const validationErrors = validation && !validation.ok ? validation.errors : []

  function renderSummaryPanel() {
    if (!deal) return null

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Mix & Match summary</h3>
          <p className="text-sm text-muted-foreground">{selectionMessage}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {getRuleSummary(deal.rule)}
          </p>
        </div>

        {selectedChildren.length > 0 ? (
          <div className="space-y-2">
            {selectedChildren.map((child) => (
              <div
                key={child.childLineId}
                className="flex items-start gap-2 rounded-lg border bg-background p-2"
              >
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {child.result.productName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Qty {child.result.quantity}
                    {child.result.variantName
                      ? ` - ${child.result.variantName}`
                      : ""}
                    {getChildExtra(child.result) > 0
                      ? ` - Extras ${formatMoney(getChildExtra(child.result))}`
                      : ""}
                  </p>
                </div>
                <ThemedButton
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveChild(child.childLineId)}
                  className="h-8 w-8 shrink-0 bg-transparent p-0 text-destructive hover:bg-destructive/10"
                  aria-label={`Remove ${child.result.productName}`}
                >
                  <Trash2 className="size-4" />
                </ThemedButton>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Choose eligible products to build this Mix & Match deal.
          </div>
        )}

        {validationErrors.length > 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-semibold">Still needed</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {validationErrors.map((item) => (
                <li key={`${item.code}-${item.productId ?? "deal"}`}>
                  {item.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Base</span>
            <span>{formatMoney(displayedBase)}</span>
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
          onClick={handleAddMixToCart}
          className="h-11 w-full justify-between"
        >
          <span>Add Mix to Cart</span>
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
            <DialogTitle>{deal?.name ?? "Build Mix & Match"}</DialogTitle>
            {deal?.customerDescription ? (
              <DialogDescription>
                {deal.customerDescription}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          <div className="deal-builder-content grid min-h-0 flex-1">
            <div className="deal-builder-main no-scrollbar min-h-0 space-y-4 overflow-y-auto px-4 py-4">
              {loadingDeal ? (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading Mix & Match deal...
                </div>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              {deal ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectionMessage}
                    </p>
                    <h3 className="text-xl font-semibold">Choose your items</h3>
                    <p className="text-sm text-muted-foreground">
                      {getRuleSummary(deal.rule)}
                    </p>
                  </div>

                  {!canSelectMore ? (
                    <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                      Maximum selected. Remove an item to choose a different one.
                    </p>
                  ) : null}

                  <div className="deal-builder-products-grid grid gap-3">
                    {deal.products.map((product) => {
                      const image = getProductImage(product)
                      const addKey = getProductActionKey(product.id, "add")
                      const configureKey = getProductActionKey(
                        product.id,
                        "customize"
                      )

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
                                  sizes="(min-width: 640px) 33vw, 100vw"
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
                            </div>

                            <div className="deal-builder-product-actions mt-auto grid gap-2">
                              <ThemedButton
                                type="button"
                                onClick={() => handleAddDefaultProduct(product.id)}
                                disabled={!canSelectMore}
                                className="deal-builder-card-button h-10"
                              >
                                {loadingProductKey === addKey ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                Add to Mix
                              </ThemedButton>
                              <ThemedButton
                                type="button"
                                variant="outline"
                                onClick={() => handleConfigureProduct(product.id)}
                                disabled={!canSelectMore}
                                className="deal-builder-card-button h-10 bg-background text-foreground"
                              >
                                {loadingProductKey === configureKey ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                Customize
                              </ThemedButton>
                            </div>
                          </div>
                        </ThemedCard>
                      )
                    })}
                  </div>
                </div>
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
              <p className="text-sm text-muted-foreground">
                {validation?.ok
                  ? "Ready to add this Mix & Match deal."
                  : `Choose at least ${deal.rule.minQuantity} item${
                      deal.rule.minQuantity === 1 ? "" : "s"
                    }.`}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Selected</span>
                  <span>{selectionMessage}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(displayedTotal)}</span>
                </div>
              </div>
              <ThemedButton
                type="button"
                disabled={!canAddDeal}
                onClick={handleAddMixToCart}
                className="h-12 w-full justify-between"
              >
                <span>Add Mix to Cart</span>
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
          allowedVariantOptionIds={activeProduct?.allowedVariantOptionIds}
          modifierIncludedRuleOverrides={activeProduct?.modifierGroupOverrides}
          onConfiguredItem={handleConfiguredItem}
        />
      ) : null}
    </>
  )
}
