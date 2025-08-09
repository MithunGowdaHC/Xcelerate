"use client"

import Navbar from "@/components/navbar"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Store, ShoppingBasket, Rocket } from "lucide-react"

const items = [
  { title: "Flipkart", icon: Store },
  { title: "Blinkit", icon: ShoppingBasket },
  { title: "Zepto", icon: Zap },
]

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">Integrations Coming Soon</h1>
          <p className="text-center text-muted-foreground mt-2">Flipkart, Blinkit, and Zepto are on the way.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {items.map((it, idx) => {
              const Icon = it.icon
              return (
                <motion.div
                  key={it.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-background/70 backdrop-blur relative overflow-hidden">
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {it.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <motion.div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-primary/10 text-primary text-xs"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                      >
                        <Rocket className="h-4 w-4" />
                        Coming Soon
                      </motion.div>
                    </CardContent>
                    <motion.div
                      aria-hidden
                      className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-primary/10"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4 }}
                    />
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
