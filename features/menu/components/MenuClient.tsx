"use client"

import { useState } from "react"
import { MenuPage } from "./MenuPage"
import {
  ProductConfigurator,
  type ProductConfig,
} from "@/features/product-configurator/components/ProductConfigurator"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"
import { CartHeaderButton } from "@/features/cart/components/CartHeaderButton"
import { getMenuCheckoutHref } from "@/features/menu/utils/menu-checkout-routes"
import type { PublicSpecial } from "@/features/specials/types/public-special"
import { DealBuilder } from "@/features/specials/components/DealBuilder"
import { MixAndMatchBuilder } from "@/features/specials/components/MixAndMatchBuilder"

type MenuPageProps = React.ComponentProps<typeof MenuPage>

type MenuClientProps = {
  businessName: MenuPageProps["businessName"]
  businessSlug?: string | null
  businessStatus?: string | null
  menu: MenuPageProps["menu"]
  activeSpecials?: PublicSpecial[]
}

function canCustomizeProduct(product: ProductConfig) {
  if (!product.has_variants) return true

  return product.variants.some((variant) => variant.is_enabled)
}

export function MenuClient({
  businessName,
  businessSlug,
  businessStatus,
  menu,
  activeSpecials = [],
}: MenuClientProps) {
  const [open, setOpen] = useState(false)
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null)
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [selectedDealType, setSelectedDealType] = useState<
    PublicSpecial["specialType"] | null
  >(null)
  const [isDealOpen, setIsDealOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const isSetupPreview = businessStatus === "setup"
  const checkoutHref = getMenuCheckoutHref(businessSlug)

  async function handleCustomize(productId: string) {
    if (loadingProductId) return

    setLoadError(null)
    setLoadingProductId(productId)

    try {
      const config = await getProductConfig(productId, { businessSlug })
      const product = config as unknown as ProductConfig

      if (!canCustomizeProduct(product)) {
        setProductConfig(null)
        setOpen(false)
        setLoadError("This item is not currently available.")
        return
      }

      setProductConfig(product)
      setOpen(true)
    } catch (error) {
      console.error("Failed to load product config:", error)
      setLoadError(
        error instanceof Error && error.message.includes("currently sold out")
          ? error.message
          : "Could not load this item. Please try again."
      )
    } finally {
      setLoadingProductId(null)
    }
  }

  function handleBuildDeal(specialId: string) {
    const special = activeSpecials.find((item) => item.id === specialId)

    setSelectedDealId(specialId)
    setSelectedDealType(special?.specialType ?? null)
    setIsDealOpen(true)
  }

  return (
    <>
      {loadError ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive shadow-lg">
          {loadError}
        </div>
      ) : null}

      <MenuPage
        businessName={businessName}
        businessSlug={businessSlug}
        menu={menu}
        activeSpecials={activeSpecials}
        onCustomize={handleCustomize}
        onBuildDeal={handleBuildDeal}
        loadingProductId={loadingProductId}
        loadingDealId={selectedDealId && isDealOpen ? selectedDealId : null}
        headerAction={
          isSetupPreview ? null : <CartHeaderButton checkoutHref={checkoutHref} />
        }
        previewMessage={
          isSetupPreview
            ? "Preview mode: this business is in setup and is not accepting public orders."
            : null
        }
        orderingActionsDisabled={isSetupPreview}
      />

      {productConfig ? (
        <ProductConfigurator
          product={productConfig}
          open={open}
          onOpenChange={setOpen}
          mode="create"
          businessSlug={businessSlug}
        />
      ) : null}

      {selectedDealType === "mix_and_match_fixed_unit_price" ? (
        <MixAndMatchBuilder
          open={isDealOpen}
          onOpenChange={setIsDealOpen}
          businessSlug={businessSlug}
          specialId={selectedDealId}
        />
      ) : (
        <DealBuilder
          open={isDealOpen}
          onOpenChange={setIsDealOpen}
          businessSlug={businessSlug}
          specialId={selectedDealId}
        />
      )}
    </>
  )
}
