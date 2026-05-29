export type ModifierOptionReferenceCheck = {
  key: string
  table: string
  column: string
  label: string
}

export type ModifierOptionDeleteResult =
  | {
      status: "deleted"
      message: string
    }
  | {
      status: "blocked"
      message: string
      blockingReferences: ModifierOptionReferenceCheck[]
    }
  | {
      status: "error"
      message: string
    }

export const MODIFIER_OPTION_REFERENCE_CHECKS = [
  {
    key: "product_default_modifier_options",
    table: "product_default_modifier_options",
    column: "modifier_option_id",
    label: "product default modifier selections",
  },
  {
    key: "product_modifier_option_overrides",
    table: "product_modifier_option_overrides",
    column: "modifier_option_id",
    label: "product-specific option overrides",
  },
  {
    key: "product_variant_modifier_option_availability_rules",
    table: "product_variant_modifier_option_availability_rules",
    column: "modifier_option_id",
    label: "variant-specific availability rules",
  },
  {
    key: "product_variant_modifier_option_price_overrides",
    table: "product_variant_modifier_option_price_overrides",
    column: "modifier_option_id",
    label: "variant-specific price overrides",
  },
  {
    key: "order_item_modifiers",
    table: "order_item_modifiers",
    column: "modifier_option_id",
    label: "order history",
  },
  {
    key: "product_modifier_option_price_rules",
    table: "product_modifier_option_price_rules",
    column: "modifier_option_id",
    label: "legacy product option price rules",
  },
  {
    key: "product_modifier_option_availability_rules",
    table: "product_modifier_option_availability_rules",
    column: "modifier_option_id",
    label: "legacy product option availability rules",
  },
  {
    key: "modifier_option_dependency_rules_option",
    table: "modifier_option_dependency_rules",
    column: "modifier_option_id",
    label: "modifier option dependency rules",
  },
  {
    key: "modifier_option_dependency_rules_dependency",
    table: "modifier_option_dependency_rules",
    column: "depends_on_modifier_option_id",
    label: "modifier option dependency rules",
  },
] as const satisfies readonly ModifierOptionReferenceCheck[]

export type ModifierOptionReferenceChecker = (
  check: ModifierOptionReferenceCheck
) => Promise<boolean>

export async function getBlockingModifierOptionReferences(
  hasReference: ModifierOptionReferenceChecker
) {
  const results = await Promise.all(
    MODIFIER_OPTION_REFERENCE_CHECKS.map(async (check) => ({
      check,
      hasReference: await hasReference(check),
    }))
  )

  return results
    .filter((result) => result.hasReference)
    .map((result) => result.check)
}

export function getModifierOptionBlockedDeleteMessage(
  blockingReferences: ModifierOptionReferenceCheck[]
) {
  const labels = [...new Set(blockingReferences.map((check) => check.label))]

  if (labels.length === 0) {
    return "This modifier option cannot be deleted because it is in use."
  }

  return `This modifier option cannot be deleted because it is in use by ${labels.join(
    ", "
  )}.`
}

export async function safeDeleteModifierOption({
  hasReference,
  deleteOption,
}: {
  hasReference: ModifierOptionReferenceChecker
  deleteOption: () => Promise<void>
}): Promise<ModifierOptionDeleteResult> {
  const blockingReferences = await getBlockingModifierOptionReferences(
    hasReference
  )

  if (blockingReferences.length > 0) {
    return {
      status: "blocked",
      message: getModifierOptionBlockedDeleteMessage(blockingReferences),
      blockingReferences,
    }
  }

  await deleteOption()

  return {
    status: "deleted",
    message: "Modifier option deleted.",
  }
}
