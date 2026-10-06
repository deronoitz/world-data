import { check, withUser } from "@/lib/api/route"
import { indicatorCode } from "@/lib/api/validate"

export const DELETE = withUser<RouteContext<"/api/indicators/[code]">>(
  async ({ ctx, supabase }) => {
    const code = indicatorCode(decodeURIComponent((await ctx.params).code), "code")
    const { error } = await supabase.from("saved_indicators").delete().eq("indicator_code", code)
    check(error)
    return new Response(null, { status: 204 })
  }
)
