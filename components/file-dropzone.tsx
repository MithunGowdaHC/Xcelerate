"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { UploadCloud, FileSpreadsheet, FileUp, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type FileMeta = { name: string; size?: number }

type Props = {
  label?: string
  description?: string
  maxFiles?: number
  accept?: string
  onFiles?: (files: File[]) => void
  onRemove?: (index: number) => void
  displayFiles?: FileMeta[]
  className?: string
}

export default function FileDropzone({
  label = "Upload files",
  description = "Drag and drop CSV or Excel files here, or click to browse.",
  maxFiles = 5,
  accept = ".csv, .xlsx, .xls",
  onFiles = () => {},
  onRemove,
  displayFiles,
  className = "",
}: Props) {
  const [isOver, setIsOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const next = Array.from(list).slice(0, maxFiles)
    setFiles(next)
    onFiles(next)
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsOver(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const shown = displayFiles ?? files.map<FileMeta>((f) => ({ name: f.name, size: f.size }))

  return (
    <div className={cn("w-full", className)}>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative grid place-items-center rounded-2xl border-2 border-dashed p-6 md:p-8 cursor-pointer",
          "bg-background/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all",
          isOver
            ? "border-violet-400/70 bg-gradient-to-br from-violet-50/70 to-emerald-50/70 dark:from-violet-900/10 dark:to-emerald-900/10"
            : "border-muted-foreground/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <motion.div
          layout
          className="flex flex-col items-center text-center gap-2"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          onClick={() => inputRef.current?.click()}
        >
          <motion.div
            animate={{ y: isOver ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            className="rounded-full p-3 bg-gradient-to-br from-violet-500/15 to-emerald-500/15"
          >
            {shown.length ? (
              <FileSpreadsheet className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            ) : (
              <UploadCloud className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            )}
          </motion.div>
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-foreground/80">{description}</p>
            <p className="text-xs text-foreground/80">{`Max ${maxFiles} file${maxFiles > 1 ? "s" : ""}`}</p>
          </div>
        </motion.div>
        <AnimatePresence>
          {isOver && (
            <motion.div
              className="absolute inset-0 rounded-2xl ring-2 ring-violet-400/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </label>

      <AnimatePresence>
        {shown.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3"
          >
            <div className="flex flex-wrap gap-2">
              {shown.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-background/80 shadow-sm"
                >
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{f.name}</span>
                  {typeof f.size === "number" && (
                    <span className="text-xs text-muted-foreground">{`${(f.size / 1024).toFixed(1)} KB`}</span>
                  )}
                  <button
                    className="ml-1 rounded-full hover:bg-muted p-1"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => {
                      if (displayFiles) {
                        onRemove?.(i)
                      } else {
                        const next = [...files]
                        next.splice(i, 1)
                        setFiles(next)
                        onFiles(next)
                      }
                    }}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
