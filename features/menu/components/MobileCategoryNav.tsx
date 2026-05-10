"use client"

type CategoryLink = {
  id: string
  name: string
}

type MobileCategoryNavProps = {
  categories: CategoryLink[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string) => void
}

export function MobileCategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: MobileCategoryNavProps) {
  return (
    <div className="px-4 pb-3 md:hidden">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectCategory(group.id)}
            className={
              selectedCategoryId === group.id
                ? "snap-start whitespace-nowrap rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "snap-start whitespace-nowrap rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
            }
          >
            {group.name}
          </button>
        ))}
      </div>
    </div>
  )
}
