import "server-only"

import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import { ValidationError } from "./validate"

type Supabase = Awaited<ReturnType<typeof createClient>>

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

/**
 * Wraps a route handler: resolves the signed-in user (401 otherwise) and maps
 * validation / database errors to JSON error responses.
 */
export function withUser<Ctx>(
  handler: (args: { req: Request; ctx: Ctx; supabase: Supabase; user: User }) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx) => {
    if (!isSupabaseConfigured) {
      return json({ error: "Supabase is not configured" }, { status: 503 })
    }
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return json({ error: "Unauthorized" }, { status: 401 })
      return await handler({ req, ctx, supabase, user })
    } catch (error) {
      if (error instanceof ValidationError) {
        return json({ error: error.message }, { status: 400 })
      }
      if (error instanceof HttpError) {
        return json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return json({ error: "Internal server error" }, { status: 500 })
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

/** Throws for a Postgres error; maps unique violations to 409. */
export function check(error: { code?: string; message: string } | null) {
  if (!error) return
  if (error.code === "23505") throw new HttpError(409, "Already exists")
  if (error.code === "23514" || error.code === "22P02" || error.code === "22001") {
    throw new ValidationError(error.message)
  }
  throw new Error(error.message)
}
