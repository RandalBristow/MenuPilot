import { describe, expect, it } from "vitest"
import {
  ACTIVE_BUILDER_TEMPLATES,
  BUILDER_TEMPLATES,
  isActiveBuilderTemplate,
  isBuilderTemplate,
} from "./builder-templates"

describe("builder templates", () => {
  it("lists every database-supported template", () => {
    expect(BUILDER_TEMPLATES).toEqual([
      "standard",
      "pizza",
      "wings",
      "sub",
      "salad",
      "drink",
      "combo",
    ])
  })

  it("keeps combo out of active admin-created templates", () => {
    expect(ACTIVE_BUILDER_TEMPLATES).toEqual([
      "standard",
      "pizza",
      "wings",
      "sub",
      "salad",
      "drink",
    ])
  })

  it("recognizes database-supported templates", () => {
    expect(isBuilderTemplate("combo")).toBe(true)
    expect(isBuilderTemplate("unknown")).toBe(false)
  })

  it("recognizes active templates", () => {
    expect(isActiveBuilderTemplate("drink")).toBe(true)
    expect(isActiveBuilderTemplate("combo")).toBe(false)
  })
})
