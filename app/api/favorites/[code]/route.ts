import { withUser } from "@/lib/server/http/handler"
import { countryCode } from "@/lib/server/http/validate"
import { removeFavorite } from "@/lib/server/repositories/favorites"

export const DELETE = withUser<RouteContext<"/api/favorites/[code]">>(async ({ ctx, userId }) => {
  await removeFavorite(userId, countryCode((await ctx.params).code, "code"))
  return new Response(null, { status: 204 })
})
