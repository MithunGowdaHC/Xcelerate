"use client"

import FileDropzone from "@/components/file-dropzone"
import PreviewTable from "@/components/preview-table"
import SuccessCheck from "@/components/success-check"
import MetricsSummary from "@/components/metrics-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { download, mapColumns, normalizeDateColumn, normalizeHeader, readFile, type Row } from "@/lib/xlsx-utils"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useSessionState } from "@/hooks/use-session-state"

type ReportData = { name: string; size?: number; rows: Row[] }
type Totals = Record<string, number>
type CategoryTotals = { category: string; totals: Totals }

type GenericState = {
  files: ReportData[]
  columnsText: string
  format: "csv" | "xlsx"
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "DD-MM-YYYY"
  outName: string
  preview: Row[]
  totals?: Totals
  byCategory?: CategoryTotals[]
}

const TARGET_KEYS = ["impressions", "clicks", "spend", "sales", "orders"] as const
const DEFAULT_LABELS: Record<string, string> = {
  impressions: "Impressions",
  clicks: "Clicks",
  spend: "Spend",
  sales: "Sales",
  orders: "Orders",
}

function toNumber(v: any): number {
  if (typeof v === "number") return isFinite(v) ? v : 0
  if (typeof v === "string") {
    const s = v.replace(/[^0-9.-]/g, "").trim()
    const n = Number.parseFloat(s)
    return isFinite(n) ? n : 0
  }
  return 0
}

function findKeyMap(sample: Row) {
  const keys = Object.keys(sample)
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const map = new Map<string, string>()
  for (const k of keys) {
    const nk = norm(k)
    for (const target of TARGET_KEYS) {
      if (!map.has(target) && nk.includes(target)) {
        map.set(target, k)
      }
    }
    if (!map.has("category") && nk === "category") {
      map.set("category", k)
    }
  }
  return map
}

function computeTotals(rows: Row[]): { totals: Totals; byCategory: CategoryTotals[] } {
  if (!rows.length) return { totals: {}, byCategory: [] }
  const map = findKeyMap(rows[0])
  const totals: Totals = {}
  TARGET_KEYS.forEach((t) => (totals[t] = 0))
  const catKey = map.get("category")

  for (const r of rows) {
    TARGET_KEYS.forEach((t) => {
      const actual = map.get(t)
      if (actual) totals[t] += toNumber(r[actual])
    })
  }

  const byCategory: CategoryTotals[] = []
  if (catKey) {
    const agg = new Map<string, Totals>()
    for (const r of rows) {
      const cat = String(r[catKey] ?? "").trim() || "Uncategorized"
      if (!agg.has(cat)) {
        const base: Totals = {}
        TARGET_KEYS.forEach((t) => (base[t] = 0))
        agg.set(cat, base)
      }
      const tmap = agg.get(cat)!
      TARGET_KEYS.forEach((t) => {
        const actual = map.get(t)
        if (actual) tmap[t] += toNumber(r[actual])
      })
    }
    agg.forEach((t, c) => byCategory.push({ category: c, totals: t }))
    byCategory.sort((a, b) => a.category.localeCompare(b.category))
  }

  return { totals, byCategory }
}

export default function GenericCollator() {
  const { toast } = useToast()
  const [state, setState] = useSessionState<GenericState>("generic.state.v3", {
    files: [],
    columnsText: "Date, Campaign Name, Impressions, Clicks, Spend",
    format: "xlsx",
    dateFormat: "YYYY-MM-DD",
    outName: "collated-output",
    preview: [],
    totals: undefined,
    byCategory: undefined,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const parseColumns = () => {
    const parts = state.columnsText
      .split(/\n|,/g)
      .map((s) => s.trim())
      .filter(Boolean)
    return Array.from(new Set(parts))
  }

  const handleFiles = async (files: File[]) => {
    try {
      const arrays = await Promise.all(files.map(readFile))
      const packaged: ReportData[] = arrays.map((rows, i) => ({ name: files[i].name, size: files[i].size, rows }))
      setState((prev) => ({ ...prev, files: packaged }))
      setSuccess(false)
    } catch (e: any) {
      toast({
        title: "Failed to read files",
        description: e?.message ?? "Try different files.",
        variant: "destructive",
      })
    }
  }

  const removeAt = (index: number) => {
    setState((prev) => {
      const next = [...prev.files]
      next.splice(index, 1)
      return { ...prev, files: next }
    })
    setSuccess(false)
  }

  const onProcess = async () => {
    if (state.files.length < 1) {
      toast({ title: "Please upload at least one file", variant: "destructive" })
      return
    }
    const cols = parseColumns()
    if (!cols.length) {
      toast({ title: "Add at least one column to extract", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const mapped = state.files.map((f) => mapColumns(f.rows, cols))
      let combined = mapped.flat()

      // If a Date-like column exists, normalize it
      const dateColKey = cols.find((c) => normalizeHeader(c) === "date")
      if (dateColKey) {
        combined = normalizeDateColumn(combined, dateColKey, state.dateFormat)
      }

      // Compute totals and by-category (if Category column present)
      const { totals, byCategory } = computeTotals(combined)

      setState((prev) => ({ ...prev, preview: combined.slice(0, 50), totals, byCategory }))
      setSuccess(true)
      download(combined, state.outName || "collated-output", state.format)
      toast({ title: "File ready!", description: "Your combined file has been downloaded." })
    } catch (e: any) {
      console.error(e)
      toast({ title: "Processing failed", description: e?.message ?? "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30 shadow-sm">
      <CardHeader className="rounded-t-2xl bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
        <CardTitle className="text-lg">Multiple File Collation</CardTitle>
        <CardDescription>Drop up to 10 files and choose columns to extract.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <FileDropzone
          maxFiles={10}
          onFiles={handleFiles}
          onRemove={removeAt}
          displayFiles={state.files.map((f) => ({ name: f.name, size: f.size }))}
        />

        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="columns">Columns to extract</Label>
            <Textarea
              id="columns"
              placeholder="Enter columns separated by comma or newline"
              value={state.columnsText}
              onChange={(e) => setState((prev) => ({ ...prev, columnsText: e.target.value }))}
              className="min-h-[120px] rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Example: Date, Campaign Name, Portfolio name, Impressions, Clicks, Spend
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outName">Output file name</Label>
            <Input
              id="outName"
              value={state.outName}
              onChange={(e) => setState((prev) => ({ ...prev, outName: e.target.value }))}
              className="rounded-xl"
            />
            <div className="mt-4 space-y-2">
              <Label>File format</Label>
              <RadioGroup
                value={state.format}
                className="flex gap-4"
                onValueChange={(v) => setState((prev) => ({ ...prev, format: (v as "csv" | "xlsx") ?? "xlsx" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx">Excel (.xlsx)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV (.csv)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFmt">Date format</Label>
            <Select
              value={state.dateFormat}
              onValueChange={(v) => setState((prev) => ({ ...prev, dateFormat: v as any }))}
            >
              <SelectTrigger id="dateFmt" className="rounded-xl">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full md:w-auto rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-600/90 hover:to-emerald-600/90 shadow-md hover:shadow-lg transition"
          disabled={loading || state.files.length === 0}
          onClick={onProcess}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Collate and Download"
          )}
        </Button>

        <div className="mt-3 flex items-center gap-2">
          <SuccessCheck show={success} />
          {success && <span className="text-sm text-emerald-600 dark:text-emerald-400">File downloaded.</span>}
        </div>

        {/* Summary blocks above preview */}
        {state.totals && (
          <MetricsSummary
            totals={state.totals}
            byCategory={state.byCategory ?? []}
            order={["impressions", "clicks", "spend", "sales", "orders"]}
            labels={DEFAULT_LABELS}
          />
        )}

        <div>
          <h3 className="font-semibold mb-2">Preview</h3>
          <PreviewTable rows={state.preview} />
        </div>
      </CardContent>
    </Card>
  )
}
