import "server-only"

import { createClient, getUser } from "@/lib/supabase/server"

/** Favorite country codes for the signed-in user (empty when signed out). */
export async function getFavoriteCodes(): Promise<Set<string>> {
  const user = await getUser()
  if (!user) return new Set()
  const supabase = await createClient()
  const { data } = await supabase.from("favorite_countries").select("country_code")
  return new Set((data ?? []).map((row) => row.country_code))
}

/** Pinned indicator codes in the user's chosen order (empty when signed out). */
export async function getSavedIndicatorCodes(): Promise<string[]> {
  const user = await getUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from("saved_indicators")
    .select("indicator_code")
    .order("position", { ascending: true })
  return (data ?? []).map((row) => row.indicator_code)
}
