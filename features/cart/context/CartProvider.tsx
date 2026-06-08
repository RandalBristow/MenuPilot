"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type {
  CartItem,
  ConfiguredCartItem,
  DealCartItem,
} from "@/features/cart/types/cart"
import {
  getCartItemCount,
  getCartSubtotal,
  isCartItem,
} from "@/features/cart/utils/cart-items"

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: ConfiguredCartItem) => void
  updateItem: (cartItemId: string, updatedItem: ConfiguredCartItem) => void
  addDealItem: (item: DealCartItem) => void
  updateDealItem: (cartItemId: string, updatedItem: DealCartItem) => void
  removeItem: (cartItemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = "menupilot-cart"

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

  const subtotal = useMemo(() => getCartSubtotal(items), [items])

  const itemCount = useMemo(() => getCartItemCount(items), [items])

  function addItem(item: ConfiguredCartItem) {
    setItems((current) => {
      const nextItems = [...current, item]
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function updateItem(cartItemId: string, updatedItem: ConfiguredCartItem) {
    setItems((current) => {
      const nextItems = current.map((item) =>
        item.cartItemId === cartItemId ? updatedItem : item
      )
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function addDealItem(item: DealCartItem) {
    setItems((current) => {
      const nextItems = [...current, item]
      writeStoredCartItems(nextItems)
      return nextItems
    })
  }

  function updateDealItem(cartItemId: string, updatedItem: DealCartItem) {
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
        addDealItem,
        updateDealItem,
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
