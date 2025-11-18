"use client"

import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type PreviewTableProps = {
  rows?: Record<string, any>[]
  maxRows?: number
  className?: string
}

function isNumericLike(v: any) {
  if (typeof v === "number") return true
  if (typeof v === "string") {
    const s = v.trim().replace(/,/g, "")
    return !isNaN(Number(s))
  }
  return false
}

function toNum(v: any) {
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""))
  return isFinite(n) ? n : 0
}

function asWhole(v: any) {
  const n = toNum(v)
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)
}

export default function PreviewTable({ rows = [], maxRows = 10, className = "" }: PreviewTableProps) {
  if (!rows.length) return null

  const headers = Object.keys(rows[0])
  const [sortKey, setSortKey] = useState<string>("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [expanded, setExpanded] = useState(false)

  // SORTING LOGIC
  const sortedRows = useMemo(() => {
    if (!sortKey) return rows

    const dataRows = [...rows]

    dataRows.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (isNumericLike(aVal) && isNumericLike(bVal)) {
        return sortDir === "asc" ? toNum(aVal) - toNum(bVal) : toNum(bVal) - toNum(aVal)
      }

      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return dataRows
  }, [rows, sortKey, sortDir])

  const slice = sortedRows.slice(0, expanded ? sortedRows.length : maxRows)

  // TOTAL ROW
  const totalRow = useMemo(() => {
    const totals: Record<string, any> = {}
    headers.forEach((h) => {
      const columnValues = rows.map((r) => r[h])

      if (columnValues.every((v) => isNumericLike(v))) {
        totals[h] = columnValues.reduce((sum, v) => sum + toNum(v), 0)
      } else {
        totals[h] = "—"
      }
    })
    return totals
  }, [rows])

  const toggleSort = (h: string) => {
    if (sortKey === h) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(h)
      setSortDir("asc")
    }
  }

  return (
    <div className={cn("rounded-2xl border overflow-hidden bg-background/70 backdrop-blur", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="text-xs text-foreground/80">{`Showing ${slice.length} of ${rows.length} rows`}</div>
        {rows.length > maxRows && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full text-xs h-7"
          >
            {expanded ? "Show Less" : "Expand All"}
          </Button>
        )}
      </div>
      
      <ScrollArea className="w-full">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40 z-10">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-semibold cursor-pointer select-none hover:bg-muted/40 transition"
                    onClick={() => toggleSort(h)}
                  >
                    <div className="inline-flex items-center gap-1">
                      {h}
                      <ArrowUpDown
                        size={14}
                        className={cn("opacity-40", sortKey === h && "opacity-100 text-violet-600")}
                      />
                    </div>
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

              {/* TOTAL ROW — ALWAYS FIXED AT BOTTOM */}
              <tr className="border-t bg-gradient-to-r from-violet-100/40 to-emerald-100/40 dark:from-violet-900/30 dark:to-emerald-900/30 font-semibold">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {isNumericLike(totalRow[h]) ? asWhole(totalRow[h]) : totalRow[h]}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}