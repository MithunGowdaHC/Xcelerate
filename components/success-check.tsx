"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

export default function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-sm dark:bg-emerald-900/30"
        >
          <CheckCircle2 className="h-4 w-4" />
          Success
        </motion.div>
      )}
    </AnimatePresence>
  )
}
