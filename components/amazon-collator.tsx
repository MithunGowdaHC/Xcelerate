"use client"

import FileDropzone from "@/components/file-dropzone"
import PreviewTable from "@/components/preview-table"
import SuccessCheck from "@/components/success-check"
import MetricsSummary from "@/components/metrics-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  download,
  mapColumns,
  normalizeDateColumn,
  readFile,
  addAttributesByCampaign,
  type Row,
} from "@/lib/xlsx-utils"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useSessionState } from "@/hooks/use-session-state"

const AMAZON_COLUMNS = [
  "Date",
  "Campaign Name",
  "Portfolio name",
  "Impressions",
  "Clicks",
  "Spend",
  "14 Day Total Sales (₹)",
  "14 Day Total Orders (#)",
] as const

const METRIC_ORDER = ["Impressions", "Clicks", "Spend", "14 Day Total Sales (₹)", "14 Day Total Orders (#)"] as const

const METRIC_LABELS: Record<string, string> = {
  Impressions: "Impressions",
  Clicks: "Clicks",
  Spend: "Spend",
  "14 Day Total Sales (₹)": "Sales (₹)",
  "14 Day Total Orders (#)": "Orders",
}

type ReportData = { name: string; size?: number; rows: Row[] }
type Totals = Record<string, number>
type CategoryTotals = { category: string; totals: Totals }

type AmazonState = {
  reports: ReportData[]
  mapping: ReportData | null
  format: "csv" | "xlsx"
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "DD-MM-YYYY"
  outName: string
  preview: Row[]
  totals?: Totals
  byCategory?: CategoryTotals[]
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

function computeTotals(rows: Row[]): Totals {
  const totals: Totals = {}
  METRIC_ORDER.forEach((k) => (totals[k] = 0))
  for (const r of rows) {
    METRIC_ORDER.forEach((k) => {
      totals[k] += toNumber(r[k])
    })
  }
  return totals
}

function computeCategoryTotals(rows: Row[]): CategoryTotals[] {
  const hasCategory = rows.length > 0 && "Category" in rows[0]
  if (!hasCategory) return []
  const map = new Map<string, Totals>()
  for (const r of rows) {
    const catRaw = String((r as any).Category ?? "").trim()
    const cat = catRaw || "Uncategorized"
    if (!map.has(cat)) {
      const base: Totals = {}
      METRIC_ORDER.forEach((k) => (base[k] = 0))
      map.set(cat, base)
    }
    const agg = map.get(cat)!
    METRIC_ORDER.forEach((k) => {
      agg[k] += toNumber(r[k])
    })
  }
  return Array.from(map.entries())
    .map(([category, totals]) => ({ category, totals }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

export default function AmazonCollator() {
  const { toast } = useToast()
  const [state, setState] = useSessionState<AmazonState>("amazon.state.v3", {
    reports: [],
    mapping: null,
    format: "xlsx",
    dateFormat: "YYYY-MM-DD",
    outName: "amazon-collated",
    preview: [],
    totals: undefined,
    byCategory: undefined,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => setSuccess(false), [state])

  const canProcess = useMemo(() => state.reports.length >= 1 && state.reports.length <= 3, [state.reports.length])

  const handleReports = async (files: File[]) => {
    try {
      const arrays = await Promise.all(files.map(readFile))
      const reports: ReportData[] = arrays.map((rows, i) => ({ name: files[i].name, size: files[i].size, rows }))
      setState((prev) => ({ ...prev, reports }))
    } catch (e: any) {
      toast({
        title: "Failed to read files",
        description: e?.message ?? "Try different files.",
        variant: "destructive",
      })
    }
  }

  const removeReport = (index: number) => {
    setState((prev) => {
      const next = [...prev.reports]
      next.splice(index, 1)
      return { ...prev, reports: next }
    })
  }

  const handleMapping = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    try {
      const rows = await readFile(f)
      setState((prev) => ({ ...prev, mapping: { name: f.name, size: f.size, rows } }))
    } catch (e: any) {
      toast({
        title: "Failed to read mapping",
        description: e?.message ?? "Try a different file.",
        variant: "destructive",
      })
    }
  }

  const clearMapping = () => setState((prev) => ({ ...prev, mapping: null }))

  const onProcess = async () => {
    try {
      if (!canProcess) {
        toast({ title: "Please add 1–3 report files", variant: "destructive" })
        return
      }
      setLoading(true)
      const datasets = state.reports.map((r) => r.rows)
      const mapped = datasets.map((rows) => mapColumns(rows, [...AMAZON_COLUMNS]))
      let combined = mapped.flat()

      // Normalize Date
      combined = normalizeDateColumn(combined, "Date", state.dateFormat)

      // Optional mapping => add Category column
      if (state.mapping) {
        combined = addAttributesByCampaign(combined, state.mapping.rows, "Campaign Name", {
          category: "Category",
          intent: "Intent",
          adType: "Ad type",
        })
      }

      // Compute summaries from full combined dataset
      const totals = computeTotals(combined)
      const byCategory = computeCategoryTotals(combined)

      setState((prev) => ({
        ...prev,
        preview: combined.slice(0, 50),
        totals,
        byCategory,
      }))
      setSuccess(true)

      download(combined, state.outName || "amazon-collated", state.format)
      toast({ title: "File ready!", description: "Your combined file has been downloaded." })
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Processing failed",
        description: e?.message ?? "Please check your files and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-background/70 backdrop-blur border-violet-100/30 dark:border-violet-800/30 shadow-sm">
      <CardHeader className="rounded-t-2xl bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/40 dark:to-emerald-950/40">
        <CardTitle className="text-lg">Amazon Campaign Processor</CardTitle>
        <CardDescription>Upload your SP, SB and SD reports, optional mapping, and export CSV/XLSX.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <FileDropzone
            label="Amazon reports"
            description="Upload  CSV/XLSX reports"
            maxFiles={5}
            onFiles={handleReports}
            onRemove={removeReport}
            displayFiles={state.reports.map((r) => ({ name: r.name, size: r.size }))}
          />
          <div className="space-y-3">
            <FileDropzone
              label="Mapping sheet (optional)"
              description='Include columns "Campaign Name", "Category", "Intent", and "Ad type"'
              maxFiles={1}
              onFiles={handleMapping}
              onRemove={() => clearMapping()}
              displayFiles={state.mapping ? [{ name: state.mapping.name, size: state.mapping.size }] : []}
            />
            {state.mapping && (
              <Button variant="outline" size="sm" onClick={clearMapping} className="rounded-full bg-transparent">
                Remove mapping
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="outName">Output file name</Label>
            <Input
              id="outName"
              placeholder="amazon-collated"
              value={state.outName}
              onChange={(e) => setState((prev) => ({ ...prev, outName: e.target.value }))}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>File format</Label>
            <RadioGroup
              value={state.format}
              className="flex gap-4"
              onValueChange={(v) => setState((prev) => ({ ...prev, format: (v as "csv" | "xlsx") ?? "xlsx" }))}
            >
              <div className="flex items-center space-x-2 rounded-full px-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-full px-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (.csv)</Label>
              </div>
            </RadioGroup>
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

          <div className="flex items-end">
            <Button
              className="w-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-600/90 hover:to-emerald-600/90 shadow-md hover:shadow-lg transition"
              onClick={onProcess}
              disabled={!canProcess || loading}
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
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SuccessCheck show={success} />
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">File downloaded.</p>}
        </div>

        {/* Summary blocks above preview */}
        {state.totals && (
          <MetricsSummary
            totals={state.totals}
            byCategory={state.byCategory ?? []}
            order={[...METRIC_ORDER]}
            labels={METRIC_LABELS}
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
