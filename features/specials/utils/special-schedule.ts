import type { SpecialAvailabilityWindow } from "@/features/specials/types/special"

export const SPECIAL_ADMIN_STATUSES = [
  "disabled",
  "scheduled",
  "active",
  "expired",
  "inactive_now",
] as const

export type SpecialAdminStatus = (typeof SPECIAL_ADMIN_STATUSES)[number]

export type SpecialScheduleInput = {
  isEnabled: boolean
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  availabilityWindows?: SpecialAvailabilityWindow[] | null
  currentTime: Date
  timeZone?: string | null
}

const DAY_NUMBERS_BY_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function parseTimeToMinutes(value: string | null | undefined) {
  if (!value) return null

  const [hourValue, minuteValue] = value.split(":")
  const hour = Number(hourValue)
  const minute = Number(minuteValue)

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return hour * 60 + minute
}

function getLocalDayAndMinutes(currentTime: Date, timeZone?: string | null) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const parts = formatter.formatToParts(currentTime)
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun"
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0)
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  )

  return {
    dayOfWeek: DAY_NUMBERS_BY_NAME[weekday] ?? 0,
    minutes: hour * 60 + minute,
  }
}

export function isAvailabilityWindowValid(window: SpecialAvailabilityWindow) {
  if (
    !Number.isInteger(window.dayOfWeek) ||
    window.dayOfWeek < 0 ||
    window.dayOfWeek > 6
  ) {
    return false
  }

  if (window.isAllDay) {
    return !window.startTime && !window.endTime
  }

  const startMinutes = parseTimeToMinutes(window.startTime)
  const endMinutes = parseTimeToMinutes(window.endTime)

  return (
    startMinutes !== null &&
    endMinutes !== null &&
    startMinutes < endMinutes
  )
}

export function isInsideAvailabilityWindows({
  availabilityWindows,
  currentTime,
  timeZone,
}: Pick<
  SpecialScheduleInput,
  "availabilityWindows" | "currentTime" | "timeZone"
>) {
  const windows = availabilityWindows ?? []
  if (windows.length === 0) return true

  const local = getLocalDayAndMinutes(currentTime, timeZone)

  return windows.some((window) => {
    if (!isAvailabilityWindowValid(window)) return false
    if (window.dayOfWeek !== local.dayOfWeek) return false
    if (window.isAllDay) return true

    const startMinutes = parseTimeToMinutes(window.startTime)
    const endMinutes = parseTimeToMinutes(window.endTime)

    return (
      startMinutes !== null &&
      endMinutes !== null &&
      local.minutes >= startMinutes &&
      local.minutes < endMinutes
    )
  })
}

export function getSpecialComputedStatus({
  isEnabled,
  startsAt,
  endsAt,
  availabilityWindows,
  currentTime,
  timeZone,
}: SpecialScheduleInput): SpecialAdminStatus {
  if (!isEnabled) return "disabled"

  const parsedStartsAt = parseDate(startsAt)
  const parsedEndsAt = parseDate(endsAt)

  if (parsedStartsAt && currentTime < parsedStartsAt) return "scheduled"
  if (parsedEndsAt && currentTime > parsedEndsAt) return "expired"

  return isInsideAvailabilityWindows({
    availabilityWindows,
    currentTime,
    timeZone,
  })
    ? "active"
    : "inactive_now"
}

export function isSpecialCurrentlyEligible(input: SpecialScheduleInput) {
  return getSpecialComputedStatus(input) === "active"
}
