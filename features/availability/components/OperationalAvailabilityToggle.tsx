import { CircleSlash2, RotateCcw } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"

type OperationalAvailabilityToggleProps = {
  action: (formData: FormData) => void | Promise<void>
  itemIdField: "productId" | "optionId"
  itemId: string
  itemName: string
  businessSlug?: string
  modifierGroupId?: string
  is86d: boolean
}

export function OperationalAvailabilityToggle({
  action,
  itemIdField,
  itemId,
  itemName,
  businessSlug,
  modifierGroupId,
  is86d,
}: OperationalAvailabilityToggleProps) {
  const nextIs86d = !is86d
  const label = is86d
    ? `Make ${itemName} available`
    : `Mark ${itemName} temporarily sold out`

  return (
    <form action={action} onClick={(event) => event.stopPropagation()}>
      {businessSlug ? (
        <input type="hidden" name="businessSlug" value={businessSlug} />
      ) : null}
      <input type="hidden" name={itemIdField} value={itemId} />
      {modifierGroupId ? (
        <input type="hidden" name="modifierGroupId" value={modifierGroupId} />
      ) : null}
      <input type="hidden" name="is86d" value={String(nextIs86d)} />
      <ThemedButton
        type="submit"
        size="icon"
        variant="outline"
        aria-label={label}
        title={label}
        className={
          is86d
            ? "size-8 bg-background text-foreground hover:bg-muted"
            : "size-8 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
        }
      >
        {is86d ? (
          <RotateCcw className="size-4" aria-hidden="true" />
        ) : (
          <CircleSlash2 className="size-4" aria-hidden="true" />
        )}
      </ThemedButton>
    </form>
  )
}
