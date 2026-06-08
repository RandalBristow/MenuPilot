import { AdminBackButton } from "@/components/themed/AdminBackButton"
import {
  ThemedSheet,
  ThemedSheetContent,
} from "@/components/themed/ThemedSheet"
import {
  ProductPanelFooter,
  ProductPanelHeader,
} from "@/features/admin-products/components/ProductAdminFormParts"
import {
  PRODUCT_ADMIN_PANEL_BODY_CLASS,
  PRODUCT_ADMIN_PANEL_PAGE_CLASS,
  PRODUCT_ADMIN_SHEET_PANEL_CLASS,
} from "@/features/admin-products/components/product-admin-panel-styles"
import { saveSpecial } from "@/features/specials/actions/save-special"
import { SpecialFormFields } from "@/features/specials/components/SpecialFormFields"
import { getSpecialAdminFormData } from "@/features/specials/queries/get-specials-admin-data"
import { getSpecialAdminBaseHref } from "@/features/specials/utils/special-admin-routes"

type SpecialFormPageProps = {
  businessSlug: string
  specialId?: string
}

export async function SpecialFormPage({
  businessSlug,
  specialId,
}: SpecialFormPageProps) {
  const data = await getSpecialAdminFormData({ businessSlug, specialId })
  const isEditMode = Boolean(data.special)
  const listHref = getSpecialAdminBaseHref(businessSlug)

  return (
    <main className={PRODUCT_ADMIN_PANEL_PAGE_CLASS}>
      <ThemedSheet open>
        <ThemedSheetContent
          side="bottom"
          showCloseButton={false}
          className={PRODUCT_ADMIN_SHEET_PANEL_CLASS}
        >
          <ProductPanelHeader
            title={isEditMode ? "Edit Special" : "New Special"}
            description={
              isEditMode
                ? `Update special settings for ${data.business.name}.`
                : `Create a reusable special for ${data.business.name}.`
            }
          />

          <form action={saveSpecial} className="flex min-h-0 flex-1 flex-col">
            <div className={PRODUCT_ADMIN_PANEL_BODY_CLASS}>
              <SpecialFormFields data={data} businessSlug={businessSlug} />
            </div>

            <ProductPanelFooter
              closeControl={
                <AdminBackButton
                  fallbackHref={listHref}
                  label="Back to specials"
                />
              }
              submitLabel={isEditMode ? "Save special" : "Create special"}
            />
          </form>
        </ThemedSheetContent>
      </ThemedSheet>
    </main>
  )
}
