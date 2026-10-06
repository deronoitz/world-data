import "server-only"

import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { isAuthConfigured } from "@/lib/auth/env"

import { ValidationError } from "./validate"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

/** Postgres SQLSTATE of a driver error, also when Drizzle wraps it in `cause`. */
function pgCode(error: unknown): string | undefined {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ("code" in e && typeof e.code === "string") return e.code
  }
  return undefined
}

function errorResponse(error: unknown) {
  if (error instanceof ValidationError) return json({ error: error.message }, { status: 400 })
  if (error instanceof HttpError) return json({ error: error.message }, { status: error.status })
  const code = pgCode(error)
  if (code === "23505") return json({ error: "Already exists" }, { status: 409 })
  // foreign_key_violation on user_id: the JWT outlived its users row (e.g. the
  // database was reset), so the session is no longer valid.
  if (code === "23503") return json({ error: "Session expired, please sign in again" }, { status: 401 })
  // check_violation, invalid_text_representation, string_data_right_truncation
  if (code === "23514" || code === "22P02" || code === "22001") {
    return json({ error: "Invalid value" }, { status: 400 })
  }
  console.error(error)
  return json({ error: "Internal server error" }, { status: 500 })
}

/**
 * Wraps a route handler: resolves the signed-in user's id (401 otherwise) and
 * maps validation / database errors to JSON error responses. Handlers must
 * scope every query by `userId` (see lib/data/*).
 */
export function withUser<Ctx>(
  handler: (args: { req: Request; ctx: Ctx; userId: string }) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx) => {
    if (!isAuthConfigured) {
      return json({ error: "Auth is not configured" }, { status: 503 })
    }
    try {
      const userId = (await auth())?.user?.id
      if (!userId) return json({ error: "Unauthorized" }, { status: 401 })
      return await handler({ req, ctx, userId })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new ValidationError("Invalid JSON body")
  }
}
