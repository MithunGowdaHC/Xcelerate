"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Package, Zap, ShoppingCart, CheckCircle2 } from "lucide-react"
import AmazonCollator from "@/components/amazon-collator"
import GenericCollator from "@/components/generic-collator"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-20%,theme(colors.violet.200/50),transparent),radial-gradient(800px_300px_at_85%_0%,theme(colors.emerald.200/40),transparent)] dark:bg-[radial-gradient(1200px_600px_at_50%_-20%,theme(colors.violet.900/25),transparent),radial-gradient(800px_300px_at_85%_0%,theme(colors.emerald.900/20),transparent)]" />
          <div className="container mx-auto px-4 py-12 md:py-16">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-center"
            >
              Campaign Processors
            </motion.h1>
            <p className="text-center text-foreground/80 mt-2">
              Collate reports and export clean CSV/XLSX files. All in-browser.
            </p>

            <div className="mt-8 max-w-5xl mx-auto space-y-4">
              <Accordion type="single" collapsible defaultValue="amazon" className="space-y-4">
                <AccordionItem value="amazon" className="rounded-2xl border bg-background/70 backdrop-blur px-3">
                  <AccordionTrigger className="py-4 cursor-pointer select-none no-underline hover:no-underline decoration-transparent hover:decoration-transparent">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-violet-600" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Amazon Campaign Processor</span>
                          <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white gap-1 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </Badge>
                        </div>
                        <div className="text-xs text-foreground/80">
                          Process Sponsored Products, Brands, and Display reports
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <AmazonCollator />
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="multi" className="rounded-2xl border bg-background/70 backdrop-blur px-3">
                  <AccordionTrigger className="py-4 cursor-pointer select-none no-underline hover:no-underline decoration-transparent hover:decoration-transparent">
                    <div className="flex items-center gap-4">
                      <Package className="h-5 w-5 text-violet-600" />
                      <div className="text-left">
                        <span className="font-semibold">Multiple File Collation</span>
                        <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white gap-1 shadow-sm ml-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </Badge>
                        <div className="text-xs text-foreground/80">Combine up to 10 files with chosen columns</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <GenericCollator />
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="flipkart" className="rounded-2xl border bg-background/70 backdrop-blur px-3">
                  <AccordionTrigger className="py-4 cursor-pointer select-none no-underline hover:no-underline decoration-transparent hover:decoration-transparent">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-violet-600" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Flipkart Campaign Processor</span>
                          <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
                            Coming Soon
                          </Badge>
                        </div>
                        <div className="text-xs text-foreground/80">
                          Flipkart-specific columns and charts tailored for their reports
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                      We’re building Flipkart support next, with its own column mappings and visualizations.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="zepto" className="rounded-2xl border bg-background/70 backdrop-blur px-3">
                  <AccordionTrigger className="py-4 cursor-pointer select-none no-underline hover:no-underline decoration-transparent hover:decoration-transparent">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-violet-600" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Zepto Campaign Processor</span>
                          <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
                            Coming Soon
                          </Badge>
                        </div>
                        <div className="text-xs text-foreground/80">Optimization and insights</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
                      We’re building this integration. Follow updates on our socials.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
