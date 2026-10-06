import { withUser } from "@/lib/api/route"
import { countryCode } from "@/lib/api/validate"
import { removeFavorite } from "@/lib/data/favorites"

export const DELETE = withUser<RouteContext<"/api/favorites/[code]">>(async ({ ctx, userId }) => {
  await removeFavorite(userId, countryCode((await ctx.params).code, "code"))
  return new Response(null, { status: 204 })
})
