"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  FileSpreadsheet,
  Zap,
  Shield,
  CheckCircle2,
  Package,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Store,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useRef, useEffect } from "react"

export default function HomePage() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      scrollContainer.scrollLeft += e.deltaY
    }

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
    return () => scrollContainer.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#d9caff_0%,#f7f3ff_10%,#d8fae9_80%)] dark:bg-black" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-emerald-100 dark:from-violet-900/30 dark:to-emerald-900/30 backdrop-blur border border-violet-200/30 dark:border-violet-800/30"
              >
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
                  Transform Your Campaign Data Instantly
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
              >
                <span className="text-foreground">Process Reports</span>
                <br />
                <span className="bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
                  In Seconds
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground max-w-xl"
              >
                Collate, clean, and export campaign data—all in your browser. Fast, secure, zero uploads.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/visualize">
                  <Button
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white px-8 shadow-lg hover:shadow-xl"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="rounded-xl">
                    Learn More
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-8 pt-4"
              >
                {[
                  { value: "2", label: "Active" },
                  { value: "100%", label: "Browser-Based" },
                  { value: "0", label: "Uploads" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Side Feature Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
              className="hidden lg:grid grid-cols-2 gap-4 -translate-y-20"
            >
              {[
                { icon: FileSpreadsheet, title: "Smart Processing", color: "violet" },
                { icon: Zap, title: "Lightning Fast", color: "emerald" },
                { icon: Shield, title: "100% Secure", color: "blue" },
                { icon: CheckCircle2, title: "Easy Export", color: "purple" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, scale: 0.8, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{ delay: 0.7 + i * 0.15, type: "spring", stiffness: 120, damping: 12, mass: 0.8 }}
                  whileHover={{ y: -8, scale: 1.05, rotateY: 2, transition: { type: "spring", stiffness: 400, damping: 17 } }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur cursor-pointer group hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20 transition-shadow duration-300"
                >
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden",
                      feature.color === "violet" && "bg-violet-100 dark:bg-violet-950/30",
                      feature.color === "emerald" && "bg-emerald-100 dark:bg-emerald-950/30",
                      feature.color === "blue" && "bg-blue-100 dark:bg-blue-950/30",
                      feature.color === "purple" && "bg-purple-100 dark:bg-purple-950/30"
                    )}
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
                  >
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.9 + i * 0.15, type: "spring", stiffness: 200, damping: 15 }}>
                      <feature.icon
                        className={cn(
                          "w-6 h-6 relative z-10",
                          feature.color === "violet" && "text-violet-600 dark:text-violet-400",
                          feature.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                          feature.color === "blue" && "text-blue-600 dark:text-blue-400",
                          feature.color === "purple" && "text-purple-600 dark:text-purple-400"
                        )}
                      />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.div>
                  <motion.h3 className="font-semibold text-foreground" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.15 }}>
                    {feature.title}
                  </motion.h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROCESSORS - HORIZONTAL SCROLL */}
      <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-violet-100 to-emerald-100 dark:from-violet-900/30 dark:to-emerald-900/30 backdrop-blur border border-violet-200/30 dark:border-violet-800/30"
            >
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
                Campaign Processors
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            >
              <span className="text-foreground">Powerful</span>{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">Processors</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground flex items-center justify-center gap-2"
            >
              <span>Scroll to explore</span>
              <motion.span animate={{ x: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="inline-block">
                →
              </motion.span>
            </motion.p>
          </motion.div>
        </div>

        {/* FIXED: Proper horizontal scroll container */}
        <div className="relative">
          <div 
            ref={scrollRef}
            className="overflow-x-scroll overflow-y-hidden pb-6 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-6 px-4" style={{ width: 'max-content' }}>
              {[
                {
                  name: "Amazon Processor",
                  desc: "Sponsored Products, Brands & Display",
                  icon: Package,
                  status: "active",
                  gradient: "from-orange-500 to-red-500",
                  link: "/amazon",
                },
                {
                  name: "Multi-File Collation",
                  desc: "Combine up to 10 files",
                  icon: FileSpreadsheet,
                  status: "active",
                  gradient: "from-blue-500 to-cyan-500",
                  link: "/multi-collate",
                },
                {
                  name: "Flipkart Processor",
                  desc: "Tailored for Flipkart reports",
                  icon: ShoppingCart,
                  status: "coming",
                  gradient: "from-yellow-500 to-orange-500",
                  link: "/coming-soon",
                },
                {
                  name: "Zepto Processor",
                  desc: "Quick commerce insights",
                  icon: Zap,
                  status: "coming",
                  gradient: "from-purple-500 to-pink-500",
                  link: "/coming-soon",
                },
                {
                  name: "Swiggy Processor",
                  desc: "Food delivery campaign analytics",
                  icon: UtensilsCrossed,
                  status: "coming",
                  gradient: "from-orange-400 to-red-400",
                  link: "/coming-soon",
                },
                {
                  name: "Blinkit Processor",
                  desc: "Instant delivery performance",
                  icon: Store,
                  status: "coming",
                  gradient: "from-green-500 to-emerald-500",
                  link: "/coming-soon",
                },
              ].map((processor, i) => (
                <motion.div
                  key={i}
                  className="w-[340px] flex-shrink-0"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                >
                  <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="h-full border-border bg-card/80 backdrop-blur hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20 transition-all duration-300 overflow-hidden group">
                      <CardContent className="p-6 relative">
                        <motion.div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br", processor.gradient)} />
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <motion.div
                            className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg relative overflow-hidden", processor.gradient)}
                            whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
                          >
                            <motion.div initial={{ scale: 0, rotate: -180 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200, damping: 15 }}>
                              <processor.icon className="w-6 h-6 text-white relative z-10" />
                            </motion.div>
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.6 }} />
                          </motion.div>
                          
                          {processor.status === "active" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                          )}
                        </div>
                        
                        <motion.h3 className="text-lg font-semibold mb-2 text-foreground relative z-10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}>
                          {processor.name}
                        </motion.h3>
                        
                        <motion.p className="text-sm text-muted-foreground mb-4 relative z-10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }}>
                          {processor.desc}
                        </motion.p>
                        
                        {processor.status === "active" ? (
                          <Link href={processor.link}>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button className={cn("w-full rounded-xl bg-gradient-to-r text-white text-sm shadow-lg hover:shadow-xl transition-all duration-300 relative z-10", processor.gradient)}>
                                Start Processing
                                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                                  <ArrowRight className="ml-2 w-4 h-4 inline" />
                                </motion.span>
                              </Button>
                            </motion.div>
                          </Link>
                        ) : (
                          <Button disabled className="w-full rounded-xl text-sm relative z-10">
                            Coming Soon
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
          {[
            { step: "1", title: "Upload", desc: "Drop your CSV/XLSX files" },
            { step: "2", title: "Process", desc: "Clean & organize data" },
            { step: "3", title: "Export", desc: "Download or visualize" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-emerald-100 dark:from-violet-950/30 dark:to-emerald-950/30 flex items-center justify-center border-2 border-violet-200 dark:border-violet-800">
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-500/10 via-background to-emerald-500/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join marketers who trust Excelerate for campaign data processing.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/visualize">
                <Button size="lg" className="rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white px-8 shadow-lg">
                  Start Processing Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}