"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Totals = Record<string, number>
type CategoryTotals = { category: string; totals: Totals }

function asWhole(n: number) {
  if (!isFinite(n)) return "0"
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n))
}

export default function MetricsSummary({
  totals,
  byCategory = [],
  order = [],
  labels = {},
  className = "",
}: {
  totals: Totals
  byCategory?: CategoryTotals[]
  order: string[]
  labels?: Record<string, string>
  className?: string
}) {
  if (!totals || order.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall totals */}
      <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {order.map((k) => (
              <div
                key={k}
                className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-1.5 shadow-sm hover:shadow transition"
              >
                <div className="text-xs text-foreground/80">{labels[k] ?? k}</div>
                <div className="text-xl font-semibold tabular-nums">{asWhole(totals[k] ?? 0)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category-wise breakdown */}
      {byCategory.length > 0 && (
        <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
          <CardContent className="py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Category</th>
                    {order.map((k) => (
                      <th key={k} className="text-left px-3 py-2 font-semibold">
                        {labels[k] ?? k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((row) => (
                    <tr key={row.category} className="border-t">
                      <td className="px-3 py-2">{row.category}</td>
                      {order.map((k) => (
                        <td key={k} className="px-3 py-2 tabular-nums">
                          {asWhole(row.totals[k] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
