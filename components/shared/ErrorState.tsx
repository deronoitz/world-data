import { CloudOffIcon } from "lucide-react"

import { EmptyState } from "./EmptyState"

/** "Couldn't load" panel with a retry action. */
export function ErrorState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children: React.ReactNode
  action: React.ReactNode
  className?: string
}) {
  return (
    <EmptyState icon={CloudOffIcon} title={title} action={action} className={className}>
      {children}
    </EmptyState>
  )
}
