"use client"

import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="mt-20 ml-10 border-t bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-xl font-semibold">Excelerate</div>
            <p className="text-sm text-muted-foreground mt-3">
              Premium in‑browser ad report collation. Private. Fast. Beautiful.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link className="hover:text-foreground no-underline hover:no-underline" href="/amazon">
                  Amazon Processor
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground no-underline hover:no-underline" href="/multi-collate">
                  Multiple File Collation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link className="hover:text-foreground no-underline hover:no-underline" href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground no-underline hover:no-underline" href="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Follow</h4>
            <div className="mt-3 flex gap-3 text-muted-foreground">
              <a
                href="https://github.com/MithunGowdaHC"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>

              <a
                href="https://www.linkedin.com/in/mithungowda10/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-foreground transition-colors"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a
                href="mailto:mithungowdahc12a@gmail.com"
                aria-label="Email"
                className="hover:text-foreground transition-colors"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Excelerate. Crafted by <a href="https://www.linkedin.com/in/mithungowda10/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Mithun Gowda</a>. All rights reserved.
          © {new Date().getFullYear()} Excelerate. Crafted by Mithun Gowda. All rights reserved.
         
        </div>
      </div>
    </footer>
  )
}
