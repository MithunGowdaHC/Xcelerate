import * as XLSX from "xlsx"

export type Row = Record<string, any>

function normalizeHeaderKey(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim()
}

export function normalizeHeader(s: string) {
  return normalizeHeaderKey(s)
}

function getHeaderMap(sample: Row, targetHeaders: string[]) {
  const sampleKeys = Object.keys(sample)
  const map = new Map<string, string>()
  const sampleNorm = new Map(sampleKeys.map((k) => [normalizeHeaderKey(k), k]))
  for (const target of targetHeaders) {
    const nk = normalizeHeaderKey(target)
    const found = sampleNorm.get(nk)
    if (found) map.set(target, found)
  }
  return map
}

export async function readFile(file: File): Promise<Row[]> {
  const array = await file.arrayBuffer()
  const wb = XLSX.read(array, { type: "array", cellDates: true, raw: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
  return rows
}

export function mapColumns(rows: Row[], columns: string[]): Row[] {
  if (!rows.length) return []
  const map = getHeaderMap(rows[0], columns)
  return rows.map((r) => {
    const out: Row = {}
    for (const col of columns) {
      const actual = map.get(col) ?? col
      out[col] = r[actual]
    }
    return out
  })
}

export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "DD-MM-YYYY" | "MMM DD, YYYY"

function excelDateToJSDate(serial: number) {
  const utc_days = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  return new Date(utc_value * 1000)
}

function parseMaybeDate(value: any): Date | null {
  if (value == null || value === "") return null

  // Already a valid JS date
  if (value instanceof Date && !isNaN(value.getTime())) return value

  // Excel serial number
  if (typeof value === "number" && isFinite(value)) {
    if (value > 59) return excelDateToJSDate(value)
  }

  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return null

    // 1) MMM DD, YYYY  → "Nov 01, 2025"
    let m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})$/)
    if (m) return new Date(`${m[1]} ${m[2]} ${m[3]}`)

    // 2) DD MMM YYYY  → "01 Nov 2025"
    m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/)
    if (m) return new Date(`${m[2]} ${m[1]} ${m[3]}`)

    // 3) DD-MMM-YYYY or DD/MMM/YYYY
    m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{4})$/)
    if (m) return new Date(`${m[2]} ${m[1]} ${m[3]}`)

    // 4) YYYY-MM-DD
    m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

    // 5) DD/MM/YYYY or DD-MM-YYYY
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  }

  return null
}

function formatDate(d: Date, fmt: DateFormat): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")

  if (fmt === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`
  if (fmt === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`
  if (fmt === "DD-MM-YYYY") return `${dd}-${mm}-${yyyy}`

  // NEW FORMAT
  if (fmt === "MMM DD, YYYY") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const mon = monthNames[d.getMonth()]
    return `${mon} ${dd}, ${yyyy}`
  }

  return `${yyyy}-${mm}-${dd}`
}

export function normalizeDateColumn(rows: Row[], column: string, format: DateFormat): Row[] {
  return rows.map((r) => {
    const raw = r[column]
    const date = parseMaybeDate(raw)
    if (!date) return r
    return { ...r, [column]: formatDate(date, format) }
  })
}

export function vlookupCategoryByCampaign(
  combined: Row[],
  mappingRows: Row[],
  sourceCampaignCol: string,
  outCategoryCol: string,
): Row[] {
  if (!mappingRows.length) return combined
  // map normalized campaign name to Category
  const keyMap = new Map<string, string>()
  const campaignKey = mappingRows[0]
    ? Object.keys(mappingRows[0]).find((k) => normalizeHeaderKey(k) === "campaignname")
    : sourceCampaignCol
  const categoryKey = mappingRows[0]
    ? Object.keys(mappingRows[0]).find((k) => normalizeHeaderKey(k) === "category")
    : outCategoryCol

  for (const row of mappingRows) {
    const name = String(row[campaignKey ?? sourceCampaignCol] ?? "").trim()
    const cat = String(row[categoryKey ?? outCategoryCol] ?? "").trim()
    if (name) keyMap.set(name.toLowerCase(), cat)
  }

  return combined.map((r) => {
    const name = String(r[sourceCampaignCol] ?? "").toLowerCase()
    return { ...r, [outCategoryCol]: keyMap.get(name) ?? "" }
  })
}

export function download(rows: Row[], filename: string, format: "csv" | "xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")

  let blob: Blob
  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  } else {
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function addAttributesByCampaign(
  combined: Row[],
  mappingRows: Row[],
  sourceCampaignCol: string,
  outCols: { category?: string; intent?: string; adType?: string } = {},
): Row[] {
  if (!mappingRows.length) return combined

  const desiredOut = {
    category: outCols.category ?? "Category",
    intent: outCols.intent ?? "Intent",
    adType: outCols.adType ?? "Ad type",
  }

  const first = mappingRows[0] ?? {}
  const keys = Object.keys(first)

  const findKey = (target: string) => keys.find((k) => normalizeHeaderKey(k) === normalizeHeaderKey(target))

  const campaignKey = findKey("Campaign Name") ?? sourceCampaignCol
  const categoryKey = findKey("Category")
  const intentKey = findKey("Intent")
  const adTypeKey = findKey("Ad type") ?? findKey("Adtype") ?? findKey("Ad-type")

  const map = new Map<string, { category?: string; intent?: string; adType?: string }>()

  for (const row of mappingRows) {
    const name = String(row[campaignKey] ?? "")
      .trim()
      .toLowerCase()
    if (!name) continue
    map.set(name, {
      category: categoryKey ? String(row[categoryKey] ?? "").trim() : undefined,
      intent: intentKey ? String(row[intentKey] ?? "").trim() : undefined,
      adType: adTypeKey ? String(row[adTypeKey] ?? "").trim() : undefined,
    })
  }

  return combined.map((r) => {
    const key = String(r[sourceCampaignCol] ?? "")
      .trim()
      .toLowerCase()
    const found = map.get(key)
    if (!found) {
      // Ensure columns exist even when no match
      return {
        ...r,
        [desiredOut.category]: r[desiredOut.category] ?? "",
        [desiredOut.intent]: r[desiredOut.intent] ?? "",
        [desiredOut.adType]: r[desiredOut.adType] ?? "",
      }
    }
    return {
      ...r,
      [desiredOut.category]: found.category ?? r[desiredOut.category] ?? "",
      [desiredOut.intent]: found.intent ?? r[desiredOut.intent] ?? "",
      [desiredOut.adType]: found.adType ?? r[desiredOut.adType] ?? "",
    }
  })
}
