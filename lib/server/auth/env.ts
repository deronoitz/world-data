import "server-only"

// Google sign-in needs its OAuth credentials.
export const isGoogleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

// One-click sign-in as a local demo user, so the app can be tried without a
// Google OAuth client. Only under `next dev` with AUTH_DEV_LOGIN=true (set by
// compose.yaml): production builds never register the provider.
export const isDevLoginEnabled =
  process.env.NODE_ENV === "development" && process.env.AUTH_DEV_LOGIN === "true"

// Sign-in needs an Auth.js secret, the database and at least one provider.
// Without them the app still works read-only and the library features are off.
export const isAuthConfigured = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL && (isGoogleConfigured || isDevLoginEnabled)
)
