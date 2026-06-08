import { beforeEach, describe, expect, it, vi } from "vitest"
import { loadActiveSpecialsForCheckout } from "./load-active-specials-for-checkout"

type MockSpecial = {
  id: string
  business_id: string
  name: string
  special_type: "line_discount" | "fixed_price_line" | "cart_discount"
  discount_type: "percentage" | "fixed_amount" | "fixed_price"
  discount_value: string
  min_order_amount: string | null
  starts_at: string | null
  ends_at: string | null
  is_enabled: boolean
  special_products: Array<{
    product_id: string
    variant_group_option_id: string | null
  }>
  special_menu_groups: Array<{ menu_group_id: string }>
  special_availability_windows: Array<{
    id: string
    day_of_week: number
    start_time: string | null
    end_time: string | null
    is_all_day: boolean
  }>
}

const supabaseMock = vi.hoisted(() => ({
  specials: [] as MockSpecial[],
  eqCalls: [] as { column: string; value: unknown }[],
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select() {
        return this
      },
      eq(column: string, value: unknown) {
        supabaseMock.eqCalls.push({ column, value })
        return this
      },
      or() {
        return this
      },
      then(
        resolve: (value: { data: MockSpecial[]; error: null }) => void
      ) {
        resolve({ data: supabaseMock.specials, error: null })
      },
    }),
  },
}))

function buildSpecial(overrides: Partial<MockSpecial> = {}): MockSpecial {
  return {
    id: "special-a",
    business_id: "business-a",
    name: "Lunch Special",
    special_type: "cart_discount",
    discount_type: "fixed_amount",
    discount_value: "5.00",
    min_order_amount: null,
    starts_at: null,
    ends_at: null,
    is_enabled: true,
    special_products: [],
    special_menu_groups: [],
    special_availability_windows: [],
    ...overrides,
  }
}

describe("loadActiveSpecialsForCheckout", () => {
  beforeEach(() => {
    supabaseMock.specials = []
    supabaseMock.eqCalls = []
  })

  it("loads specials scoped to the selected business", async () => {
    supabaseMock.specials = [buildSpecial()]

    await loadActiveSpecialsForCheckout({
      businessId: "business-a",
      currentTime: new Date("2026-06-01T16:30:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(supabaseMock.eqCalls).toEqual([
      { column: "business_id", value: "business-a" },
      { column: "is_enabled", value: true },
    ])
  })

  it("keeps no-window specials available inside the date range", async () => {
    supabaseMock.specials = [buildSpecial()]

    const specials = await loadActiveSpecialsForCheckout({
      businessId: "business-a",
      currentTime: new Date("2026-06-01T16:30:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(specials).toHaveLength(1)
  })

  it("loads lunch-window specials when current local time matches", async () => {
    supabaseMock.specials = [
      buildSpecial({
        special_availability_windows: [
          {
            id: "window-a",
            day_of_week: 1,
            start_time: "11:00",
            end_time: "14:00",
            is_all_day: false,
          },
        ],
      }),
    ]

    const specials = await loadActiveSpecialsForCheckout({
      businessId: "business-a",
      currentTime: new Date("2026-06-01T16:30:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(specials).toHaveLength(1)
    expect(specials[0].availabilityWindows).toEqual([
      {
        id: "window-a",
        dayOfWeek: 1,
        startTime: "11:00",
        endTime: "14:00",
        isAllDay: false,
      },
    ])
  })

  it("filters specials outside the current local availability window", async () => {
    supabaseMock.specials = [
      buildSpecial({
        special_availability_windows: [
          {
            id: "window-a",
            day_of_week: 1,
            start_time: "13:00",
            end_time: "14:00",
            is_all_day: false,
          },
        ],
      }),
    ]

    const specials = await loadActiveSpecialsForCheckout({
      businessId: "business-a",
      currentTime: new Date("2026-06-01T16:30:00.000Z"),
      timeZone: "America/New_York",
    })

    expect(specials).toEqual([])
  })
})
