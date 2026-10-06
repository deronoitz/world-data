import { withUser } from "@/lib/server/http/handler"
import { indicatorCode } from "@/lib/server/http/validate"
import { removeSavedIndicator } from "@/lib/server/repositories/saved-indicators"

export const DELETE = withUser<RouteContext<"/api/indicators/[code]">>(async ({ ctx, userId }) => {
  const code = indicatorCode(decodeURIComponent((await ctx.params).code), "code")
  await removeSavedIndicator(userId, code)
  return new Response(null, { status: 204 })
})
