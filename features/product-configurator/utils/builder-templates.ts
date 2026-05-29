export const BUILDER_TEMPLATES = [
  "standard",
  "pizza",
  "wings",
  "sub",
  "salad",
  "drink",
  "combo",
] as const

export type BuilderTemplate = (typeof BUILDER_TEMPLATES)[number]

export const ACTIVE_BUILDER_TEMPLATES = [
  "standard",
  "pizza",
  "wings",
  "sub",
  "salad",
  "drink",
] as const satisfies readonly BuilderTemplate[]

export type ActiveBuilderTemplate = (typeof ACTIVE_BUILDER_TEMPLATES)[number]

export const BUILDER_TEMPLATE_LABELS: Record<BuilderTemplate, string> = {
  standard: "Standard",
  pizza: "Pizza",
  wings: "Wings",
  sub: "Sub",
  salad: "Salad",
  drink: "Drink",
  combo: "Combo",
}

export function isBuilderTemplate(value: unknown): value is BuilderTemplate {
  return (
    typeof value === "string" &&
    BUILDER_TEMPLATES.includes(value as BuilderTemplate)
  )
}

export function isActiveBuilderTemplate(
  value: unknown
): value is ActiveBuilderTemplate {
  return (
    typeof value === "string" &&
    ACTIVE_BUILDER_TEMPLATES.includes(value as ActiveBuilderTemplate)
  )
}

export type ProductBuilderRoute = "pizza" | "standard" | "unsupported"

const STANDARD_BUILDER_TEMPLATE_ROUTES = [
  "standard",
  "wings",
  "sub",
  "salad",
  "drink",
  "coffee",
  "appetizer",
  "side",
  "pasta",
  "kids",
  "sauce",
] as const

const UNSUPPORTED_BUILDER_TEMPLATE_ROUTES = [
  "combo",
  "special",
  "promo",
] as const

export function getProductBuilderRoute(
  builderTemplate: string | null | undefined
): ProductBuilderRoute {
  if (builderTemplate === "pizza") return "pizza"
  if (
    builderTemplate &&
    UNSUPPORTED_BUILDER_TEMPLATE_ROUTES.includes(
      builderTemplate as (typeof UNSUPPORTED_BUILDER_TEMPLATE_ROUTES)[number]
    )
  ) {
    return "unsupported"
  }
  if (
    !builderTemplate ||
    STANDARD_BUILDER_TEMPLATE_ROUTES.includes(
      builderTemplate as (typeof STANDARD_BUILDER_TEMPLATE_ROUTES)[number]
    )
  ) {
    return "standard"
  }

  return "unsupported"
}
