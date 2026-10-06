import type { User } from "next-auth"

import type { SessionUser } from "@/stores/user-data-store"

export function toSessionUser(user: User | null | undefined): SessionUser | null {
  if (!user?.id) return null
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    avatarUrl: user.image ?? null,
  }
}
