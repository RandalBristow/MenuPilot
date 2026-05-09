import { ThemedCard } from "@/components/themed/ThemedCard"
import type {
  CartItem,
  CartModifier,
} from "@/features/cart/types/cart"

type Props = {
  items: CartItem[]
  subtotal: number
}

type ModifierGroup = {
  groupId: string
  groupName: string
  modifiers: CartModifier[]
}

function groupModifiers(modifiers: CartModifier[]) {
  return modifiers.reduce<ModifierGroup[]>((groups, modifier) => {
    const group = groups.find((item) => item.groupId === modifier.groupId)

    if (group) {
      group.modifiers.push(modifier)
      return groups
    }

    return [
      ...groups,
      {
        groupId: modifier.groupId,
        groupName: modifier.groupName,
        modifiers: [modifier],
      },
    ]
  }, [])
}

function formatModifierDetail(modifier: CartModifier) {
  const details = []

  if (modifier.placement !== "whole") {
    details.push(modifier.placement)
  }

  if (modifier.multiplier > 1) {
    details.push(`x${modifier.multiplier}`)
  }

  return details.length > 0 ? ` (${details.join(", ")})` : ""
}

export function CheckoutOrderSummary({ items, subtotal }: Props) {
  return (
    <ThemedCard className="p-4 sm:p-6 lg:sticky lg:top-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.cartItemId} className="border-t pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium leading-tight">
                      {item.productName}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Qty {item.quantity}
                    </span>
                  </div>

                  {item.variantName ? (
                    <p className="text-sm text-muted-foreground">
                      {item.variantName}
                    </p>
                  ) : null}
                </div>

                <p className="shrink-0 font-medium">
                  ${item.totalPrice.toFixed(2)}
                </p>
              </div>

              {item.modifiers.length > 0 ? (
                <div className="mt-3 space-y-2 border-l pl-3">
                  {groupModifiers(item.modifiers).map((group) => (
                    <div key={group.groupId}>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {group.groupName}
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {group.modifiers.map((modifier) => (
                          <li key={`${item.cartItemId}-${modifier.optionId}`}>
                            {modifier.optionName}
                            {formatModifierDetail(modifier)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </ThemedCard>
  )
}
