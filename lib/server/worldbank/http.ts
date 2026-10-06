import "server-only"

import { WORLD_BANK_API_URL, WORLD_BANK_TIMEOUT_MS } from "./env"
import type { WbErrorBody, WbMeta } from "./raw-types"

export const DAY = 60 * 60 * 24

export class WorldBankError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = "WorldBankError"
  }

  /** WB error 120 = "Invalid value" (unknown country / indicator code). */
  get isInvalidValue() {
    return this.code === "120"
  }
}

function isErrorBody(json: unknown): json is WbErrorBody {
  return (
    Array.isArray(json) &&
    json.length === 1 &&
    typeof json[0] === "object" &&
    json[0] !== null &&
    "message" in json[0]
  )
}

export async function wbFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
  { revalidate = DAY, paged = false }: { revalidate?: number; paged?: boolean } = {}
): Promise<{ meta: WbMeta; rows: T[] }> {
  const url = new URL(`${WORLD_BANK_API_URL}${path}`)
  url.searchParams.set("format", "json")
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const json = await withTimeout(
    fetch(url, { next: { revalidate, tags: ["wb"] } }).then((res) => {
      if (!res.ok) {
        throw new WorldBankError("http", `World Bank API responded ${res.status}`, res.status)
      }
      return res.json() as Promise<unknown>
    })
  )
  // The API reports errors with HTTP 200 and a one-element [{ message }] body.
  if (isErrorBody(json)) {
    const msg = json[0].message[0]
    throw new WorldBankError(msg?.id ?? "unknown", msg?.value ?? "World Bank API error")
  }
  if (!Array.isArray(json) || json.length !== 2) {
    throw new WorldBankError("shape", "Unexpected World Bank API response")
  }

  const [meta, rows] = json as [WbMeta, T[] | null]
  // Unless the caller pages deliberately, a multi-page response means we'd silently drop rows.
  if (!paged && Number(meta.pages) > 1) {
    throw new WorldBankError("paging", `Response for ${path} spans ${meta.pages} pages`)
  }
  return { meta, rows: rows ?? [] }
}

/**
 * `.catch` handler for a section that can render without World Bank data. A
 * timeout is expected (uncached requests are slow); anything else is logged so
 * real failures show up in the server logs.
 */
export function recoverWith<T>(fallback: T) {
  return (error: unknown): T => {
    if (!(error instanceof WorldBankError && error.code === "timeout")) console.error(error)
    return fallback
  }
}

/**
 * Stops waiting after WORLD_BANK_TIMEOUT_MS. The request itself is not aborted:
 * an aborted request never gets cached, while one left running lands in Next's
 * fetch cache and makes the next attempt fast.
 */
function withTimeout<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const seconds = Math.round(WORLD_BANK_TIMEOUT_MS / 1000)
      reject(new WorldBankError("timeout", `World Bank API did not respond within ${seconds}s`))
    }, WORLD_BANK_TIMEOUT_MS)
  })
  request.catch(() => {}) // a late failure after the timeout is not unhandled
  return Promise.race([request, timeout]).finally(() => clearTimeout(timer))
}
