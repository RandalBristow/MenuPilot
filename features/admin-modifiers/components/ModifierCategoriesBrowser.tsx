"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, X } from "lucide-react"
import { CompactRecordRow } from "@/components/themed/CompactRecordRow"
import { CompactRecordStatusIcon } from "@/components/themed/CompactRecordStatusIcon"
import { ModifierCategoryFormDialog } from "@/features/admin-modifiers/components/ModifierCategoryFormDialog"
import {
  MODIFIER_ADMIN_ROW_CARD_CLASS,
  MODIFIER_ADMIN_ROW_CLASS,
} from "@/features/admin-modifiers/components/modifier-admin-row-styles"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import type { ModifierGroupCategory } from "@/features/admin-modifiers/components/ModifiersCategoryBrowser"

export function ModifierCategoriesBrowser({
  categories,
}: {
  categories: ModifierGroupCategory[]
}) {
  const [activeCategory, setActiveCategory] =
    useState<ModifierGroupCategory | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col">
      {categories.length === 0 ? (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-20">
          <ThemedCard className="p-5 text-center">
            <p className="font-semibold">No modifier categories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a category to organize modifier groups.
            </p>
          </ThemedCard>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-20">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-label={`Open modifier category ${category.name}`}
              onClick={() => setActiveCategory(category)}
              className={
                category.is_enabled
                  ? "block w-full text-left"
                  : "block w-full text-left opacity-75"
              }
            >
              <ThemedCard
                className={
                  category.is_enabled
                    ? MODIFIER_ADMIN_ROW_CARD_CLASS
                    : `${MODIFIER_ADMIN_ROW_CARD_CLASS} bg-muted/30`
                }
              >
                <CompactRecordRow
                  className={MODIFIER_ADMIN_ROW_CLASS}
                  title={category.name}
                  statusIcon={
                    <CompactRecordStatusIcon enabled={category.is_enabled} />
                  }
                  description={category.description}
                />
              </ThemedCard>
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <ThemedButton
            asChild
            variant="outline"
            size="icon"
            aria-label="Back to modifier management"
            className="size-10 bg-background text-foreground hover:bg-muted"
          >
            <Link href="/admin/modifiers">
              <X aria-hidden="true" />
              <span className="sr-only">Back to modifier management</span>
            </Link>
          </ThemedButton>
          <ModifierCategoryFormDialog
            triggerIcon={<Plus aria-hidden="true" />}
            triggerAriaLabel="Add modifier category"
          />
        </div>
      </div>

      {activeCategory ? (
        <ModifierCategoryFormDialog
          open={Boolean(activeCategory)}
          onOpenChange={(open) => {
            if (!open) setActiveCategory(null)
          }}
          mode="edit"
          category={activeCategory}
        />
      ) : null}
    </div>
  )
}
