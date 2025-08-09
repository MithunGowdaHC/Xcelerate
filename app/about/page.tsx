"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { motion } from "framer-motion"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 flex-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">About Excelerate</h1>
          <p className="text-muted-foreground mt-3">
            Excelerate is a modern tool to collate advertising reports, normalize dates, optionally map categories, and
            export clean CSV/XLSX files — all in your browser.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
