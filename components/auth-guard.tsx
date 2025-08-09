"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/client-auth"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace("/login")
    } else {
      setReady(true)
    }
  }, [router])
  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
  return <>{children}</>
}
