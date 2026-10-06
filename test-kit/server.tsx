// Async Server Components can't be rendered by React DOM. These helpers await
// every async component in a tree first, leaving client and sync components
// (and Suspense boundaries) in place, so RTL can render the result.

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"

import { renderWithProviders } from "./render"

type AnyProps = Record<string, unknown>

function isAsyncComponent(type: unknown): type is (props: AnyProps) => Promise<ReactNode> {
  return typeof type === "function" && type.constructor.name === "AsyncFunction"
}

/** Recursively await async components in `node` and in element-valued props. */
export async function resolveServer(node: ReactNode | Promise<ReactNode>): Promise<ReactNode> {
  const value = await node
  if (Array.isArray(value)) return Promise.all(value.map((child) => resolveServer(child)))
  if (!isValidElement(value)) return value

  const element = value as ReactElement<AnyProps>
  if (isAsyncComponent(element.type)) return resolveServer(element.type(element.props))

  const props: AnyProps = {}
  let changed = false
  for (const [key, prop] of Object.entries(element.props)) {
    if (key === "children" || isValidElement(prop) || Array.isArray(prop)) {
      const resolved = await resolveServer(prop as ReactNode)
      if (resolved !== prop) {
        props[key] = resolved
        changed = true
      }
    }
  }
  if (!changed) return element
  // Pass children as arguments so static JSX children don't trip React's key warning.
  const { children, ...rest } = props
  return "children" in props && Array.isArray(children)
    ? cloneElement(element, rest, ...(children as ReactNode[]))
    : cloneElement(element, props)
}

/** resolveServer + renderWithProviders. */
export async function renderServer(
  node: ReactNode | Promise<ReactNode>,
  options?: Parameters<typeof renderWithProviders>[1]
) {
  const resolved = await resolveServer(node)
  return renderWithProviders(<>{resolved}</>, options)
}
