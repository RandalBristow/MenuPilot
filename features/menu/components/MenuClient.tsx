"use client"

import { useState } from "react"
import { MenuPage } from "./MenuPage"
import { PizzaBuilder } from "@/features/product-configurator/components/PizzaBuilder"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"
import { CartSummaryBar } from "@/features/cart/components/CartSummaryBar"

type MenuPageProps = React.ComponentProps<typeof MenuPage>
type ProductConfig = React.ComponentProps<typeof PizzaBuilder>["product"]

type MenuClientProps = {
  businessName: MenuPageProps["businessName"]
  menu: MenuPageProps["menu"]
}

export function MenuClient({ businessName, menu }: MenuClientProps) {
  const [open, setOpen] = useState(false)
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null)
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function handleCustomize(productId: string) {
    if (loadingProductId) return

    setLoadError(null)
    setLoadingProductId(productId)

    try {
      const config = await getProductConfig(productId)

      setProductConfig(config as unknown as ProductConfig)
      setOpen(true)
    } catch (error) {
      console.error("Failed to load product config:", error)
      setLoadError("Could not load this item. Please try again.")
    } finally {
      setLoadingProductId(null)
    }
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
        menu={menu}
        onCustomize={handleCustomize}
        loadingProductId={loadingProductId}
      />

      {productConfig ? (
        <PizzaBuilder
          product={productConfig}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}

      <CartSummaryBar />
    </>
  )
}