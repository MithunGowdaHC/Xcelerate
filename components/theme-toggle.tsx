"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { MoonStar, Sun, SunMedium } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const isDark = (resolvedTheme ?? theme) === "light"
  return (
    <Button
      size="icon"
      variant="ghost"
      className="rounded-full hover:shadow-[0_0_20px_rgba(124,58,237,0.25)]"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "dark" : "light")}
    >
      {isDark ? <MoonStar className="h-5 w-5" /> : <SunMedium className="h-5 w-5" />}
    </Button>
  )
}
