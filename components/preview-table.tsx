"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type PreviewTableProps = {
  rows?: Record<string, any>[]
  maxRows?: number
  className?: string
}

function isNumericLike(v: any) {
  if (typeof v === "number") return true
  if (typeof v === "string") {
    const s = v.trim()
    if (!s) return false
    return !isNaN(Number(s.replace(/,/g, "")))
  }
  return false
}

function asWhole(v: any) {
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""))
  if (!isFinite(n)) return String(v ?? "")
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n))
}

export default function PreviewTable({ rows = [], maxRows = 10, className = "" }: PreviewTableProps) {
  if (!rows.length) return null
  const headers = Object.keys(rows[0] ?? {})
  const slice = rows.slice(0, maxRows)

  return (
    <div className={cn("rounded-2xl border overflow-hidden bg-background/70 backdrop-blur", className)}>
      <ScrollArea className="w-full">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row, i) => (
                <tr key={i} className={cn("border-t", i % 2 === 0 ? "bg-background/50" : "bg-muted/30")}>
                  {headers.map((h) => {
                    const val = row[h]
                    const display = isNumericLike(val) ? asWhole(val) : String(val ?? "")
                    return (
                      <td key={h} className="px-3 py-2 whitespace-nowrap text-foreground/80 tabular-nums">
                        {display}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
      <div className="px-3 pb-3 text-xs text-foreground/80">{`Showing ${slice.length} of ${rows.length} rows`}</div>
    </div>
  )
}
