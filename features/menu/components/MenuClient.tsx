"use client"

import { useState } from "react"
import { MenuPage } from "./MenuPage"
import { PizzaBuilder } from "@/features/product-configurator/components/PizzaBuilder"
import { getProductConfig } from "@/features/product-configurator/queries/get-product-config"

export function MenuClient({ businessName, menu }: any) {
  const [open, setOpen] = useState(false)
  const [productConfig, setProductConfig] = useState<any>(null)

async function handleCustomize(productId: string) {
  console.log("Loading product config:", productId)

  try {
    const config = await getProductConfig(productId)
    console.log("Product config loaded:", config)

    setProductConfig(config)
    setOpen(true)
  } catch (error) {
    console.error("Failed to load product config:", error)
  }
}

  return (
    <>
      <MenuPage
        businessName={businessName}
        menu={menu}
        onCustomize={handleCustomize}
      />

      {productConfig && (
        <PizzaBuilder
          product={productConfig}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}