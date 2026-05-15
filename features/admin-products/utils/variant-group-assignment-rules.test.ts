import { describe, expect, it } from "vitest"
import {
  ACTIVE_VARIANT_GROUP_ERROR,
  getVariantGroupAssignmentEnableError,
} from "./variant-group-assignment-rules"

describe("getVariantGroupAssignmentEnableError", () => {
  it("allows first enabled variant group", () => {
    expect(
      getVariantGroupAssignmentEnableError({
        assignments: [],
        assignmentId: null,
        isEnabled: true,
      })
    ).toBeNull()
  })

  it("blocks second enabled variant group", () => {
    expect(
      getVariantGroupAssignmentEnableError({
        assignments: [{ id: "assignment-1", is_enabled: true }],
        assignmentId: null,
        isEnabled: true,
      })
    ).toBe(ACTIVE_VARIANT_GROUP_ERROR)
  })

  it("allows disabled assignment when another enabled assignment exists", () => {
    expect(
      getVariantGroupAssignmentEnableError({
        assignments: [{ id: "assignment-1", is_enabled: true }],
        assignmentId: null,
        isEnabled: false,
      })
    ).toBeNull()
  })

  it("allows enabling assignment only when no other enabled assignment exists", () => {
    expect(
      getVariantGroupAssignmentEnableError({
        assignments: [
          { id: "assignment-1", is_enabled: false },
          { id: "assignment-2", is_enabled: false },
        ],
        assignmentId: "assignment-2",
        isEnabled: true,
      })
    ).toBeNull()

    expect(
      getVariantGroupAssignmentEnableError({
        assignments: [
          { id: "assignment-1", is_enabled: true },
          { id: "assignment-2", is_enabled: false },
        ],
        assignmentId: "assignment-2",
        isEnabled: true,
      })
    ).toBe(ACTIVE_VARIANT_GROUP_ERROR)
  })
})
