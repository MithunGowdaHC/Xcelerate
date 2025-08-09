"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Visualize from "@/components/visualize"
import { motion } from "framer-motion"

export default function VisualizePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 md:py-14 flex-1">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Visualize />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
