import { describe, expect, it } from "vitest"
import {
  getSpecialComputedStatus,
  isAvailabilityWindowValid,
} from "@/features/specials/utils/special-schedule"

const mondayLunch = new Date("2026-06-01T16:30:00.000Z")

describe("special schedule helpers", () => {
  it("returns disabled before schedule checks", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: false,
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: "2026-06-30T00:00:00.000Z",
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("disabled")
  })

  it("returns scheduled when the campaign starts in the future", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: true,
        startsAt: "2026-06-02T00:00:00.000Z",
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("scheduled")
  })

  it("returns expired when the campaign ended in the past", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: true,
        endsAt: "2026-05-31T23:59:00.000Z",
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("expired")
  })

  it("treats no windows as active inside the campaign date range", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: true,
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: "2026-06-30T00:00:00.000Z",
        availabilityWindows: [],
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("active")
  })

  it("returns active inside a local lunch window", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: true,
        availabilityWindows: [
          {
            dayOfWeek: 1,
            startTime: "11:00",
            endTime: "14:00",
            isAllDay: false,
          },
        ],
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("active")
  })

  it("returns inactive now outside a local lunch window", () => {
    expect(
      getSpecialComputedStatus({
        isEnabled: true,
        availabilityWindows: [
          {
            dayOfWeek: 1,
            startTime: "13:00",
            endTime: "14:00",
            isAllDay: false,
          },
        ],
        currentTime: mondayLunch,
        timeZone: "America/New_York",
      })
    ).toBe("inactive_now")
  })

  it("rejects overnight windows for the MVP", () => {
    expect(
      isAvailabilityWindowValid({
        dayOfWeek: 1,
        startTime: "22:00",
        endTime: "02:00",
        isAllDay: false,
      })
    ).toBe(false)
  })
})
