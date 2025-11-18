// components/sentiment/sentiment-table.tsx
"use client"
import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import PreviewTable from "@/components/preview-table"

export default function SentimentTable({ reviews = [] }: { reviews: any[] }) {
  // Normalize to the table-friendly rows
  const rows = useMemo(() => reviews.map((r:any, i:number) => ({
    No: i+1,
    Rating: r.rating ?? "",
    Date: r.createdAt ?? "",
    Author: r.author ?? "",
    Review: (r.text || r.review || "").slice(0, 500)
  })), [reviews])

  return (
    <Card className="mt-4">
      <CardContent>
        <h4 className="font-semibold mb-3">Review sample</h4>
        <PreviewTable rows={rows} maxRows={10} />
      </CardContent>
    </Card>
  )
}
