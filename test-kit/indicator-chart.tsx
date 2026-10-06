// Recharts' ResponsiveContainer measures its parent, which is 0×0 in jsdom, so
// charts render nothing. Swap it for a fixed-size container:
//
//   vi.mock("recharts", async (importOriginal) =>
//     (await import("@/test-kit/indicator-chart")).withFixedSizeCharts(await importOriginal())
//   )

import { cloneElement, isValidElement, type ReactNode } from "react"

export const CHART_SIZE = { width: 640, height: 320 }

export function withFixedSizeCharts<T extends object>(recharts: T): T {
  function ResponsiveContainer({ children }: { children: ReactNode }) {
    return isValidElement(children) ? cloneElement(children, CHART_SIZE) : children
  }
  return { ...recharts, ResponsiveContainer }
}
