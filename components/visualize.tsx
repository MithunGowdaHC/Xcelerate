"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import FileDropzone from "@/components/file-dropzone"
import { readFile, type Row } from "@/lib/xlsx-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCcw, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

// Colors
const SERIES_COLORS = [
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#22c55e",
  "#e11d48",
  "#14b8a6",
]
const axisTickFill = "hsl(var(--muted-foreground))"
const gridStroke = "hsl(var(--border))"

// ---------- Formatting helpers ----------
const fmtCompact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 })
const fmtWhole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const fmtNumber2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

function asNumber(v: any) {
  if (typeof v === "number") return isFinite(v) ? v : 0
  if (typeof v === "string") {
    const s = v.replace(/[^0-9.-]/g, "").trim()
    const n = Number.parseFloat(s)
    return isFinite(n) ? n : 0
  }
  return 0
}
function fmtPercent(p: number) {
  if (!isFinite(p)) return "-"
  return `${(p * 100).toFixed(1)}%`
}
function fmtRoAS(v: number) {
  if (!isFinite(v)) return "-"
  return `${v.toFixed(2)}x`
}
function isNumericLike(v: any) {
  if (typeof v === "number") return isFinite(v)
  if (typeof v === "string") {
    const s = v.replace(/,/g, "").trim()
    if (!s) return false
    return !isNaN(Number(s))
  }
  return false
}
function isDateLikeHeader(h: string) {
  const n = h.toLowerCase().replace(/[^a-z0-9]+/g, "")
  return n === "date" || n.endsWith("date")
}
function parseDateSmart(v: any): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v === "string") {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

// ---------- Column analysis and helpers ----------
type ColMeta = { key: string; isNumeric: boolean; isDate: boolean }
function analyzeColumns(rows: Row[]): ColMeta[] {
  if (!rows.length) return []
  const keys = Object.keys(rows[0])
  return keys.map((key) => {
    let numericCount = 0
    let dateCount = 0
    const sample = rows.slice(0, 30)
    for (const r of sample) {
      const v = r[key]
      if (isNumericLike(v)) numericCount++
      if (parseDateSmart(v)) dateCount++
    }
    const isNumeric = numericCount / Math.max(1, sample.length) > 0.6
    const isDate = isDateLikeHeader(key) || dateCount / Math.max(1, sample.length) > 0.6
    return { key, isNumeric, isDate }
  })
}

function normalizeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "")
}
function detectKey(keys: string[], targets: string[]) {
  for (const t of targets) {
    const tk = normalizeKey(t)
    const found = keys.find((k) => {
      const nk = normalizeKey(k)
      return nk === tk || nk.includes(tk)
    })
    if (found) return found
  }
  return undefined
}

type StdKey = "impressions" | "clicks" | "spend" | "sales" | "orders"
type StdMap = Partial<Record<StdKey, string>>

function detectStandardKeys(rows: Row[]): StdMap {
  const out: StdMap = {}
  if (!rows.length) return out
  const keys = Object.keys(rows[0])
  out.impressions = detectKey(keys, ["impressions", "impr", "imps"])
  out.clicks = detectKey(keys, ["clicks"])
  out.spend = detectKey(keys, ["spend", "cost", "adspend"])
  out.sales = detectKey(keys, ["sales", "revenue", "totalsales"])
  out.orders = detectKey(keys, ["orders", "conversions", "purchases"])
  return out
}

function detectEntities(rows: Row[]) {
  if (!rows.length) return {}
  const keys = Object.keys(rows[0])
  const dateKey = keys.find((k) => isDateLikeHeader(k))
  const campaignKey = detectKey(keys, ["campaign name", "campaignname"])
  const asinKey = detectKey(keys, ["asin"])
  const categoryKey = detectKey(keys, ["category"])
  const adTypeKey = detectKey(keys, ["ad type", "ad-type", "adtype"])
  const intentKey = detectKey(keys, ["intent"])
  return { dateKey, campaignKey, asinKey, categoryKey, adTypeKey, intentKey }
}

function groupBy<T extends Record<string, any>>(rows: T[], key: string) {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const k = String(r[key] ?? "").trim() || "(blank)"
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }
  return map
}

function aggregateSumByKeys(rows: Row[], dim: string, measures: string[]) {
  const grouped = groupBy(rows, dim)
  const out: Array<Record<string, any>> = []
  grouped.forEach((items, xVal) => {
    const row: Record<string, any> = { [dim]: xVal }
    for (const y of measures) {
      let sum = 0
      for (const it of items) sum += asNumber(it[y])
      row[y] = sum
    }
    out.push(row)
  })
  return out
}

function computeOverall(rows: Row[], std: StdMap) {
  const I = std.impressions ? rows.reduce((s, r) => s + asNumber(r[std.impressions!]), 0) : 0
  const C = std.clicks ? rows.reduce((s, r) => s + asNumber(r[std.clicks!]), 0) : 0
  const S = std.spend ? rows.reduce((s, r) => s + asNumber(r[std.spend!]), 0) : 0
  const R = std.sales ? rows.reduce((s, r) => s + asNumber(r[std.sales!]), 0) : 0
  const O = std.orders ? rows.reduce((s, r) => s + asNumber(r[std.orders!]), 0) : 0

  const RoAS = S > 0 ? R / S : Number.NaN
  const ACoS = R > 0 ? S / R : Number.NaN
  const CTR = I > 0 ? C / I : Number.NaN
  const CVR = C > 0 ? O / C : Number.NaN
  const CPC = C > 0 ? S / C : Number.NaN

  return { I, C, S, R, O, RoAS, ACoS, CTR, CVR, CPC }
}

function rankEntities(rows: Row[], entityKey: string, std: StdMap) {
  const g = groupBy(rows, entityKey)
  const list: Array<{
    name: string
    sales: number
    spend: number
    clicks: number
    impressions: number
    orders: number
    roas: number
    acos: number
    ctr: number
    cvr: number
    cpc: number
  }> = []
  g.forEach((items, name) => {
    const I = std.impressions ? items.reduce((s, r) => s + asNumber(r[std.impressions!]), 0) : 0
    const C = std.clicks ? items.reduce((s, r) => s + asNumber(r[std.clicks!]), 0) : 0
    const S = std.spend ? items.reduce((s, r) => s + asNumber(r[std.spend!]), 0) : 0
    const R = std.sales ? items.reduce((s, r) => s + asNumber(r[std.sales!]), 0) : 0
    const O = std.orders ? items.reduce((s, r) => s + asNumber(r[std.orders!]), 0) : 0
    const roas = S > 0 ? R / S : Number.NaN
    const acos = R > 0 ? S / R : Number.NaN
    const ctr = I > 0 ? C / I : Number.NaN
    const cvr = C > 0 ? O / C : Number.NaN
    const cpc = C > 0 ? S / C : Number.NaN
    list.push({ name, sales: R, spend: S, clicks: C, impressions: I, orders: O, roas, acos, ctr, cvr, cpc })
  })
  return list
}

// Simple insights heuristics
function buildInsights(list: ReturnType<typeof rankEntities>) {
  const insights: Array<{ type: "good" | "bad"; title: string; detail: string }> = []
  const sortedByRoas = [...list].filter((x) => isFinite(x.roas)).sort((a, b) => b.roas - a.roas)
  const sortedByAcos = [...list].filter((x) => isFinite(x.acos)).sort((a, b) => b.acos - a.acos)
  const sortedByCtr = [...list].filter((x) => isFinite(x.ctr)).sort((a, b) => a.ctr - b.ctr)
  const sortedByCvr = [...list].filter((x) => isFinite(x.cvr)).sort((a, b) => a.cvr - b.cvr)

  if (sortedByRoas[0])
    insights.push({
      type: "good",
      title: `Top RoAS: ${sortedByRoas[0].name}`,
      detail: `RoAS ${fmtRoAS(sortedByRoas[0].roas)}, Sales ${fmtCompact.format(sortedByRoas[0].sales)}`,
    })
  if (sortedByAcos[0] && sortedByAcos[0].spend > 0)
    insights.push({
      type: "bad",
      title: `High ACoS: ${sortedByAcos[0].name}`,
      detail: `ACoS ${fmtPercent(sortedByAcos[0].acos)}, Spend ${fmtCompact.format(sortedByAcos[0].spend)}`,
    })
  if (sortedByCtr[0] && sortedByCtr[0].impressions > 5000)
    insights.push({
      type: "bad",
      title: `Low CTR: ${sortedByCtr[0].name}`,
      detail: `CTR ${fmtPercent(sortedByCtr[0].ctr)} with ${fmtCompact.format(sortedByCtr[0].impressions)} impressions`,
    })
  if (sortedByCvr[0] && sortedByCvr[0].clicks > 100)
    insights.push({
      type: "bad",
      title: `Low CVR: ${sortedByCvr[0].name}`,
      detail: `CVR ${fmtPercent(sortedByCvr[0].cvr)} with ${fmtWhole.format(sortedByCvr[0].clicks)} clicks`,
    })

  return insights.slice(0, 4)
}

export default function Visualize() {
  // Data
  const [fileMeta, setFileMeta] = useState<{ name: string; size?: number } | null>(null)
  const [rows, setRows] = useState<Row[]>([])

  // Controls
  const [groupByDim, setGroupByDim] = useState<"date" | "campaign" | "asin" | "adtype" | "intent" | "category">("date")
  const [measure, setMeasure] = useState<string | undefined>(undefined) // selected numeric column for chart
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [topN, setTopN] = useState<"5" | "10" | "15">("10")
  const [chartKind, setChartKind] = useState<"bar" | "pie" | "donut">("bar")

  // Analysis
  const cols = useMemo(() => analyzeColumns(rows), [rows])
  const stdMap = useMemo(() => detectStandardKeys(rows), [rows])
  const entities = useMemo(() => detectEntities(rows), [rows])

  // Auto-select defaults when data changes
  useEffect(() => {
    if (!rows.length) return
    // group by: prefer date if present
    if (entities.dateKey) setGroupByDim("date")
    else if (entities.campaignKey) setGroupByDim("campaign")
    else if (entities.asinKey) setGroupByDim("asin")
    else if (entities.adTypeKey) setGroupByDim("adtype")
    else if (entities.intentKey) setGroupByDim("intent")
    else if (entities.categoryKey) setGroupByDim("category")
    // measure: prefer sales -> orders -> spend -> clicks -> impressions
    const m =
      stdMap.sales ??
      stdMap.orders ??
      stdMap.spend ??
      stdMap.clicks ??
      stdMap.impressions ??
      cols.find((c) => c.isNumeric)?.key
    setMeasure(m)
  }, [rows, cols, entities, stdMap])

  // Derived filters
  const isDateDim = groupByDim === "date" && Boolean(entities.dateKey)

  const filteredRows = useMemo(() => {
    if (!rows.length) return []
    if (!isDateDim || !entities.dateKey || !dateRange?.from || !dateRange?.to) return rows
    const from = new Date(dateRange.from)
    const to = new Date(dateRange.to)
    to.setHours(23, 59, 59, 999)
    return rows.filter((r) => {
      const d = parseDateSmart(r[entities.dateKey!])
      if (!d) return false
      return d >= from && d <= to
    })
  }, [rows, isDateDim, entities.dateKey, dateRange])

  // KPI cards (overall for filtered rows)
  const kpis = useMemo(() => computeOverall(filteredRows, stdMap), [filteredRows, stdMap])

  // Aggregation for the chart
  const aggForChart = useMemo(() => {
    // default empty shape
    const fallbackDim =
      (groupByDim === "date"
        ? entities.dateKey
        : groupByDim === "campaign"
          ? entities.campaignKey
          : groupByDim === "asin"
            ? entities.asinKey
            : groupByDim === "adtype"
              ? entities.adTypeKey
              : groupByDim === "intent"
                ? entities.intentKey
                : entities.categoryKey) || "Dimension"
    if (!filteredRows.length || !measure) {
      return { dim: fallbackDim, data: [] as Array<Record<string, any>> }
    }
    const key =
      groupByDim === "date"
        ? entities.dateKey
        : groupByDim === "campaign"
          ? entities.campaignKey
          : groupByDim === "asin"
            ? entities.asinKey
            : groupByDim === "adtype"
              ? entities.adTypeKey
              : groupByDim === "intent"
                ? entities.intentKey
                : entities.categoryKey
    if (!key) return { dim: fallbackDim, data: [] as Array<Record<string, any>> }

    const base = aggregateSumByKeys(filteredRows, key, [measure])
    // Normalize date label if date group
    const normalized =
      groupByDim === "date"
        ? base
            .map((r) => {
              const d = parseDateSmart(r[key])
              if (!d) return r
              const yyyy = d.getFullYear()
              const mm = String(d.getMonth() + 1).padStart(2, "0")
              const dd = String(d.getDate()).padStart(2, "0")
              return { ...r, [key]: `${yyyy}-${mm}-${dd}` }
            })
            .sort((a, b) => String(a[key]).localeCompare(String(b[key])))
        : base.sort((a, b) => Number(b[measure] ?? 0) - Number(a[measure] ?? 0))

    // Apply topN cut for non-date views
    const trimmed = groupByDim === "date" ? normalized : normalized.slice(0, Number(topN))
    return { dim: key, data: trimmed }
  }, [filteredRows, measure, groupByDim, entities, topN])

  // Leaderboards + insights
  const campaignBoard = useMemo(() => {
    if (!filteredRows.length || !entities.campaignKey) return []
    return rankEntities(filteredRows, entities.campaignKey, stdMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
  }, [filteredRows, entities, stdMap])

  const asinBoard = useMemo(() => {
    if (!filteredRows.length || !entities.asinKey) return []
    return rankEntities(filteredRows, entities.asinKey, stdMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
  }, [filteredRows, entities, stdMap])

  const insights = useMemo(() => {
    const base =
      (groupByDim === "campaign" && campaignBoard.length ? campaignBoard : undefined) ??
      (asinBoard.length ? asinBoard : undefined) ??
      campaignBoard
    return base ? buildInsights(base) : []
  }, [campaignBoard, asinBoard, groupByDim])

  // Upload handler
  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const data = await readFile(f)
    setRows(data)
    setFileMeta({ name: f.name, size: f.size })
    setDateRange(undefined)
  }

  // UI helpers
  const groupLabel =
    groupByDim === "date"
      ? "Date"
      : groupByDim === "campaign"
        ? "Campaign"
        : groupByDim === "asin"
          ? "ASIN"
          : groupByDim === "adtype"
            ? "Ad type"
            : groupByDim === "intent"
              ? "Intent"
              : "Category"

  return (
    <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30 shadow-sm">
      <CardHeader className="rounded-t-2xl bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
        <CardTitle className="text-lg">Visualize</CardTitle>
        <CardDescription>
          Upload a collated (or similar) report and quickly see what’s working and what needs improvement. Charts and UI
          are simplified for clarity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* 1) Upload + Filters */}
        <div className="grid gap-6">
          <FileDropzone
            label="Visualization data"
            description="Upload a CSV/XLSX file (supports Campaign Name, ASIN, Ad type, Intent, Category, Date)"
            maxFiles={1}
            onFiles={onFiles}
            displayFiles={fileMeta ? [fileMeta] : []}
            onRemove={() => {
              setRows([])
              setFileMeta(null)
              setDateRange(undefined)
            }}
            className="cursor-pointer"
          />

          {rows.length > 0 && (
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>View by</Label>
                <Select
                  value={groupByDim}
                  onValueChange={(v: "date" | "campaign" | "asin" | "adtype" | "intent" | "category") =>
                    setGroupByDim(v)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date" disabled={!entities.dateKey}>
                      Date
                    </SelectItem>
                    <SelectItem value="campaign" disabled={!entities.campaignKey}>
                      Campaign
                    </SelectItem>
                    <SelectItem value="asin" disabled={!entities.asinKey}>
                      ASIN
                    </SelectItem>
                    <SelectItem value="adtype" disabled={!entities.adTypeKey}>
                      Ad type
                    </SelectItem>
                    <SelectItem value="intent" disabled={!entities.intentKey}>
                      Intent
                    </SelectItem>
                    <SelectItem value="category" disabled={!entities.categoryKey}>
                      Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Measure</Label>
                <Select value={measure} onValueChange={(v) => setMeasure(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select measure" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(stdMap)
                      .filter(Boolean)
                      .map((k) => (
                        <SelectItem key={k} value={k!}>
                          {k}
                        </SelectItem>
                      ))}
                    {/* fallback to any numeric columns */}
                    {cols
                      .filter((c) => c.isNumeric && !Object.values(stdMap).includes(c.key))
                      .map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.key}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Top N</Label>
                <Select
                  value={topN}
                  onValueChange={(v: "5" | "10" | "15") => setTopN(v)}
                  disabled={groupByDim === "date"}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="15">Top 15</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {groupByDim === "date" ? "Top N not applicable to date trends" : "Limits bars for readability"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Chart</Label>
                <Tabs value={chartKind} onValueChange={(v) => setChartKind(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="bar">Bar</TabsTrigger>
                    <TabsTrigger value="pie" disabled={groupByDim === "date"}>
                      Pie
                    </TabsTrigger>
                    <TabsTrigger value="donut" disabled={groupByDim === "date"}>
                      Donut
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  Pie/Donut are disabled for Date view. Use Bar to see trends over time.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Date range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !entities.dateKey && "opacity-50 cursor-not-allowed",
                      )}
                      disabled={!entities.dateKey || groupByDim !== "date"}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>{groupByDim === "date" ? "Pick a date range" : "Select Date view to enable"}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                    <div className="p-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setDateRange(undefined)}
                      >
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* 2) KPI Cards */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/90">Calculated KPIs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="RoAS" value={fmtRoAS(kpis.RoAS)} tone="good" />
              <StatCard label="ACoS" value={fmtPercent(kpis.ACoS)} tone="warn" />
              <StatCard label="CTR" value={fmtPercent(kpis.CTR)} />
              <StatCard label="CVR" value={fmtPercent(kpis.CVR)} />
              <StatCard label="CPC" value={fmtNumber2.format(kpis.CPC)} />
            </div>
          </div>
        )}

        {/* 3) Visuals and Insights */}
        {rows.length > 0 && measure && aggForChart.data.length > 0 && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">{`Showing ${groupLabel} vs ${measure}`}</div>

            <ChartContainer
              config={{
                value: { label: String(measure), color: "hsl(var(--chart-1))" },
              }}
              className="h-[380px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartKind === "bar" || groupByDim === "date" ? (
                  <BarChart data={aggForChart.data} margin={{ top: 10, right: 20, left: 10, bottom: 32 }}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis
                      dataKey={aggForChart.dim}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                      minTickGap={12}
                      tick={{ fill: axisTickFill }}
                    />
                    <YAxis tickFormatter={(v) => fmtCompact.format(v as number)} tick={{ fill: axisTickFill }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ color: axisTickFill }} />
                    <Bar dataKey={measure} fill="var(--color-value)" />
                  </BarChart>
                ) : (
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ color: axisTickFill }} />
                    <Pie
                      data={aggForChart.data}
                      dataKey={measure}
                      nameKey={aggForChart.dim}
                      innerRadius={chartKind === "donut" ? 70 : 0}
                      outerRadius={120}
                      paddingAngle={2}
                      strokeWidth={1}
                    >
                      {aggForChart.data.map((_, i) => (
                        <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>

            {/* Leaderboards */}
            <div className="grid lg:grid-cols-2 gap-6">
              {campaignBoard.length > 0 && (
                <Card className="bg-background/70 backdrop-blur border">
                  <CardHeader>
                    <CardTitle className="text-base">Top Campaigns (by Sales)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardTable rows={campaignBoard} />
                  </CardContent>
                </Card>
              )}
              {asinBoard.length > 0 && (
                <Card className="bg-background/70 backdrop-blur border">
                  <CardHeader>
                    <CardTitle className="text-base">Top ASINs (by Sales)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardTable rows={asinBoard} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <Card className="bg-background/70 backdrop-blur border">
                <CardHeader>
                  <CardTitle className="text-base">Insights</CardTitle>
                  <CardDescription>Quick suggestions based on RoAS, ACoS, CTR and CVR.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {insights.map((it, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border p-3",
                        it.type === "bad" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-900/20",
                      )}
                    >
                      {it.type === "bad" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{it.title}</div>
                        <div className="text-sm text-muted-foreground">{it.detail}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- UI subcomponents ----------
function StatCard({
  label,
  value,
  tone = "neutral",
}: { label: string; value: string | number; tone?: "neutral" | "good" | "warn" }) {
  const toneCls =
    tone === "good"
      ? "border-emerald-200/50 dark:border-emerald-900/40"
      : tone === "warn"
        ? "border-amber-200/50 dark:border-amber-900/40"
        : "border-muted"
  return (
    <Card className={cn("bg-background/70 backdrop-blur shadow-sm", toneCls)}>
      <CardContent className="py-3 px-4">
        <div className="text-xs text-foreground/80">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{String(value)}</div>
      </CardContent>
    </Card>
  )
}

function LeaderboardTable({
  rows,
}: {
  rows: Array<{
    name: string
    sales: number
    spend: number
    clicks: number
    impressions: number
    orders: number
    roas: number
    acos: number
    ctr: number
    cvr: number
    cpc: number
  }>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Name</th>
            <th className="text-right px-3 py-2 font-semibold">Sales</th>
            <th className="text-right px-3 py-2 font-semibold">ACoS</th>
            <th className="text-right px-3 py-2 font-semibold">RoAS</th>
            <th className="text-right px-3 py-2 font-semibold">CTR</th>
            <th className="text-right px-3 py-2 font-semibold">CVR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtCompact.format(r.sales)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(r.acos)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtRoAS(r.roas)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(r.ctr)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(r.cvr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
