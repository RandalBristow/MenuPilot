export type ModifierOptionGroupDeleteResult =
  | {
      status: "deleted"
      message: string
      deletedOptionCount: number
    }
  | {
      status: "error"
      message: string
    }

export function getModifierOptionGroupDeletedMessage(deletedOptionCount: number) {
  if (deletedOptionCount === 0) {
    return "Modifier option list deleted."
  }

  return `Modifier option list deleted. ${deletedOptionCount} ${
    deletedOptionCount === 1 ? "option was" : "options were"
  } also deleted.`
}

export async function safeDeleteModifierOptionGroup({
  getOptionCount,
  deleteOptions,
  deleteOptionGroup,
}: {
  getOptionCount: () => Promise<number>
  deleteOptions: () => Promise<void>
  deleteOptionGroup: () => Promise<void>
}): Promise<ModifierOptionGroupDeleteResult> {
  const optionCount = await getOptionCount()

  if (optionCount > 0) {
    await deleteOptions()
  }

  await deleteOptionGroup()

  return {
    status: "deleted",
    message: getModifierOptionGroupDeletedMessage(optionCount),
    deletedOptionCount: optionCount,
  }
}
