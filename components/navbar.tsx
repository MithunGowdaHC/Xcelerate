"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { Menu, X, LineChart } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/powerbi", label: "PowerBI" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          "relative px-3 py-2 rounded-full text-sm transition-colors no-underline hover:no-underline",
          "hover:text-foreground/90 hover:shadow-[0_0_18px_rgba(99,102,241,.25)]",
          active ? "text-foreground" : "text-foreground",
        )}
      >
        <span className="relative z-10">{label}</span>
      </Link>
    )
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="
      sticky top-0 z-50 w-full
      border-b border-white/10 
      bg-background/40 
      backdrop-blur-xl 
      supports-[backdrop-filter]:bg-background/30
      shadow-[0_8px_32px_rgba(0,0,0,0.1)]
    "
    
      role="banner"
    >
      <nav className="container mx-auto grid grid-cols-3 items-center py-3 px-4">
        {/* Left: brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 no-underline hover:no-underline">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 grid place-items-center text-white shadow">
              <LineChart className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Excelerate</span>
          </Link>
        </div>

        {/* Center: nav links (md+) */}
        <div className="hidden md:flex items-center justify-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </div>

        {/* Right: theme toggle + login + mobile menu */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/login"
            className="hidden md:inline-flex rounded-full border px-4 py-2 text-sm no-underline hover:no-underline hover:bg-muted"
          >
            Login / Signup
          </Link>
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger aria-label="Open menu" className="p-2 rounded-full hover:bg-muted">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Menu</span>
                  <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-6 grid gap-2">
                  {LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2 no-underline hover:no-underline",
                        pathname === l.href ? "bg-muted text-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 no-underline hover:no-underline text-foreground hover:bg-muted"
                  >
                    Login / Signup
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
