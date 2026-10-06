import "server-only"

import { isCountryCode } from "@/lib/domain/country"
import { isIndicatorCode } from "@/lib/domain/indicator"
import { MAX_COMPARE, MIN_COMPARE } from "@/lib/domain/library"
import { YEAR_MAX, YEAR_MIN } from "@/lib/domain/year"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ValidationError extends Error {}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value)
}

export function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Body must be a JSON object")
  }
  return body as Record<string, unknown>
}

export function countryCode(value: unknown, field = "country_code"): string {
  if (!isCountryCode(value)) throw new ValidationError(`${field} must be an ISO3 country code`)
  return value
}

export function indicatorCode(value: unknown, field = "indicator_code"): string {
  if (!isIndicatorCode(value)) throw new ValidationError(`${field} is not a supported indicator`)
  return value
}

export function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length < 1 || trimmed.length > max) {
    throw new ValidationError(`${field} must be 1–${max} characters`)
  }
  return trimmed
}

export function optionalYear(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null
  if (typeof value !== "number" || !Number.isInteger(value) || value < YEAR_MIN || value > YEAR_MAX) {
    throw new ValidationError(`${field} must be a year between ${YEAR_MIN} and ${YEAR_MAX}`)
  }
  return value
}

export function countryCodes(value: unknown, field = "country_codes"): string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`)
  const codes = [...new Set(value)]
  if (codes.length < MIN_COMPARE || codes.length > MAX_COMPARE) {
    throw new ValidationError(`${field} must contain ${MIN_COMPARE}–${MAX_COMPARE} distinct countries`)
  }
  return codes.map((code) => countryCode(code, field))
}
