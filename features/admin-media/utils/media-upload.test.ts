import { describe, expect, it } from "vitest"
import {
  buildMediaStoragePath,
  isValidImageContentType,
  parseMediaTags,
  sanitizeFileName,
  validateImageFile,
  validateImportUrl,
  validateMediaName,
} from "./media-upload"

describe("media upload helpers", () => {
  it("validates image files", () => {
    expect(
      validateImageFile({
        name: "pizza.png",
        size: 1024,
        type: "image/png",
      })
    ).toBeNull()
  })

  it("rejects non-image files", () => {
    expect(
      validateImageFile({
        name: "notes.pdf",
        size: 1024,
        type: "application/pdf",
      })
    ).toBe("Media assets must be image files.")
  })

  it("rejects oversized files", () => {
    expect(
      validateImageFile({
        name: "huge.jpg",
        size: 5 * 1024 * 1024 + 1,
        type: "image/jpeg",
      })
    ).toBe("Image files must be 5 MB or smaller.")
  })

  it("validates http and https import URLs", () => {
    expect(validateImportUrl("https://example.com/pizza.jpg")).toBeNull()
    expect(validateImportUrl("http://example.com/pizza.jpg")).toBeNull()
  })

  it("rejects invalid import URLs", () => {
    expect(validateImportUrl("pizza.jpg")).toBe("Enter a valid image URL.")
    expect(validateImportUrl("ftp://example.com/pizza.jpg")).toBe(
      "Image URL must start with http or https."
    )
  })

  it("validates image content types", () => {
    expect(isValidImageContentType("image/webp")).toBe(true)
    expect(isValidImageContentType("image/png; charset=utf-8")).toBe(true)
    expect(isValidImageContentType("text/html")).toBe(false)
  })

  it("sanitizes filenames", () => {
    expect(sanitizeFileName(" Deluxe Pizza 1.PNG ")).toBe("deluxe-pizza-1.png")
  })

  it("builds safe storage paths", () => {
    expect(
      buildMediaStoragePath({
        businessId: "business-1",
        folder: "Pizza Photos",
        fileName: "Deluxe Pizza",
        contentType: "image/jpeg",
        uniqueId: "abc123",
      })
    ).toBe("business-1/pizza-photos/abc123-deluxe-pizza.jpg")
  })

  it("requires a media name", () => {
    expect(validateMediaName("Deluxe pizza")).toBeNull()
    expect(validateMediaName("  ")).toBe("Name is required.")
  })

  it("parses comma-separated tags", () => {
    expect(parseMediaTags("pizza, toppings, , cheese ")).toEqual([
      "pizza",
      "toppings",
      "cheese",
    ])
  })
})
