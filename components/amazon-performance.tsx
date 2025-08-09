"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FileDropzone from "@/components/file-dropzone"
import { readFile, type Row } from "@/lib/xlsx-utils"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"

// Colors for bars
const COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#22c55e", "#e11d48", "#14b8a6"]

// Number formatting helpers
const fmtCompact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 })
const fmtWhole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const fmt2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
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
  const campaignKey = detectKey(keys, ["campaign name", "campaignname"])
  const asinKey = detectKey(keys, ["asin"])
  const adTypeKey = detectKey(keys, ["ad type", "ad-type", "adtype"])
  const intentKey = detectKey(keys, ["intent"])
  const categoryKey = detectKey(keys, ["category"])
  return { campaignKey, asinKey, adTypeKey, intentKey, categoryKey }
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

function aggregateSumByKey(rows: Row[], dim: string, measure: string) {
  const g = groupBy(rows, dim)
  const out: Array<Record<string, any>> = []
  g.forEach((items, xVal) => {
    const row: Record<string, any> = { [dim]: xVal }
    row[measure] = items.reduce((s, r) => s + asNumber(r[measure]), 0)
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

function rankBy(rows: Row[], entityKey: string, std: StdMap) {
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
    const kpis = computeOverall(items, std)
    list.push({
      name,
      sales: kpis.R,
      spend: kpis.S,
      clicks: kpis.C,
      impressions: kpis.I,
      orders: kpis.O,
      roas: kpis.RoAS,
      acos: kpis.ACoS,
      ctr: kpis.CTR,
      cvr: kpis.CVR,
      cpc: kpis.CPC,
    })
  })
  return list
}

export default function AmazonPerformance() {
  const [fileMeta, setFileMeta] = useState<{ name: string; size?: number } | null>(null)
  const [rows, setRows] = useState<Row[]>([])

  // Know your performance controls
  const [kyMeasure, setKyMeasure] = useState<string | undefined>(undefined)
  const [kyView, setKyView] = useState<"campaign" | "asin">("campaign")
  const [kyTopN, setKyTopN] = useState<"5" | "10" | "15">("10")

  // Explore-by-attribute controls
  const [attr, setAttr] = useState<"adtype" | "intent" | "campaign" | "category">("adtype")
  const [attrMeasure, setAttrMeasure] = useState<string | undefined>(undefined)
  const [attrTopN, setAttrTopN] = useState<"5" | "10" | "15">("10")

  const std = useMemo(() => detectStandardKeys(rows), [rows])
  const entities = useMemo(() => detectEntities(rows), [rows])
  const measureOptions = useMemo(() => {
    if (!rows.length) return []
    const keys = Object.keys(rows[0])
    const preferred = [std.sales, std.orders, std.spend, std.clicks, std.impressions].filter(Boolean) as string[]
    const numericOthers = keys.filter(
      (k) => !preferred.includes(k) && typeof asNumber((rows[0] as any)[k]) === "number",
    )
    return Array.from(new Set([...preferred, ...numericOthers]))
  }, [rows, std])

  // Auto defaults after upload
  useEffect(() => {
    if (!rows.length) return
    setKyMeasure(std.sales ?? std.orders ?? std.spend ?? std.clicks ?? std.impressions ?? measureOptions[0])
    setAttrMeasure(std.sales ?? std.orders ?? std.spend ?? measureOptions[0])
    if (!entities.asinKey) setKyView("campaign")
  }, [rows, std, measureOptions, entities.asinKey])

  const kpis = useMemo(() => computeOverall(rows, std), [rows, std])

  // Aggregations for KY performance
  const kyAgg = useMemo(() => {
    if (!rows.length || !kyMeasure) return { dim: "Dimension", data: [] as any[] }
    const dim = kyView === "campaign" ? entities.campaignKey : entities.asinKey
    if (!dim) return { dim: "Dimension", data: [] as any[] }
    const base = aggregateSumByKey(rows, dim, kyMeasure).sort((a, b) => (b[kyMeasure] ?? 0) - (a[kyMeasure] ?? 0))
    return { dim, data: base.slice(0, Number(kyTopN)) }
  }, [rows, kyMeasure, kyView, kyTopN, entities])

  // Aggregations for Explore-by-attribute
  const attrAgg = useMemo(() => {
    if (!rows.length || !attrMeasure) return { dim: "Dimension", data: [] as any[] }
    const dim =
      attr === "adtype"
        ? entities.adTypeKey
        : attr === "intent"
          ? entities.intentKey
          : attr === "campaign"
            ? entities.campaignKey
            : entities.categoryKey
    if (!dim) return { dim: "Dimension", data: [] as any[] }
    const base = aggregateSumByKey(rows, dim, attrMeasure).sort((a, b) => (b[attrMeasure] ?? 0) - (a[attrMeasure] ?? 0))
    return { dim, data: base.slice(0, Number(attrTopN)) }
  }, [rows, attr, attrMeasure, attrTopN, entities])

  const campaignBoard = useMemo(() => {
    if (!rows.length || !entities.campaignKey) return []
    return rankBy(rows, entities.campaignKey, std)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
  }, [rows, entities, std])

  const asinBoard = useMemo(() => {
    if (!rows.length || !entities.asinKey) return []
    return rankBy(rows, entities.asinKey, std)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
  }, [rows, entities, std])

  const onFiles = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const data = await readFile(f)
    setRows(data)
    setFileMeta({ name: f.name, size: f.size })
  }

  return (
    <div className="space-y-8">
      <Card className="bg-background/70 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Know your performance <Badge variant="secondary">Campaign & ASIN</Badge>
          </CardTitle>
          <CardDescription>Upload collated report (or similar) and explore clear, actionable stats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileDropzone
            label="Analysis data"
            description="Upload CSV/XLSX with Campaign Name, optional ASIN, and metrics"
            maxFiles={1}
            onFiles={onFiles}
            displayFiles={fileMeta ? [fileMeta] : []}
            onRemove={() => {
              setRows([])
              setFileMeta(null)
            }}
          />

          {rows.length > 0 && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Stat label="Sales" value={fmtCompact.format(kpis.R)} />
                <Stat label="Spend" value={fmtCompact.format(kpis.S)} />
                <Stat label="RoAS" value={fmtRoAS(kpis.RoAS)} tone="good" />
                <Stat label="ACoS" value={fmtPercent(kpis.ACoS)} tone="warn" />
                <Stat label="CTR" value={fmtPercent(kpis.CTR)} />
                <Stat label="CVR" value={fmtPercent(kpis.CVR)} />
              </div>

              {/* Controls */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>View by</Label>
                  <Select
                    value={kyView}
                    onValueChange={(v: "campaign" | "asin") => setKyView(v)}
                    disabled={!entities.asinKey && kyView === "asin"}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="asin" disabled={!entities.asinKey}>
                        ASIN
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Measure</Label>
                  <Select value={kyMeasure} onValueChange={setKyMeasure}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select measure" />
                    </SelectTrigger>
                    <SelectContent>
                      {measureOptions.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Top N</Label>
                  <Select value={kyTopN} onValueChange={(v: "5" | "10" | "15") => setKyTopN(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chart */}
              {kyAgg.data.length > 0 && kyMeasure && (
                <ChartContainer
                  config={{
                    value: { label: kyMeasure, color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[360px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kyAgg.data} margin={{ top: 10, right: 20, left: 10, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={kyAgg.dim} angle={-20} textAnchor="end" height={50} minTickGap={12} />
                      <YAxis tickFormatter={(v) => fmtCompact.format(v as number)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey={kyMeasure} fill="var(--color-value)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}

              {/* Leaderboards */}
              <div className="grid lg:grid-cols-2 gap-6">
                {campaignBoard.length > 0 && (
                  <Card className="bg-background/70 backdrop-blur border">
                    <CardHeader>
                      <CardTitle className="text-base">Top Campaigns (by Sales)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Leaderboard rows={campaignBoard} />
                    </CardContent>
                  </Card>
                )}
                {asinBoard.length > 0 && (
                  <Card className="bg-background/70 backdrop-blur border">
                    <CardHeader>
                      <CardTitle className="text-base">Top ASINs (by Sales)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Leaderboard rows={asinBoard} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Explore by attribute */}
      <Card className="bg-background/70 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Explore by attribute
            <Badge variant="outline">Ad type / Intent / Campaign / Category</Badge>
          </CardTitle>
          <CardDescription>See which segments contribute most to your selected metric.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">Upload a file above to explore attributes.</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Attribute</Label>
                  <Tabs value={attr} onValueChange={(v) => setAttr(v as any)} className="w-full rounded-xl">
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="adtype" disabled={!entities.adTypeKey}>
                        Ad type
                      </TabsTrigger>
                      <TabsTrigger value="intent" disabled={!entities.intentKey}>
                        Intent
                      </TabsTrigger>
                      <TabsTrigger value="campaign" disabled={!entities.campaignKey}>
                        Campaign
                      </TabsTrigger>
                      <TabsTrigger value="category" disabled={!entities.categoryKey}>
                        Category
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Measure</Label>
                  <Select value={attrMeasure} onValueChange={setAttrMeasure}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select measure" />
                    </SelectTrigger>
                    <SelectContent>
                      {measureOptions.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Top N</Label>
                  <Select value={attrTopN} onValueChange={(v: "5" | "10" | "15") => setAttrTopN(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {attrAgg.data.length > 0 && attrMeasure && (
                <ChartContainer
                  config={{
                    value: { label: attrMeasure, color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[360px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attrAgg.data} margin={{ top: 10, right: 20, left: 10, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={attrAgg.dim} angle={-20} textAnchor="end" height={50} minTickGap={12} />
                      <YAxis tickFormatter={(v) => fmtCompact.format(v as number)} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey={attrMeasure} fill="var(--color-value)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
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

function Leaderboard({
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
