import { isIndicatorCode } from "@/lib/indicators"

// World Bank economy codes are three uppercase letters/digits (e.g. IDN, XKX).
const COUNTRY_CODE = /^[A-Z0-9]{3}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ValidationError extends Error {}

export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && COUNTRY_CODE.test(value)
}

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
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1960 || value > 2100) {
    throw new ValidationError(`${field} must be a year between 1960 and 2100`)
  }
  return value
}

export function countryCodes(value: unknown, field = "country_codes"): string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`)
  const codes = [...new Set(value)]
  if (codes.length < 2 || codes.length > 6) {
    throw new ValidationError(`${field} must contain 2–6 distinct countries`)
  }
  return codes.map((code) => countryCode(code, field))
}
