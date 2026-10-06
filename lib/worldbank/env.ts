const DEFAULT_BASE_URL = "https://api.worldbank.org/v2"

/** World Bank API v2 base URL, without a trailing slash. */
export const WORLD_BANK_API_URL = (process.env.WORLD_BANK_API_URL || DEFAULT_BASE_URL).replace(
  /\/+$/,
  ""
)
