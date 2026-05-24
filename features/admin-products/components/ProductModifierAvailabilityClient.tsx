"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { AdminBackButton } from "@/components/themed/AdminBackButton"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedPageHeader } from "@/components/themed/ThemedPageHeader"
import { setProductVariantModifierOptionAvailability } from "@/features/admin-products/actions/save-product-variant-modifier-option-availability"
import { isModifierOptionAvailableForVariant } from "@/features/admin-products/utils/variant-modifier-availability"
import type { ProductModifierAvailabilityData } from "@/features/admin-products/queries/get-product-modifier-availability"

type ProductModifierAvailabilityClientProps = {
  data: ProductModifierAvailabilityData
}

export function ProductModifierAvailabilityClient({
  data,
}: ProductModifierAvailabilityClientProps) {
  const router = useRouter()
  const [selectedVariantOptionId, setSelectedVariantOptionId] = useState(
    data.variantGroup?.options[0]?.id ?? ""
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const selectedVariantOption =
    data.variantGroup?.options.find(
      (option) => option.id === selectedVariantOptionId
    ) ??
    data.variantGroup?.options[0] ??
    null

  async function handleAvailabilityToggle(formData: FormData) {
    setSubmitError(null)

    try {
      await setProductVariantModifierOptionAvailability(formData)
      router.refresh()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not update modifier availability."
      )
    }
  }

  return (
    <main className="flex h-dvh min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col space-y-4">
        <div className="shrink-0 space-y-3 border-b pb-3">
          <ThemedPageHeader
            title={`${data.modifierGroup.name} Availability`}
            description={data.product.name}
          />

          {data.variantGroup ? (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {data.variantGroup.options.map((option) => {
                const isSelected = option.id === selectedVariantOption?.id

                return (
                  <ThemedButton
                    key={option.id}
                    type="button"
                    size="sm"
                    onClick={() => setSelectedVariantOptionId(option.id)}
                    className={
                      isSelected
                        ? "shrink-0"
                        : "shrink-0 border bg-background text-foreground hover:bg-muted"
                    }
                  >
                    {option.name}
                  </ThemedButton>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
          {!data.variantGroup ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variant group assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign a reusable variant group before managing availability.
              </p>
            </ThemedCard>
          ) : !selectedVariantOption ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No variant options available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add enabled variant options before managing availability.
              </p>
            </ThemedCard>
          ) : data.modifierGroup.options.length === 0 ? (
            <ThemedCard className="p-5 text-center">
              <p className="font-semibold">No modifier options available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add enabled modifier options before managing availability.
              </p>
            </ThemedCard>
          ) : (
            data.modifierGroup.options.map((option) => {
              const isAvailable = isModifierOptionAvailableForVariant({
                selectedVariantOptionId: selectedVariantOption.id,
                modifierGroupId: data.modifierGroup.id,
                modifierOptionId: option.id,
                availabilityRules: data.availabilityRules,
              })

              return (
                <ThemedCard key={option.id} className="overflow-hidden p-0">
                  <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {option.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isAvailable
                          ? "Available"
                          : "Unavailable for this variant"}
                      </p>
                    </div>

                    <form action={handleAvailabilityToggle} className="shrink-0">
                      <input
                        type="hidden"
                        name="productId"
                        value={data.product.id}
                      />
                      <input
                        type="hidden"
                        name="variantGroupId"
                        value={data.variantGroup?.id ?? ""}
                      />
                      <input
                        type="hidden"
                        name="variantGroupOptionId"
                        value={selectedVariantOption.id}
                      />
                      <input
                        type="hidden"
                        name="modifierGroupId"
                        value={data.modifierGroup.id}
                      />
                      <input
                        type="hidden"
                        name="modifierOptionId"
                        value={option.id}
                      />
                      <input
                        type="hidden"
                        name="isAvailable"
                        value={String(!isAvailable)}
                      />
                      <ThemedButton
                        type="submit"
                        size="icon"
                        variant="outline"
                        aria-label={
                          isAvailable
                            ? "Make unavailable for this variant"
                            : "Make available for this variant"
                        }
                        className="size-9 bg-background text-foreground hover:bg-muted"
                      >
                        {isAvailable ? (
                          <ThumbsUp aria-hidden="true" />
                        ) : (
                          <ThumbsDown aria-hidden="true" />
                        )}
                      </ThemedButton>
                    </form>
                  </div>
                </ThemedCard>
              )
            })
          )}

          {submitError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-background pt-3">
          <div className="flex justify-end">
            <AdminBackButton
              fallbackHref={`/admin/products/modifier-groups?productId=${data.product.id}`}
              label="Back to modifier assignments"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
