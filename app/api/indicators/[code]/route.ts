import { withUser } from "@/lib/api/route"
import { indicatorCode } from "@/lib/api/validate"
import { removeSavedIndicator } from "@/lib/data/indicators"

export const DELETE = withUser<RouteContext<"/api/indicators/[code]">>(async ({ ctx, userId }) => {
  const code = indicatorCode(decodeURIComponent((await ctx.params).code), "code")
  await removeSavedIndicator(userId, code)
  return new Response(null, { status: 204 })
})
