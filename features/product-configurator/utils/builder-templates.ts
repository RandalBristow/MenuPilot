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
