"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { CartItem, CartModifier } from "@/features/cart/types/cart"

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: CartItem) => void
  updateItem: (cartItemId: string, updatedItem: CartItem) => void
  removeItem: (cartItemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = "menupilot-cart"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isCartModifier(value: unknown): value is CartModifier {
  if (!isRecord(value)) return false

  return (
    typeof value.optionId === "string" &&
    typeof value.optionName === "string" &&
    typeof value.groupId === "string" &&
    typeof value.groupName === "string" &&
    (value.placement === "left" ||
      value.placement === "whole" ||
      value.placement === "right") &&
    typeof value.multiplier === "number" &&
    typeof value.priceDelta === "number"
  )
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false

  return (
    typeof value.cartItemId === "string" &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    (typeof value.variantId === "string" || value.variantId === null) &&
    (typeof value.variantName === "string" || value.variantName === null) &&
    typeof value.quantity === "number" &&
    typeof value.unitPrice === "number" &&
    typeof value.totalPrice === "number" &&
    Array.isArray(value.modifiers) &&
    value.modifiers.every(isCartModifier)
  )
}

function readStoredCartItems() {
  if (typeof window === "undefined") return []

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!storedCart) return []

    const parsedCart: unknown = JSON.parse(storedCart)
    if (Array.isArray(parsedCart) && parsedCart.every(isCartItem)) {
      return parsedCart
    }

    window.localStorage.removeItem(CART_STORAGE_KEY)
  } catch {
    return []
  }

  return []
}

function writeStoredCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return

  try {
    if (items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    return
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setItems(readStoredCartItems())
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  function addItem(item: CartItem) {
    setItems((current) => {
      const nextItems = [...current, item]
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function updateItem(cartItemId: string, updatedItem: CartItem) {
    setItems((current) => {
      const nextItems = current.map((item) =>
        item.cartItemId === cartItemId ? updatedItem : item
      )
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function removeItem(cartItemId: string) {
    setItems((current) => {
      const nextItems = current.filter(
        (item) => item.cartItemId !== cartItemId
      )
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function clearCart() {
    writeStoredCartItems([])
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}
