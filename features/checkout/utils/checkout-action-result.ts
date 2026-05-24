export type CheckoutActionValidationError = {
  message: string
}

export type CheckoutActionFailureResult = {
  ok: false
  error: string
}

export function formatCheckoutValidationError(
  errors: CheckoutActionValidationError[]
) {
  const messages = errors.map((error) => error.message)
  const visibleMessages = messages.slice(0, 3)
  const remainingCount = messages.length - visibleMessages.length

  if (remainingCount <= 0) {
    return visibleMessages.join(" ")
  }

  return `${visibleMessages.join(" ")} ${remainingCount} more cart item issue${
    remainingCount === 1 ? "" : "s"
  } must be fixed.`
}

export function buildCheckoutValidationFailure(
  errors: CheckoutActionValidationError[]
): CheckoutActionFailureResult {
  return {
    ok: false,
    error: formatCheckoutValidationError(errors),
  }
}
