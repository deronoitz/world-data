import type { User } from "@supabase/supabase-js"

import type { SessionUser } from "@/stores/user-data-store"

export function toSessionUser(user: User | null): SessionUser | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
  }
}
