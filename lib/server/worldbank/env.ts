import "server-only"

const DEFAULT_BASE_URL = "https://api.worldbank.org/v2"

/**
 * How long a page waits for the World Bank before showing an error. Uncached
 * requests can take minutes; the request keeps running in the background and
 * its response is cached, so retrying later is usually instant.
 */
export const WORLD_BANK_TIMEOUT_MS = Number(process.env.WORLD_BANK_TIMEOUT_MS) || 15_000

/** World Bank API v2 base URL, without a trailing slash. */
export const WORLD_BANK_API_URL = (process.env.WORLD_BANK_API_URL || DEFAULT_BASE_URL).replace(
  /\/+$/,
  ""
)
