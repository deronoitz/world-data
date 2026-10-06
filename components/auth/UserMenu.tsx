"use client"

import Link from "next/link"
import { LibraryIcon, LogOutIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Skeleton } from "@/components/ui/Skeleton"
import { useUserData } from "@/stores/user-data-store"

import { GoogleButton } from "./GoogleButton"
import { initials } from "./helpers/initials"

export function UserMenu() {
  const user = useUserData((s) => s.user)
  const authReady = useUserData((s) => s.authReady)

  if (!authReady) return <Skeleton className="size-8 rounded-full" />
  if (!user) {
    return <GoogleButton size="sm" label="Sign in" aria-label="Sign in with Google" className="max-sm:[&_[data-label]]:sr-only" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Account" />}
      >
        <Avatar className="size-8">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate font-medium text-foreground">{user.name ?? "Signed in"}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/library" />}>
            <LibraryIcon />
            My library
          </DropdownMenuItem>
          <form action="/auth/signout" method="post">
            <DropdownMenuItem render={<button type="submit" className="w-full" />} nativeButton>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
