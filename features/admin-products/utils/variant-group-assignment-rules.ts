export const ACTIVE_VARIANT_GROUP_ERROR =
  "This product already has an active variant group. Disable it before assigning another."

export type VariantGroupAssignmentState = {
  id: string
  is_enabled: boolean
}

export function getVariantGroupAssignmentEnableError({
  assignments,
  assignmentId,
  isEnabled,
}: {
  assignments: VariantGroupAssignmentState[]
  assignmentId: string | null
  isEnabled: boolean
}) {
  if (!isEnabled) return null

  const hasAnotherEnabledAssignment = assignments.some(
    (assignment) =>
      assignment.is_enabled &&
      (!assignmentId || assignment.id !== assignmentId)
  )

  return hasAnotherEnabledAssignment ? ACTIVE_VARIANT_GROUP_ERROR : null
}
