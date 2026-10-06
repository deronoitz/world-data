import { NextResponse, type NextRequest } from "next/server"

import { signOut } from "@/auth"

export async function POST(request: NextRequest) {
  await signOut({ redirect: false })
  return NextResponse.redirect(new URL("/countries", request.nextUrl.origin), { status: 303 })
}
