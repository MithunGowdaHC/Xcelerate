  // components/metrics-summary.tsx
  "use client"

  import { useMemo, useState } from "react"
  import { Card, CardContent } from "@/components/ui/card"
  import { cn } from "@/lib/utils"
  import { Eye, EyeOff } from "lucide-react"
  import { useSessionState } from "@/hooks/use-session-state"

  type Totals = Record<string, number>
  type CategoryTotals = { category: string; totals: Totals }
  type Row = Record<string, any>

  function fmtWhole(n: number) {
    if (!isFinite(n)) return "0"
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))
  }
  function fmtNumber(n: number) {
    if (!isFinite(n)) return "0"
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))
  }
  function pct(n: number) {
    if (!isFinite(n) || isNaN(n)) return "0.0%"
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(n)) + '%'
  }

  type Props = {
    fullRows: Row[] // full cleaned dataset (unfiltered)
    order: string[] // metric order (e.g. ["Impressions","Clicks",...])
    labels?: Record<string, string>
    className?: string
    dateFormat?: "YYYY-MM-DD" | "DD/MM/YYYY" | "DD-MM-YYYY"
    dateColumn?: string // default "Date"
    storageKey?: string // persistence key for hidden rows
  }

  function parseDateFromString(s: unknown, fmt?: Props["dateFormat"]) {
    if (!s && s !== 0) return null
    if (s instanceof Date) return isNaN(s.getTime()) ? null : s
    const str = String(s).trim()
    if (!str) return null

    // If normalized YYYY-MM-DD, JS Date can parse reliably
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + "T00:00:00")

    // Try DD/MM/YYYY or DD-MM-YYYY
    let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))

    // Try YYYY/MM/DD
    m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

    // Fallback: try Date constructor
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  export default function MetricsSummary({
    fullRows = [],
    order,
    labels = {},
    className = "",
    dateFormat = "YYYY-MM-DD",
    dateColumn = "Date",
    storageKey = "metrics.hidden.v1",
  }: Props) {
    if (!order || order.length === 0) return null

    // metric key detection
    const metricKeys = {
      impressions: order.find((k) => /impression/i.test(k)) ?? "Impressions",
      clicks: order.find((k) => /click/i.test(k)) ?? "Clicks",
      spend: order.find((k) => /spend/i.test(k)) ?? "Spend",
      sales: order.find((k) => /sale/i.test(k)) ?? order.find((k) => /total sales/i.test(k)) ?? "14 Day Total Sales (₹)",
      orders: order.find((k) => /order/i.test(k)) ?? "14 Day Total Orders (#)",
    }

    const columns = [
      { key: "category", label: "Category" },
      { key: metricKeys.impressions, label: labels[metricKeys.impressions] ?? "Impressions" },
      { key: metricKeys.clicks, label: labels[metricKeys.clicks] ?? "Clicks" },
      { key: metricKeys.spend, label: labels[metricKeys.spend] ?? "Spend" },
      { key: metricKeys.sales, label: labels[metricKeys.sales] ?? "Sales" },
      { key: metricKeys.orders, label: labels[metricKeys.orders] ?? "Orders" },
      { key: "__ctr", label: "CTR" },
      { key: "__cvr", label: "CVR" },
      { key: "__cpc", label: "CPC" },
      { key: "__roas", label: "ROAS" },
      { key: "__acos", label: "ACOS" },
    ] as const

    // date range UI state
    const [from, setFrom] = useState<string | "">("")
    const [to, setTo] = useState<string | "">("")
    const [appliedRange, setAppliedRange] = useState<{ from?: Date | null; to?: Date | null } | null>(null)

    // persisted hidden categories
    const [hidden, setHidden] = useSessionState<Record<string, boolean>>(storageKey, {})

    // sorting
    const [sortKey, setSortKey] = useState<string>("category")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    // prepare dataset: group by category from the filtered rows
    const filteredRows = useMemo(() => {
      if (!appliedRange) return fullRows
      const fromD = appliedRange.from ? new Date(appliedRange.from.setHours(0, 0, 0, 0)) : null
      const toD = appliedRange.to ? new Date(appliedRange.to.setHours(23, 59, 59, 999)) : null
      return fullRows.filter((r) => {
        const d = parseDateFromString(r[dateColumn], dateFormat)
        if (!d) return false
        if (fromD && d < fromD) return false
        if (toD && d > toD) return false
        return true
      })
    }, [fullRows, appliedRange, dateColumn, dateFormat])

    const { totals, byCategory } = useMemo(() => {
      // compute totals for filteredRows
      const totals: Totals = {}
      order.forEach((k) => (totals[k] = 0))
      for (const r of filteredRows) {
        order.forEach((k) => {
          const raw = r[k]
          const n = Number(String(raw).replace(/[^0-9.\-]/g, "")) || 0
          totals[k] += n
        })
      }

      // byCategory aggregation
      const hasCategory = filteredRows.length > 0 && "Category" in filteredRows[0]
      const map = new Map<string, Totals>()
      if (hasCategory) {
        for (const r of filteredRows) {
          const cat = String(r["Category"] ?? "Uncategorized").trim() || "Uncategorized"
          if (!map.has(cat)) {
            const base: Totals = {}
            order.forEach((k) => (base[k] = 0))
            map.set(cat, base)
          }
          const agg = map.get(cat)!
          order.forEach((k) => {
            const raw = r[k]
            const n = Number(String(raw).replace(/[^0-9.\-]/g, "")) || 0
            agg[k] += n
          })
        }
      }
      const byCategory: CategoryTotals[] = Array.from(map.entries()).map(([category, totals]) => ({ category, totals }))
      byCategory.sort((a, b) => a.category.localeCompare(b.category))
      return { totals, byCategory }
    }, [filteredRows, order])

    // prepare rows with computed metrics
    const prepared = useMemo(() => {
      return byCategory.map((row) => {
        const imp = Number(row.totals[metricKeys.impressions] ?? 0)
        const clk = Number(row.totals[metricKeys.clicks] ?? 0)
        const sp = Number(row.totals[metricKeys.spend] ?? 0)
        const sa = Number(row.totals[metricKeys.sales] ?? 0)
        const od = Number(row.totals[metricKeys.orders] ?? 0)

        const ctr = imp > 0 ? (clk / imp) * 100 : 0 // percent
        const cvr = clk > 0 ? (od / clk) * 100 : 0 // percent
        const cpc = clk > 0 ? sp / clk : 0
        const roas = sp > 0 ? sa / sp : 0
        const acos = sa > 0 ? (sp / sa) * 100 : 0

        return {
          category: row.category,
          totals: row.totals,
          __computed: {
            ctr,
            cvr,
            cpc,
            roas,
            acos,
          },
        }
      })
    }, [byCategory, metricKeys.clicks, metricKeys.impressions, metricKeys.orders, metricKeys.sales, metricKeys.spend])

    // apply hidden filter
    const visibleRows = useMemo(() => prepared.filter((r) => !hidden[r.category]), [prepared, hidden])

    // sorting
    const sortedRows = useMemo(() => {
      const arr = [...visibleRows]
      const key = sortKey
      arr.sort((a, b) => {
        let av: any, bv: any
        if (key === "category") {
          av = a.category?.toLowerCase() ?? ""
          bv = b.category?.toLowerCase() ?? ""
        } else if (key.startsWith("__")) {
          av = (a.__computed as any)[key.replace("__", "")] ?? 0
          bv = (b.__computed as any)[key.replace("__", "")] ?? 0
        } else {
          av = Number(a.totals[key] ?? 0)
          bv = Number(b.totals[key] ?? 0)
        }

        if (typeof av === "string" && typeof bv === "string") {
          if (av < bv) return sortDir === "asc" ? -1 : 1
          if (av > bv) return sortDir === "asc" ? 1 : -1
          return 0
        } else {
          av = Number(av) || 0
          bv = Number(bv) || 0
          return sortDir === "asc" ? av - bv : bv - av
        }
      })
      return arr
    }, [visibleRows, sortKey, sortDir])

    const onHeaderClick = (k: string) => {
      if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      else {
        setSortKey(k)
        setSortDir("desc")
      }
    }

    const toggleHidden = (category: string) => {
      setHidden((h) => {
        const next = { ...(h ?? {}) }
        if (next[category]) delete next[category]
        else next[category] = true
        return next
      })
    }

    const applyRange = () => {
      const f = from ? parseDateFromString(from, dateFormat) : null
      const t = to ? parseDateFromString(to, dateFormat) : null
      setAppliedRange({ from: f, to: t })
    }

    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Breakdown</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-foreground/80">Totals & categories update with date range</div>
          </div>
        </div>

        {/* Date range controls */}
        <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
          <CardContent className="py-4">
            <div className="flex gap-3 items-center flex-wrap">
              <label className="text-sm font-medium">From</label>
              <input 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                type="date" 
                className="rounded-xl px-3 py-2 border border-violet-200 dark:border-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-background"
              />
              <label className="text-sm font-medium">To</label>
              <input 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                type="date" 
                className="rounded-xl px-3 py-2 border border-violet-200 dark:border-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-background"
              />
              <button 
                onClick={applyRange} 
                className="px-4 py-2 cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 text-white font-medium hover:from-violet-600/90 hover:to-emerald-600/90 transition shadow-sm"
              >
                Apply
              </button>
              <button 
                onClick={() => { setFrom(""); setTo(""); setAppliedRange(null) }} 
                className="px-4 py-2 cursor-pointer rounded-xl border border-violet-200 dark:border-violet-800 hover:bg-muted/50 transition font-medium"
              >
                Reset
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Totals cards */}
        <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {order.map((k) => (
                <div key={k} className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-1.5 shadow-sm hover:shadow transition">
                  <div className="text-xs text-foreground/80">{labels[k] ?? k}</div>
                  <div className="text-xl font-semibold tabular-nums">{fmtWhole(Number(totals[k] ?? 0))}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category table */}
        <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
          <CardContent className="py-4">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => onHeaderClick(col.key)}
                        className="text-left px-3 py-2 font-semibold cursor-pointer select-none"
                        style={{ minWidth: col.key === "category" ? 200 : 120 }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{col.label}</span>
                          <span className="text-xs text-foreground/60">
                            {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right"> </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.category} className="border-t">
                      <td className="px-3 py-2">{row.category}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtWhole(Number(row.totals[metricKeys.impressions] ?? 0))}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtWhole(Number(row.totals[metricKeys.clicks] ?? 0))}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNumber(Number(row.totals[metricKeys.spend] ?? 0))}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNumber(Number(row.totals[metricKeys.sales] ?? 0))}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtWhole(Number(row.totals[metricKeys.orders] ?? 0))}</td>

                      <td className="px-3 py-2 tabular-nums">{pct(row.__computed.ctr)}</td>
                      <td className="px-3 py-2 tabular-nums">{pct(row.__computed.cvr)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNumber(row.__computed.cpc)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtNumber(row.__computed.roas)}</td>
                      <td className="px-3 py-2 tabular-nums">{pct(row.__computed.acos)}</td>

                      <td className="px-3 py-2 text-right">
                        <button 
                          title={hidden[row.category] ? "Show category" : "Hide category"} 
                          onClick={() => toggleHidden(row.category)} 
                          className="p-1.5 rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 transition"
                        >
                          {hidden[row.category] ? (
                            <EyeOff className="w-4 h-4 text-foreground/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-foreground/70" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Totals row: computed from filteredRows (date range applied) */}
                  <tr className="border-t bg-muted/10">
                    <td className="px-3 py-2 font-semibold">Total</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{fmtWhole(Number(totals[metricKeys.impressions] ?? 0))}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{fmtWhole(Number(totals[metricKeys.clicks] ?? 0))}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{fmtNumber(Number(totals[metricKeys.spend] ?? 0))}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{fmtNumber(Number(totals[metricKeys.sales] ?? 0))}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{fmtWhole(Number(totals[metricKeys.orders] ?? 0))}</td>

                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {pct((Number(totals[metricKeys.clicks] ?? 0) / Math.max(1, Number(totals[metricKeys.impressions] ?? 0))) * 100)}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {pct((Number(totals[metricKeys.orders] ?? 0) / Math.max(1, Number(totals[metricKeys.clicks] ?? 0))) * 100)}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {fmtNumber(Number(totals[metricKeys.spend] ?? 0) / Math.max(1, Number(totals[metricKeys.clicks] ?? 0)))}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {fmtNumber(Number(totals[metricKeys.sales] ?? 0) / Math.max(1, Number(totals[metricKeys.spend] ?? 0)))}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold">
                      {pct((Number(totals[metricKeys.spend] ?? 0) / Math.max(1, Number(totals[metricKeys.sales] ?? 0))) * 100)}
                    </td>

                    <td className="px-3 py-2 text-right" />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Hidden categories quick list */}
        {Object.keys(hidden ?? {}).length > 0 && (
          <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm font-semibold text-foreground/80">Hidden categories:</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(hidden).map((c) => (
                    <button 
                      key={c} 
                      onClick={() => toggleHidden(c)} 
                      className="px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }