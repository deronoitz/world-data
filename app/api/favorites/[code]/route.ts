import { check, withUser } from "@/lib/api/route"
import { countryCode } from "@/lib/api/validate"

export const DELETE = withUser<RouteContext<"/api/favorites/[code]">>(
  async ({ ctx, supabase }) => {
    const code = countryCode((await ctx.params).code, "code")
    const { error } = await supabase.from("favorite_countries").delete().eq("country_code", code)
    check(error)
    return new Response(null, { status: 204 })
  }
)
