"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, X } from "lucide-react"
import { duplicateProduct } from "@/features/admin-products/actions/duplicate-product"
import type { DuplicateProductResult } from "@/features/admin-products/utils/duplicate-product"
import { ThemedButton } from "@/components/themed/ThemedButton"
import {
  ThemedSheet,
  ThemedSheetContent,
  ThemedSheetDescription,
  ThemedSheetHeader,
  ThemedSheetTitle,
} from "@/components/themed/ThemedSheet"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_FOOTER_CLASS,
  PRODUCT_ADMIN_PANEL_HEADER_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"

type DuplicateProductDialogProps = {
  productId: string
  productName: string
}

export function DuplicateProductDialog({
  productId,
  productName,
}: DuplicateProductDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<DuplicateProductResult | null>(null)

  async function handleSubmit(formData: FormData) {
    setResult(null)
    const duplicateResult = await duplicateProduct(formData)

    if (duplicateResult.status === "duplicated") {
      formRef.current?.reset()
      setOpen(false)
      router.push(`/admin/products/${duplicateResult.productId}`)
      router.refresh()
      return
    }

    setResult(duplicateResult)
  }

  return (
    <ThemedSheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setResult(null)
      }}
    >
      <ThemedButton
        type="button"
        size="icon"
        variant="outline"
        aria-label={`Duplicate product ${productName}`}
        className="size-8 bg-background text-foreground hover:bg-muted"
        onClick={(event) => {
          event.stopPropagation()
          setResult(null)
          setOpen(true)
        }}
      >
        <Copy aria-hidden="true" className="size-4" />
        <span className="sr-only">Duplicate product</span>
      </ThemedButton>

      <ThemedSheetContent
        side="bottom"
        showCloseButton={false}
        className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        onClick={(event) => event.stopPropagation()}
      >
        <ThemedSheetHeader className={PRODUCT_ADMIN_PANEL_HEADER_CLASS}>
          <ThemedSheetTitle>Duplicate Product</ThemedSheetTitle>
          <ThemedSheetDescription>
            Copy setup from {productName}.
          </ThemedSheetDescription>
        </ThemedSheetHeader>

        <form
          ref={formRef}
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={`${PRODUCT_ADMIN_PANEL_BODY_CLASS} pb-4`}>
            <input type="hidden" name="productId" value={productId} />

            {result ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {result.message}
              </p>
            ) : null}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">New product name</span>
                <input
                  name="newName"
                  required
                  defaultValue={`Copy of ${productName}`}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </label>

              <label className="flex items-start gap-3 rounded-md border bg-background px-3 py-2.5">
                <input
                  name="copyImage"
                  type="checkbox"
                  value="true"
                  defaultChecked
                  className="mt-1 size-4 shrink-0"
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">Copy image</span>
                  <span className="text-xs text-muted-foreground">
                    Reuse the same media record on the duplicate.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-md border bg-background px-3 py-2.5">
                <input
                  name="isEnabled"
                  type="checkbox"
                  value="true"
                  className="mt-1 size-4 shrink-0"
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">
                    Enable duplicated product
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Leave off to review edits before publishing.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className={PRODUCT_ADMIN_PANEL_FOOTER_CLASS}>
            <ThemedButton
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close"
              className="size-10 bg-background text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </ThemedButton>
            <ThemedButton
              type="submit"
              size="icon"
              aria-label="Duplicate product"
              className="size-10"
            >
              <Copy aria-hidden="true" />
              <span className="sr-only">Duplicate product</span>
            </ThemedButton>
          </div>
        </form>
      </ThemedSheetContent>
    </ThemedSheet>
  )
}
